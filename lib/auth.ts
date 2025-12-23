import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthToken } from './types';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'agent-47-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Get all users from file
function getUsers(): User[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    // Create default admin user
    const defaultUsers: User[] = [
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@codershive.in',
        password: bcrypt.hashSync('admin123', 10),
        displayName: 'Admin Agent',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    return defaultUsers;
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

// Save users to file
function saveUsers(users: User[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload: AuthToken = {
    userId: user.id,
    username: user.username,
    role: user.role,
    googleSheetId: user.googleSheetId,
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
  };
  return jwt.sign(payload, JWT_SECRET);
}

// Verify JWT token
export function verifyToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken;
  } catch {
    return null;
  }
}

// Find user by username
export function findUserByUsername(username: string): User | null {
  const users = getUsers();
  return users.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
}

// Find user by ID
export function findUserById(id: string): User | null {
  const users = getUsers();
  return users.find((u) => u.id === id) || null;
}

// Create new user
export async function createUser(
  username: string,
  email: string,
  password: string,
  displayName: string,
  role: 'admin' | 'agent' = 'agent'
): Promise<User | null> {
  const users = getUsers();

  // Check if username already exists
  if (users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
    return null;
  }

  const hashedPassword = await hashPassword(password);
  const newUser: User = {
    id: uuidv4(),
    username,
    email,
    password: hashedPassword,
    displayName,
    role,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

// Authenticate user
export async function authenticateUser(
  username: string,
  password: string
): Promise<{ user: User; token: string } | null> {
  const user = findUserByUsername(username);
  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  // Update last login
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === user.id);
  if (userIndex >= 0) {
    users[userIndex].lastLogin = new Date().toISOString();
    saveUsers(users);
  }

  const token = generateToken(user);
  return { user: { ...user, password: '' }, token };
}

// Get all users (without passwords)
export function getAllUsers(): Omit<User, 'password'>[] {
  const users = getUsers();
  return users.map(({ password, ...user }) => user);
}

// Delete user
export function deleteUser(userId: string): boolean {
  const users = getUsers();
  const filteredUsers = users.filter((u) => u.id !== userId);
  if (filteredUsers.length === users.length) {
    return false;
  }
  saveUsers(filteredUsers);
  return true;
}

// Update user
export async function updateUser(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<User | null> {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex < 0) {
    return null;
  }

  if (updates.password) {
    updates.password = await hashPassword(updates.password);
  }

  users[userIndex] = { ...users[userIndex], ...updates };
  saveUsers(users);
  return { ...users[userIndex], password: '' };
}
