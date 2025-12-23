'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Plus,
  Calendar,
  DollarSign,
  Tag,
  FileText,
  Wallet,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  RefreshCw,
  PlusCircle,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import VoiceAssistant from '@/components/VoiceAssistant';
import { EXPENSE_CATEGORIES, PAYMENT_MODES, DailyExpense } from '@/lib/types';
import { useCurrencyStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const { currency } = useCurrencyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customPaymentModes, setCustomPaymentModes] = useState<string[]>([]);
  const [showAddPaymentMode, setShowAddPaymentMode] = useState(false);
  const [newPaymentMode, setNewPaymentMode] = useState('');
  const [isAddingPaymentMode, setIsAddingPaymentMode] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: '',
    paymentMode: '',
    needWant: 'NEED' as 'NEED' | 'WANT',
    paperlessLink: '',
  });

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/expenses');
      const data = await response.json();
      if (data.success) {
        setExpenses(data.data);
      }
    } catch (error) {
      console.error('Fetch expenses error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomPaymentModes = async () => {
    try {
      const response = await fetch('/api/custom-options?type=payment_mode');
      const data = await response.json();
      if (data.success) {
        setCustomPaymentModes(data.data.map((opt: { value: string }) => opt.value));
      }
    } catch (error) {
      console.error('Fetch custom payment modes error:', error);
    }
  };

  const handleAddPaymentMode = async () => {
    if (!newPaymentMode.trim()) return;

    setIsAddingPaymentMode(true);
    try {
      const response = await fetch('/api/custom-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'payment_mode',
          value: newPaymentMode.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment mode added!');
        setNewPaymentMode('');
        setShowAddPaymentMode(false);
        fetchCustomPaymentModes();
      } else {
        toast.error(data.error || 'Failed to add payment mode');
      }
    } catch (error) {
      console.error('Add payment mode error:', error);
      toast.error('Failed to add payment mode');
    } finally {
      setIsAddingPaymentMode(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCustomPaymentModes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Expense logged successfully!');
        setFormData({
          date: new Date().toISOString().split('T')[0],
          category: '',
          description: '',
          amount: '',
          paymentMode: '',
          needWant: 'NEED',
          paperlessLink: '',
        });
        fetchExpenses();
      } else {
        toast.error(data.error || 'Failed to log expense');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to log expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVoiceCommand = (data: any, type: string) => {
    if (type === 'expense') {
      setFormData((prev) => ({
        ...prev,
        ...data,
        amount: data.amount?.toString() || prev.amount,
      }));
    }
  };

  // Combine default and custom payment modes
  const allPaymentModes = [...PAYMENT_MODES, ...customPaymentModes];

  return (
    <div className="min-h-screen bg-hitman-gradient">
      <Navbar />

      <main className="pt-20 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-hitman text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-hitman-red" />
            DAILY EXPENSES
          </h1>
          <p className="text-gray-400 mt-1">Log your mission expenses</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="agent-card"
          >
            <h2 className="font-hitman text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-hitman-red" />
              NEW EXPENSE
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Date */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="netflix-input"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="netflix-input"
                >
                  <option value="">Select Category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={2}
                  placeholder="What was this expense for?"
                  className="netflix-input resize-none"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Amount ({currency})
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="netflix-input text-2xl font-bold"
                />
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Payment Mode
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddPaymentMode(!showAddPaymentMode)}
                    className="text-hitman-red hover:text-hitman-gold transition-colors flex items-center gap-1 text-xs"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Add New
                  </button>
                </label>
                {showAddPaymentMode && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newPaymentMode}
                      onChange={(e) => setNewPaymentMode(e.target.value)}
                      placeholder="New payment mode..."
                      className="netflix-input flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPaymentMode())}
                    />
                    <button
                      type="button"
                      onClick={handleAddPaymentMode}
                      disabled={isAddingPaymentMode || !newPaymentMode.trim()}
                      className="px-3 py-2 bg-hitman-red text-white rounded-lg hover:bg-hitman-red/80 disabled:opacity-50 transition-colors"
                    >
                      {isAddingPaymentMode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddPaymentMode(false); setNewPaymentMode(''); }}
                      className="px-3 py-2 bg-hitman-gunmetal text-gray-400 rounded-lg hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <select
                  name="paymentMode"
                  value={formData.paymentMode}
                  onChange={handleChange}
                  required
                  className="netflix-input"
                >
                  <option value="">Select Payment Mode</option>
                  {allPaymentModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Need/Want Toggle */}
              <div>
                <label className="block text-gray-400 text-sm mb-3">
                  Is this a Need or Want?
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, needWant: 'NEED' })}
                    className={`flex-1 mobile-btn ${
                      formData.needWant === 'NEED'
                        ? 'bg-green-500/20 text-green-400 border-2 border-green-500'
                        : 'bg-hitman-gunmetal text-gray-400 border-2 border-transparent'
                    }`}
                  >
                    <ThumbsUp className="w-6 h-6" />
                    NEED
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, needWant: 'WANT' })}
                    className={`flex-1 mobile-btn ${
                      formData.needWant === 'WANT'
                        ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500'
                        : 'bg-hitman-gunmetal text-gray-400 border-2 border-transparent'
                    }`}
                  >
                    <ThumbsDown className="w-6 h-6" />
                    WANT
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Receipt/Document (Optional)
                </label>
                <FileUpload
                  onUploadComplete={(url) =>
                    setFormData({ ...formData, paperlessLink: url })
                  }
                  category={formData.category}
                  description={formData.description}
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="hitman-btn w-full mt-6"
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'LOG EXPENSE'
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Recent Expenses */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="agent-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-hitman text-lg font-bold text-white">
                RECENT EXPENSES
              </h2>
              <button
                onClick={fetchExpenses}
                disabled={isLoading}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-hitman-gunmetal transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-hitman-red animate-spin" />
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No expenses logged yet</p>
                </div>
              ) : (
                expenses.slice(0, 10).map((expense, index) => (
                  <motion.div
                    key={expense.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-hitman-black/50 rounded-xl p-4 border border-hitman-gunmetal hover:border-hitman-red/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              expense.needWant === 'NEED'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {expense.needWant}
                          </span>
                          <span className="text-xs text-gray-500">{expense.date}</span>
                        </div>
                        <p className="text-white font-medium truncate">
                          {expense.description}
                        </p>
                        <p className="text-gray-500 text-sm">{expense.category}</p>
                      </div>
                      <p className="text-hitman-red font-bold text-lg">
                        {formatCurrency(expense.amount, currency)}
                      </p>
                    </div>
                    {expense.image && (
                      <a
                        href={expense.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs text-hitman-silver hover:text-hitman-red"
                      >
                        View Receipt
                      </a>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Voice Assistant */}
      <VoiceAssistant onCommand={handleVoiceCommand} />
    </div>
  );
}
