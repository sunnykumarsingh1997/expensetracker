'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Eye, EyeOff, Loader2, User, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
  });

  const router = useRouter();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const body = isRegister
        ? formData
        : { username: formData.username, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        login(data.data.user, data.data.token);
        toast.success(isRegister ? 'Account created successfully!' : 'Welcome back, Agent!');
        router.push('/dashboard');
      } else {
        toast.error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-hitman-gradient flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 bg-agent-pattern opacity-50" />

      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-hitman-red/30 rounded-full"
            style={{
              left: `${20 + i * 15}%`,
              top: `${10 + i * 20}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="relative mb-4">
            <Target className="w-20 h-20 text-hitman-red" />
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(196, 30, 58, 0)',
                  '0 0 0 20px rgba(196, 30, 58, 0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <h1 className="font-hitman text-3xl font-bold text-white tracking-wider">
            AGENT EXPENSE
          </h1>
          <p className="text-gray-400 mt-2">CODERSHIVE TRACKER</p>
        </motion.div>

        {/* Card */}
        <div className="agent-card">
          {/* Tabs */}
          <div className="flex mb-6">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-3 text-center font-medium transition-colors relative ${
                !isRegister ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Sign In
              {!isRegister && (
                <motion.div
                  layoutId="authTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-hitman-red"
                />
              )}
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-3 text-center font-medium transition-colors relative ${
                isRegister ? 'text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Register
              {isRegister && (
                <motion.div
                  layoutId="authTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-hitman-red"
                />
              )}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {isRegister && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Display Name */}
                  <div className="relative">
                    <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      name="displayName"
                      placeholder="Display Name"
                      value={formData.displayName}
                      onChange={handleChange}
                      required={isRegister}
                      className="netflix-input pl-12"
                    />
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                      required={isRegister}
                      className="netflix-input pl-12"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                className="netflix-input pl-12"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="netflix-input pl-12 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="hitman-btn w-full mt-6"
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : isRegister ? (
                'CREATE ACCOUNT'
              ) : (
                'ACCESS GRANTED'
              )}
            </motion.button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-6">
          Codershive Agent Expense Tracker v1.0
        </p>
      </motion.div>
    </div>
  );
}
