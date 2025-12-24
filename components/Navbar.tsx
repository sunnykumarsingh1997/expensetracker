'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Menu,
  X,
  LayoutDashboard,
  Clock,
  CreditCard,
  DollarSign,
  Wallet,
  Settings,
  LogOut,
  Sun,
  Moon,
  User,
} from 'lucide-react';
import { useAuthStore, useThemeStore } from '@/lib/store';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/time-log', label: 'Time Log', icon: Clock },
  { href: '/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/income', label: 'Income', icon: DollarSign },
  { href: '/balance', label: 'Balance', icon: Wallet },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-hitman-black/95 backdrop-blur-md border-b border-hitman-gunmetal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative">
              <Target className="w-8 h-8 text-hitman-red" />
              <motion.div
                className="absolute inset-0 rounded-full bg-hitman-red/20"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="font-hitman text-xl font-bold text-white tracking-wider hidden sm:block">
              AGENT EXPENSE
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-hitman-gunmetal/50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-hitman-red/20 border border-hitman-red/50 rounded-lg"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 text-sm font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-hitman-gunmetal/50 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* User menu */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-hitman-red/20 border border-hitman-red/50 flex items-center justify-center">
                  <User className="w-4 h-4 text-hitman-red" />
                </div>
                <span className="text-gray-300">{user?.displayName || 'Agent'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-hitman-red hover:bg-hitman-gunmetal/50 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-hitman-gunmetal/50 transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-hitman-black/95 border-b border-hitman-gunmetal overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-hitman-red/20 text-white border border-hitman-red/50'
                        : 'text-gray-400 hover:bg-hitman-gunmetal/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}

              <div className="border-t border-hitman-gunmetal pt-4 mt-4">
                <div className="flex items-center gap-3 px-4 py-2 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-hitman-red/20 border border-hitman-red/50 flex items-center justify-center">
                    <User className="w-4 h-4 text-hitman-red" />
                  </div>
                  <span>{user?.displayName || 'Agent'}</span>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-hitman-red/20 hover:text-hitman-red transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
