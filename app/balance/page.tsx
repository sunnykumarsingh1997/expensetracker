'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Plus,
  Calendar,
  Building2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  FileText,
  Loader2,
  RefreshCw,
  Landmark,
  PlusCircle,
  X,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import VoiceAssistant from '@/components/VoiceAssistant';
import { BankBalanceEntry, BANK_ACCOUNTS, CREDIT_CARDS, CustomOption } from '@/lib/types';
import { useCurrencyStore } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';
import toast from 'react-hot-toast';

export default function BalancePage() {
  const { currency } = useCurrencyStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entries, setEntries] = useState<BankBalanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Custom options state
  const [customBankAccounts, setCustomBankAccounts] = useState<CustomOption[]>([]);
  const [customCreditCards, setCustomCreditCards] = useState<CustomOption[]>([]);
  const [customBankValues, setCustomBankValues] = useState<Record<string, string>>({});
  const [customCcValues, setCustomCcValues] = useState<Record<string, string>>({});
  const [showAddBank, setShowAddBank] = useState(false);
  const [showAddCc, setShowAddCc] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newCcName, setNewCcName] = useState('');
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [isAddingCc, setIsAddingCc] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    idfcAcc: '',
    rblAcc: '',
    sbmAcc: '',
    yesAcc: '',
    idfcFdCc: '',
    sbmFdCc: '',
    yesFdCc: '',
    notes: '',
  });

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/balance?type=bank');
      const data = await response.json();
      if (data.success) {
        setEntries(data.data);
      }
    } catch (error) {
      console.error('Fetch entries error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomOptions = async () => {
    try {
      const [banksRes, ccsRes] = await Promise.all([
        fetch('/api/custom-options?type=bank_account'),
        fetch('/api/custom-options?type=credit_card'),
      ]);
      const [banksData, ccsData] = await Promise.all([banksRes.json(), ccsRes.json()]);
      if (banksData.success) {
        setCustomBankAccounts(banksData.data);
        const initialBankValues: Record<string, string> = {};
        banksData.data.forEach((opt: CustomOption) => {
          initialBankValues[opt.key || opt.value] = '';
        });
        setCustomBankValues(initialBankValues);
      }
      if (ccsData.success) {
        setCustomCreditCards(ccsData.data);
        const initialCcValues: Record<string, string> = {};
        ccsData.data.forEach((opt: CustomOption) => {
          initialCcValues[opt.key || opt.value] = '';
        });
        setCustomCcValues(initialCcValues);
      }
    } catch (error) {
      console.error('Fetch custom options error:', error);
    }
  };

  const handleAddBank = async () => {
    if (!newBankName.trim()) return;
    setIsAddingBank(true);
    try {
      const key = newBankName.trim().toLowerCase().replace(/\s+/g, '_') + '_acc';
      const response = await fetch('/api/custom-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bank_account',
          value: newBankName.trim().toUpperCase(),
          label: newBankName.trim().toUpperCase(),
          key,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Bank account added!');
        setNewBankName('');
        setShowAddBank(false);
        fetchCustomOptions();
      } else {
        toast.error(data.error || 'Failed to add bank');
      }
    } catch (error) {
      toast.error('Failed to add bank');
    } finally {
      setIsAddingBank(false);
    }
  };

  const handleAddCc = async () => {
    if (!newCcName.trim()) return;
    setIsAddingCc(true);
    try {
      const key = newCcName.trim().toLowerCase().replace(/\s+/g, '_') + '_cc';
      const response = await fetch('/api/custom-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'credit_card',
          value: newCcName.trim().toUpperCase(),
          label: newCcName.trim().toUpperCase() + ' CC',
          key,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success('Credit card added!');
        setNewCcName('');
        setShowAddCc(false);
        fetchCustomOptions();
      } else {
        toast.error(data.error || 'Failed to add credit card');
      }
    } catch (error) {
      toast.error('Failed to add credit card');
    } finally {
      setIsAddingCc(false);
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchCustomOptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bank',
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Bank balances saved successfully!');
        setFormData((prev) => ({
          ...prev,
          idfcAcc: '',
          rblAcc: '',
          sbmAcc: '',
          yesAcc: '',
          idfcFdCc: '',
          sbmFdCc: '',
          yesFdCc: '',
          notes: '',
        }));
        fetchEntries();
      } else {
        toast.error(data.error || 'Failed to save balances');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save balances');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVoiceCommand = (data: any, type: string) => {
    if (type === 'balance') {
      setFormData((prev) => ({
        ...prev,
        ...data,
      }));
    }
  };

  const handleCustomBankChange = (key: string, value: string) => {
    setCustomBankValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleCustomCcChange = (key: string, value: string) => {
    setCustomCcValues((prev) => ({ ...prev, [key]: value }));
  };

  // Calculate totals from form data (including custom accounts)
  const defaultBanksTotal =
    (parseFloat(formData.idfcAcc) || 0) +
    (parseFloat(formData.rblAcc) || 0) +
    (parseFloat(formData.sbmAcc) || 0) +
    (parseFloat(formData.yesAcc) || 0);

  const customBanksTotal = Object.values(customBankValues).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const totalBanks = defaultBanksTotal + customBanksTotal;

  const defaultCcTotal =
    (parseFloat(formData.idfcFdCc) || 0) +
    (parseFloat(formData.sbmFdCc) || 0) +
    (parseFloat(formData.yesFdCc) || 0);

  const customCcTotal = Object.values(customCcValues).reduce(
    (sum, val) => sum + (parseFloat(val) || 0),
    0
  );

  const totalCcDues = defaultCcTotal + customCcTotal;

  const netWorth = totalBanks - totalCcDues;

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
            <Wallet className="w-8 h-8 text-hitman-gold" />
            BANK BALANCE ENTRY
          </h1>
          <p className="text-gray-400 mt-1">Track your bank accounts and credit card balances</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="agent-card"
          >
            <h2 className="font-hitman text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-hitman-gold" />
              NEW BALANCE ENTRY
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Bank Accounts Section */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold flex items-center justify-between border-b border-hitman-gunmetal pb-2">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-green-400" />
                    Bank Accounts
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddBank(!showAddBank)}
                    className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1 text-xs"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Add Bank
                  </button>
                </h3>
                {showAddBank && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      placeholder="Bank name..."
                      className="netflix-input flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBank())}
                    />
                    <button
                      type="button"
                      onClick={handleAddBank}
                      disabled={isAddingBank || !newBankName.trim()}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-500/80 disabled:opacity-50 transition-colors"
                    >
                      {isAddingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddBank(false); setNewBankName(''); }}
                      className="px-3 py-2 bg-hitman-gunmetal text-gray-400 rounded-lg hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {BANK_ACCOUNTS.map((account) => (
                    <div key={account.key}>
                      <label className="block text-gray-400 text-sm mb-2">
                        {account.label}
                      </label>
                      <input
                        type="number"
                        name={account.key}
                        value={formData[account.key as keyof typeof formData]}
                        onChange={handleChange}
                        placeholder="0"
                        className="netflix-input"
                      />
                    </div>
                  ))}
                  {customBankAccounts.map((account) => (
                    <div key={account.key || account.value}>
                      <label className="block text-gray-400 text-sm mb-2">
                        {account.label}
                      </label>
                      <input
                        type="number"
                        value={customBankValues[account.key || account.value] || ''}
                        onChange={(e) => handleCustomBankChange(account.key || account.value, e.target.value)}
                        placeholder="0"
                        className="netflix-input"
                      />
                    </div>
                  ))}
                </div>
                {/* Total Banks Preview */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total Bank Balance</span>
                  <span className="text-green-400 font-bold text-lg">{formatCurrency(totalBanks, currency)}</span>
                </div>
              </div>

              {/* Credit Cards Section */}
              <div className="space-y-4">
                <h3 className="text-white font-semibold flex items-center justify-between border-b border-hitman-gunmetal pb-2">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-red-400" />
                    Credit Card Dues
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCc(!showAddCc)}
                    className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 text-xs"
                  >
                    <PlusCircle className="w-3 h-3" />
                    Add Card
                  </button>
                </h3>
                {showAddCc && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newCcName}
                      onChange={(e) => setNewCcName(e.target.value)}
                      placeholder="Card name..."
                      className="netflix-input flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCc())}
                    />
                    <button
                      type="button"
                      onClick={handleAddCc}
                      disabled={isAddingCc || !newCcName.trim()}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-500/80 disabled:opacity-50 transition-colors"
                    >
                      {isAddingCc ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowAddCc(false); setNewCcName(''); }}
                      className="px-3 py-2 bg-hitman-gunmetal text-gray-400 rounded-lg hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {CREDIT_CARDS.map((card) => (
                    <div key={card.key}>
                      <label className="block text-gray-400 text-sm mb-2">
                        {card.label}
                      </label>
                      <input
                        type="number"
                        name={card.key}
                        value={formData[card.key as keyof typeof formData]}
                        onChange={handleChange}
                        placeholder="0"
                        className="netflix-input"
                      />
                    </div>
                  ))}
                  {customCreditCards.map((card) => (
                    <div key={card.key || card.value}>
                      <label className="block text-gray-400 text-sm mb-2">
                        {card.label}
                      </label>
                      <input
                        type="number"
                        value={customCcValues[card.key || card.value] || ''}
                        onChange={(e) => handleCustomCcChange(card.key || card.value, e.target.value)}
                        placeholder="0"
                        className="netflix-input"
                      />
                    </div>
                  ))}
                </div>
                {/* Total CC Dues Preview */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Total CC Dues</span>
                  <span className="text-red-400 font-bold text-lg">{formatCurrency(totalCcDues, currency)}</span>
                </div>
              </div>

              {/* Net Worth Preview */}
              {(totalBanks > 0 || totalCcDues > 0) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-xl text-center ${
                    netWorth >= 0
                      ? 'bg-hitman-gold/20 border border-hitman-gold/30'
                      : 'bg-red-500/20 border border-red-500/30'
                  }`}
                >
                  <p className="text-sm text-gray-400 mb-1">Net Worth</p>
                  <p
                    className={`text-2xl font-bold flex items-center justify-center gap-2 ${
                      netWorth >= 0 ? 'text-hitman-gold' : 'text-red-400'
                    }`}
                  >
                    {netWorth >= 0 ? (
                      <TrendingUp className="w-6 h-6" />
                    ) : (
                      <TrendingDown className="w-6 h-6" />
                    )}
                    {formatCurrency(netWorth, currency)}
                  </p>
                </motion.div>
              )}

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
                  placeholder="Any notes about this entry..."
                  className="netflix-input resize-none"
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="w-full mobile-btn bg-hitman-gold/20 text-hitman-gold border-2 border-hitman-gold hover:bg-hitman-gold hover:text-hitman-black mt-4"
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    SAVE BALANCE ENTRY
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Recent Entries */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="agent-card"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-hitman text-lg font-bold text-white">
                BALANCE HISTORY
              </h2>
              <button
                onClick={fetchEntries}
                disabled={isLoading}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-hitman-gunmetal transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-4 max-h-[700px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-hitman-gold animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No balance entries yet</p>
                </div>
              ) : (
                entries.map((entry, index) => (
                  <motion.div
                    key={entry.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-hitman-black/50 rounded-xl p-5 border border-hitman-gunmetal hover:border-hitman-gold/50 transition-colors"
                  >
                    {/* Date and Net Worth */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {entry.date}
                      </span>
                      <span
                        className={`text-lg font-bold flex items-center gap-1 ${
                          entry.netWorth >= 0 ? 'text-hitman-gold' : 'text-red-400'
                        }`}
                      >
                        <Landmark className="w-5 h-5" />
                        {formatCurrency(entry.netWorth, currency)}
                      </span>
                    </div>

                    {/* Bank Accounts */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Bank Accounts
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-hitman-gunmetal/50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">IDFC</p>
                          <p className="text-green-400 font-medium text-sm">{formatCurrency(entry.idfcAcc, currency)}</p>
                        </div>
                        <div className="bg-hitman-gunmetal/50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">RBL</p>
                          <p className="text-green-400 font-medium text-sm">{formatCurrency(entry.rblAcc, currency)}</p>
                        </div>
                        <div className="bg-hitman-gunmetal/50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">SBM</p>
                          <p className="text-green-400 font-medium text-sm">{formatCurrency(entry.sbmAcc, currency)}</p>
                        </div>
                        <div className="bg-hitman-gunmetal/50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">YES</p>
                          <p className="text-green-400 font-medium text-sm">{formatCurrency(entry.yesAcc, currency)}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-xs text-gray-500">Total: </span>
                        <span className="text-green-400 font-semibold">{formatCurrency(entry.totalBanks, currency)}</span>
                      </div>
                    </div>

                    {/* Credit Cards */}
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> Credit Card Dues
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-hitman-gunmetal/50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">IDFC CC</p>
                          <p className="text-red-400 font-medium text-sm">{formatCurrency(entry.idfcFdCc, currency)}</p>
                        </div>
                        <div className="bg-hitman-gunmetal/50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">SBM CC</p>
                          <p className="text-red-400 font-medium text-sm">{formatCurrency(entry.sbmFdCc, currency)}</p>
                        </div>
                        <div className="bg-hitman-gunmetal/50 rounded-lg p-2">
                          <p className="text-xs text-gray-500">YES CC</p>
                          <p className="text-red-400 font-medium text-sm">{formatCurrency(entry.yesFdCc, currency)}</p>
                        </div>
                      </div>
                      <div className="mt-2 text-right">
                        <span className="text-xs text-gray-500">Total Dues: </span>
                        <span className="text-red-400 font-semibold">{formatCurrency(entry.totalCcDues, currency)}</span>
                      </div>
                    </div>

                    {entry.notes && (
                      <p className="text-gray-500 text-sm mt-3 italic border-t border-hitman-gunmetal pt-2">
                        {entry.notes}
                      </p>
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
