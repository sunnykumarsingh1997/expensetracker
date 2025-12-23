'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  PiggyBank,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import Navbar from '@/components/Navbar';
import { useAuthStore, useDataStore, useCurrencyStore } from '@/lib/store';
import { DashboardStats, DailyExpense, DailyIncome } from '@/lib/types';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';

const COLORS = ['#C41E3A', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { setExpenses, setIncomes, setDashboardStats } = useDataStore();
  const { currency } = useCurrencyStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expenses, setLocalExpenses] = useState<DailyExpense[]>([]);
  const [incomes, setLocalIncomes] = useState<DailyIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sheets/dashboard');
      const data = await response.json();

      if (data.success) {
        setStats(data.data.stats);
        setLocalExpenses(data.data.expenses);
        setLocalIncomes(data.data.incomes);
        setExpenses(data.data.expenses);
        setIncomes(data.data.incomes);
        setDashboardStats(data.data.stats);
      } else {
        toast.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate category breakdown
  const categoryData = expenses.reduce((acc: any[], expense) => {
    const existing = acc.find((item) => item.name === expense.category);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, []);

  // Calculate needs vs wants data
  const needsWantsData = [
    { name: 'Needs', value: stats?.needsTotal || 0, color: '#10B981' },
    { name: 'Wants', value: stats?.wantsTotal || 0, color: '#F59E0B' },
  ];

  // Calculate monthly trend (last 6 entries)
  const monthlyTrend = incomes.slice(0, 6).map((income, index) => ({
    name: income.month?.substring(0, 3) || `M${index + 1}`,
    income: income.amount,
    expense: expenses[index]?.amount || 0,
  }));

  return (
    <div className="min-h-screen bg-hitman-gradient">
      <Navbar />

      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="font-hitman text-2xl sm:text-3xl font-bold text-white"
            >
              MISSION CONTROL
            </motion.h1>
            <p className="text-gray-400 mt-1">
              Welcome back, Agent {user?.displayName || 'Unknown'}
            </p>
          </div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-hitman-gunmetal rounded-lg text-gray-300 hover:bg-hitman-red hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Income */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Income</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(stats?.totalIncome || 0, currency)}
                </p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-green-400 text-sm">
              <ArrowUpRight className="w-4 h-4" />
              <span>+{incomes.length} entries</span>
            </div>
          </motion.div>

          {/* Total Expenses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Expenses</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(stats?.totalExpenses || 0, currency)}
                </p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-red-400 text-sm">
              <ArrowDownRight className="w-4 h-4" />
              <span>{expenses.length} transactions</span>
            </div>
          </motion.div>

          {/* Current Balance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="stat-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Current Balance</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (stats?.currentBalance || 0) >= 0 ? 'text-white' : 'text-red-400'
                }`}>
                  {formatCurrency(stats?.currentBalance || 0, currency)}
                </p>
              </div>
              <div className="p-3 bg-hitman-red/20 rounded-xl">
                <Wallet className="w-6 h-6 text-hitman-red" />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full h-2 bg-hitman-gunmetal rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, stats?.savingsRate || 0)}%` }}
                  className="h-full bg-hitman-red rounded-full"
                />
              </div>
              <p className="text-gray-500 text-xs mt-1">
                {(stats?.savingsRate || 0).toFixed(1)}% savings rate
              </p>
            </div>
          </motion.div>

          {/* Savings Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="stat-card"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">Savings Rate</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {(stats?.savingsRate || 0).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <PiggyBank className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-3">
              {(stats?.savingsRate || 0) >= 20
                ? 'Excellent performance!'
                : 'Needs improvement'}
            </p>
          </motion.div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Needs vs Wants */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="agent-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-hitman text-lg font-bold text-white">
                NEEDS vs WANTS
              </h2>
              <Target className="w-5 h-5 text-hitman-red" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={needsWantsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {needsWantsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1A1A1A',
                      border: '1px solid #2C3539',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-400 text-sm">
                  Needs ({(stats?.needsPercentage || 0).toFixed(0)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-gray-400 text-sm">
                  Wants ({(stats?.wantsPercentage || 0).toFixed(0)}%)
                </span>
              </div>
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="agent-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-hitman text-lg font-bold text-white">
                EXPENSE CATEGORIES
              </h2>
              <AlertTriangle className="w-5 h-5 text-hitman-red" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData.slice(0, 6)} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1A1A1A',
                      border: '1px solid #2C3539',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value, currency)}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Monthly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="agent-card"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-hitman text-lg font-bold text-white">
              MONTHLY SUMMARY
            </h2>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#2C3539' }}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  axisLine={{ stroke: '#2C3539' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1A1A1A',
                    border: '1px solid #2C3539',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value, currency)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#C41E3A"
                  strokeWidth={2}
                  dot={{ fill: '#C41E3A', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="agent-card mt-6"
        >
          <h2 className="font-hitman text-lg font-bold text-white mb-6">
            RECENT ACTIVITY
          </h2>

          <div className="overflow-x-auto">
            <table className="agent-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[...expenses.slice(0, 3), ...incomes.slice(0, 2)]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((item, index) => {
                    const isExpense = 'category' in item;
                    return (
                      <tr key={index}>
                        <td className="text-gray-400">{item.date}</td>
                        <td>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              isExpense
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {isExpense ? 'Expense' : 'Income'}
                          </span>
                        </td>
                        <td className="text-white">
                          {isExpense
                            ? (item as DailyExpense).description
                            : (item as DailyIncome).source}
                        </td>
                        <td
                          className={`text-right font-medium ${
                            isExpense ? 'text-red-400' : 'text-green-400'
                          }`}
                        >
                          {isExpense ? '-' : '+'}
                          {formatCurrency(item.amount, currency)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
