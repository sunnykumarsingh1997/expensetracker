'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  Users,
  Sun,
  Moon,
  Shield,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  Coins,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuthStore, useThemeStore, useCurrencyStore } from '@/lib/store';
import { User as UserType, Currency } from '@/lib/types';
import { CURRENCIES, CURRENCY_CONFIG } from '@/lib/currency';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const { currency, setCurrency } = useCurrencyStore();
  const [users, setUsers] = useState<Omit<UserType, 'password'>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });

  const fetchUsers = async () => {
    if (user?.role !== 'admin') return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Fetch users error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user?.role]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User created successfully!');
        setNewUser({ username: '', email: '', password: '', displayName: '' });
        setShowAddUser(false);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Add user error:', error);
      toast.error('Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch('/api/auth/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('User deleted successfully!');
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-hitman-gradient">
      <Navbar />

      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-hitman text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-hitman-silver" />
            SETTINGS
          </h1>
          <p className="text-gray-400 mt-1">Configure your agent preferences</p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="agent-card"
          >
            <h2 className="font-hitman text-lg font-bold text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-hitman-red" />
              AGENT PROFILE
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-hitman-red/20 border-2 border-hitman-red flex items-center justify-center">
                  <User className="w-10 h-10 text-hitman-red" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {user?.displayName || 'Agent'}
                  </h3>
                  <p className="text-gray-400">@{user?.username}</p>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                      user?.role === 'admin'
                        ? 'bg-hitman-gold/20 text-hitman-gold'
                        : 'bg-hitman-silver/20 text-hitman-silver'
                    }`}
                  >
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 p-4 bg-hitman-black/50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-white">{user?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-white">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Theme Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="agent-card"
          >
            <h2 className="font-hitman text-lg font-bold text-white mb-6 flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-hitman-silver" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
              APPEARANCE
            </h2>

            <div className="flex gap-4">
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark'
                    ? 'bg-hitman-gunmetal border-hitman-red'
                    : 'bg-hitman-black/50 border-hitman-gunmetal hover:border-gray-500'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <Moon className="w-8 h-8 text-hitman-silver" />
                  <span className="text-white font-medium">Dark Mode</span>
                  <span className="text-gray-500 text-xs">Hitman Style</span>
                  {theme === 'dark' && (
                    <Check className="w-5 h-5 text-hitman-red" />
                  )}
                </div>
              </button>

              <button
                onClick={() => setTheme('light')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  theme === 'light'
                    ? 'bg-white/10 border-hitman-red'
                    : 'bg-hitman-black/50 border-hitman-gunmetal hover:border-gray-500'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <Sun className="w-8 h-8 text-yellow-400" />
                  <span className="text-white font-medium">Light Mode</span>
                  <span className="text-gray-500 text-xs">Clean Style</span>
                  {theme === 'light' && (
                    <Check className="w-5 h-5 text-hitman-red" />
                  )}
                </div>
              </button>
            </div>
          </motion.div>

          {/* Currency Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="agent-card"
          >
            <h2 className="font-hitman text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Coins className="w-5 h-5 text-hitman-gold" />
              CURRENCY
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {CURRENCIES.map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    currency === curr
                      ? 'bg-hitman-gold/10 border-hitman-gold'
                      : 'bg-hitman-black/50 border-hitman-gunmetal hover:border-gray-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl font-bold text-white">
                      {CURRENCY_CONFIG[curr].symbol}
                    </span>
                    <span className="text-white font-medium">{curr}</span>
                    <span className="text-gray-500 text-xs">
                      {CURRENCY_CONFIG[curr].label}
                    </span>
                    {currency === curr && (
                      <Check className="w-5 h-5 text-hitman-gold" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* User Management (Admin Only) */}
          {user?.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="agent-card"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-hitman text-lg font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-hitman-gold" />
                  USER MANAGEMENT
                </h2>
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="flex items-center gap-2 px-4 py-2 bg-hitman-red/20 text-hitman-red rounded-lg hover:bg-hitman-red hover:text-white transition-colors"
                >
                  {showAddUser ? (
                    <>
                      <X className="w-4 h-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add User
                    </>
                  )}
                </button>
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddUser}
                  className="mb-6 p-4 bg-hitman-black/50 rounded-xl space-y-4"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={newUser.displayName}
                        onChange={(e) =>
                          setNewUser({ ...newUser, displayName: e.target.value })
                        }
                        required
                        className="netflix-input"
                        placeholder="Agent Name"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) =>
                          setNewUser({ ...newUser, username: e.target.value })
                        }
                        required
                        className="netflix-input"
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) =>
                          setNewUser({ ...newUser, email: e.target.value })
                        }
                        required
                        className="netflix-input"
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newUser.password}
                          onChange={(e) =>
                            setNewUser({ ...newUser, password: e.target.value })
                          }
                          required
                          minLength={6}
                          className="netflix-input pr-12"
                          placeholder="Min 6 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="hitman-btn w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Create User'
                    )}
                  </button>
                </motion.form>
              )}

              {/* Users List */}
              <div className="space-y-3">
                {isLoading && !showAddUser ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-hitman-gold animate-spin" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No users found</p>
                ) : (
                  users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 bg-hitman-black/50 rounded-xl border border-hitman-gunmetal"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-hitman-gunmetal flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.displayName}</p>
                          <p className="text-gray-500 text-sm">@{u.username}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            u.role === 'admin'
                              ? 'bg-hitman-gold/20 text-hitman-gold'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>

                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="agent-card"
          >
            <h2 className="font-hitman text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              SECURITY
            </h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl border border-green-500/30">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400" />
                  <span className="text-white">Session Active</span>
                </div>
                <span className="text-green-400 text-sm">Secured</span>
              </div>

              <div className="p-4 bg-hitman-black/50 rounded-xl">
                <p className="text-gray-400 text-sm">
                  All data is synced with Google Sheets and documents are securely stored
                  in Paperless-ngx. Notifications are sent via WhatsApp through n8n.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
