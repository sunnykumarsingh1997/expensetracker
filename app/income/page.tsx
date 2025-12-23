'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Plus,
  Calendar,
  Building2,
  Wallet,
  User,
  FileText,
  Loader2,
  RefreshCw,
  TrendingUp,
  PlusCircle,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import FileUpload from '@/components/FileUpload';
import VoiceAssistant from '@/components/VoiceAssistant';
import { INCOME_SOURCES, PAYMENT_MODES, DailyIncome } from '@/lib/types';
import { useCurrencyStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';

// Default received-in options
const DEFAULT_RECEIVED_IN = ['SBM ACC', 'IDFC', 'CASH', 'OTHERS'];

export default function IncomePage() {
  const { currency } = useCurrencyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incomes, setIncomes] = useState<DailyIncome[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Custom options state
  const [customIncomeSources, setCustomIncomeSources] = useState<string[]>([]);
  const [customReceivedIn, setCustomReceivedIn] = useState<string[]>([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [showAddReceivedIn, setShowAddReceivedIn] = useState(false);
  const [newSource, setNewSource] = useState('');
  const [newReceivedIn, setNewReceivedIn] = useState('');
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [isAddingReceivedIn, setIsAddingReceivedIn] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    source: '',
    amount: '',
    receivedIn: '',
    receivedFrom: '',
    notes: '',
    paperlessLink: '',
  });

  const fetchIncomes = async () => {
    try {
      const response = await fetch('/api/income');
      const data = await response.json();
      if (data.success) {
        setIncomes(data.data);
      }
    } catch (error) {
      console.error('Fetch incomes error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomOptions = async () => {
    try {
      const [sourcesRes, receivedInRes] = await Promise.all([
        fetch('/api/custom-options?type=income_source'),
        fetch('/api/custom-options?type=received_in'),
      ]);
      const [sourcesData, receivedInData] = await Promise.all([
        sourcesRes.json(),
        receivedInRes.json(),
      ]);
      if (sourcesData.success) {
        setCustomIncomeSources(sourcesData.data.map((opt: { value: string }) => opt.value));
      }
      if (receivedInData.success) {
        setCustomReceivedIn(receivedInData.data.map((opt: { value: string }) => opt.value));
      }
    } catch (error) {
      console.error('Fetch custom options error:', error);
    }
  };

  const handleAddSource = async () => {
    if (!newSource.trim()) return;
    setIsAddingSource(true);
    try {
      const response = await fetch('/api/custom-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'income_source', value: newSource.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Income source added!');
        setNewSource('');
        setShowAddSource(false);
        fetchCustomOptions();
      } else {
        toast.error(data.error || 'Failed to add source');
      }
    } catch (error) {
      toast.error('Failed to add source');
    } finally {
      setIsAddingSource(false);
    }
  };

  const handleAddReceivedIn = async () => {
    if (!newReceivedIn.trim()) return;
    setIsAddingReceivedIn(true);
    try {
      const response = await fetch('/api/custom-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'received_in', value: newReceivedIn.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Account added!');
        setNewReceivedIn('');
        setShowAddReceivedIn(false);
        fetchCustomOptions();
      } else {
        toast.error(data.error || 'Failed to add account');
      }
    } catch (error) {
      toast.error('Failed to add account');
    } finally {
      setIsAddingReceivedIn(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
    fetchCustomOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Income logged successfully!');
        setFormData({
          date: new Date().toISOString().split('T')[0],
          source: '',
          amount: '',
          receivedIn: '',
          receivedFrom: '',
          notes: '',
          paperlessLink: '',
        });
        fetchIncomes();
      } else {
        const errorMsg = data.error || 'Failed to log income';
        const fixHint = data.fix ? `\n\nFix: ${data.fix}` : '';
        toast.error(errorMsg, { duration: 6000 });
        if (data.fix) {
          console.error('Error:', errorMsg, '\nFix:', data.fix);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Network error - check your connection');
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
    if (type === 'income') {
      setFormData((prev) => ({
        ...prev,
        ...data,
        amount: data.amount?.toString() || prev.amount,
      }));
    }
  };

  // Combine default and custom options
  const allIncomeSources = [...INCOME_SOURCES, ...customIncomeSources];
  const allReceivedIn = [...DEFAULT_RECEIVED_IN, ...customReceivedIn];

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);

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
            <DollarSign className="w-8 h-8 text-green-500" />
            DAILY INCOME
          </h1>
          <p className="text-gray-400 mt-1">Track your mission earnings</p>
        </motion.div>

        {/* Total Income Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="stat-card mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Income Received</p>
              <p className="text-3xl font-bold text-green-400 mt-1">
                {formatCurrency(totalIncome, currency)}
              </p>
            </div>
            <div className="p-4 bg-green-500/20 rounded-xl">
              <TrendingUp className="w-10 h-10 text-green-400" />
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="agent-card"
          >
            <h2 className="font-hitman text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-500" />
              NEW INCOME
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

              {/* Source */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Source
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddSource(!showAddSource)}
                    className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1 text-xs"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Add New
                  </button>
                </label>
                {showAddSource && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newSource}
                      onChange={(e) => setNewSource(e.target.value)}
                      placeholder="New income source..."
                      className="netflix-input flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSource())}
                    />
                    <button
                      type="button"
                      onClick={handleAddSource}
                      disabled={isAddingSource || !newSource.trim()}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-500/80 disabled:opacity-50 transition-colors"
                    >
                      {isAddingSource ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddSource(false); setNewSource(''); }}
                      className="px-3 py-2 bg-hitman-gunmetal text-gray-400 rounded-lg hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                  required
                  className="netflix-input"
                >
                  <option value="">Select Source</option>
                  {allIncomeSources.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
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
                  className="netflix-input text-2xl font-bold text-green-400"
                />
              </div>

              {/* Received In */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Received In
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddReceivedIn(!showAddReceivedIn)}
                    className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1 text-xs"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Add New
                  </button>
                </label>
                {showAddReceivedIn && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newReceivedIn}
                      onChange={(e) => setNewReceivedIn(e.target.value)}
                      placeholder="New account..."
                      className="netflix-input flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddReceivedIn())}
                    />
                    <button
                      type="button"
                      onClick={handleAddReceivedIn}
                      disabled={isAddingReceivedIn || !newReceivedIn.trim()}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-500/80 disabled:opacity-50 transition-colors"
                    >
                      {isAddingReceivedIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddReceivedIn(false); setNewReceivedIn(''); }}
                      className="px-3 py-2 bg-hitman-gunmetal text-gray-400 rounded-lg hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <select
                  name="receivedIn"
                  value={formData.receivedIn}
                  onChange={handleChange}
                  required
                  className="netflix-input"
                >
                  <option value="">Select Account</option>
                  {allReceivedIn.map((account) => (
                    <option key={account} value={account}>
                      {account}
                    </option>
                  ))}
                </select>
              </div>

              {/* Received From */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Received From
                </label>
                <input
                  type="text"
                  name="receivedFrom"
                  value={formData.receivedFrom}
                  onChange={handleChange}
                  required
                  placeholder="Person or Organization"
                  className="netflix-input"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-gray-400 text-sm mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Additional notes..."
                  className="netflix-input resize-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Document (Optional)
                </label>
                <FileUpload
                  onUploadComplete={(url) =>
                    setFormData({ ...formData, paperlessLink: url })
                  }
                  category={formData.source}
                  description={`Income from ${formData.receivedFrom}`}
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full mobile-btn bg-green-500/20 text-green-400 border-2 border-green-500 hover:bg-green-500 hover:text-white mt-6"
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    LOG INCOME
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Recent Incomes */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="agent-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-hitman text-lg font-bold text-white">
                RECENT INCOME
              </h2>
              <button
                onClick={fetchIncomes}
                disabled={isLoading}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-hitman-gunmetal transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                </div>
              ) : incomes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No income logged yet</p>
                </div>
              ) : (
                incomes.slice(0, 10).map((income, index) => (
                  <motion.div
                    key={income.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-hitman-black/50 rounded-xl p-4 border border-hitman-gunmetal hover:border-green-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                            {income.source}
                          </span>
                          <span className="text-xs text-gray-500">{income.date}</span>
                        </div>
                        <p className="text-white font-medium">
                          From: {income.receivedFrom}
                        </p>
                        <p className="text-gray-500 text-sm">
                          Received in: {income.receivedIn}
                        </p>
                        {income.notes && (
                          <p className="text-gray-400 text-xs mt-1">{income.notes}</p>
                        )}
                      </div>
                      <p className="text-green-400 font-bold text-lg">
                        +{formatCurrency(income.amount, currency)}
                      </p>
                    </div>
                    {income.image && (
                      <a
                        href={income.image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-xs text-hitman-silver hover:text-green-400"
                      >
                        View Document
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
