'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Calendar,
  Settings,
  Check,
  AlertCircle,
  Copy,
  Send,
  History,
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import VoiceAssistant from '@/components/VoiceAssistant';
import TimeLogSettings from '@/components/TimeLogSettings';
import { TimeLog, TimeLogSettings as TimeLogSettingsType, TIME_LOG_CATEGORIES, DEFAULT_TIME_LOG_SETTINGS } from '@/lib/types';
import { generateTimeSlots, getTodayDate, getYesterdayDate, formatDateDisplay, generateTimeLogId } from '@/lib/time-utils';
import toast from 'react-hot-toast';

interface SlotData {
  timeSlot: string;
  activity: string;
  category: string;
  isSaved: boolean;
  isSubmitted: boolean;
}

export default function TimeLogPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [settings, setSettings] = useState<TimeLogSettingsType>(DEFAULT_TIME_LOG_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isDaySubmitted, setIsDaySubmitted] = useState(false);

  // Generate time slots based on settings
  const timeSlots = generateTimeSlots(settings.startHour, settings.endHour, settings.slotDuration);

  // Fetch time logs for the selected date
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/time-log?date=${selectedDate}`);
      const data = await response.json();

      if (data.success) {
        const logs: TimeLog[] = data.data;

        // Map logs to slots
        const slotDataMap = new Map<string, SlotData>();
        logs.forEach((log) => {
          slotDataMap.set(log.timeSlot, {
            timeSlot: log.timeSlot,
            activity: log.activity,
            category: log.category,
            isSaved: true,
            isSubmitted: log.isSubmitted || false,
          });
        });

        // Create slots array with all time slots
        const allSlots = timeSlots.map((slot) => {
          const existing = slotDataMap.get(slot);
          return existing || {
            timeSlot: slot,
            activity: '',
            category: 'OTHER',
            isSaved: false,
            isSubmitted: false,
          };
        });

        setSlots(allSlots);
        setIsDaySubmitted(logs.some((log) => log.isSubmitted));
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load time logs');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, timeSlots]);

  useEffect(() => {
    fetchLogs();
  }, [selectedDate, settings]);

  // Save a single slot
  const saveSlot = async (slotIndex: number) => {
    const slot = slots[slotIndex];
    if (!slot.activity.trim()) {
      toast.error('Please enter an activity');
      return;
    }

    setIsSaving(slot.timeSlot);
    try {
      const response = await fetch('/api/time-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          timeSlot: slot.timeSlot,
          activity: slot.activity,
          category: slot.category,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSlots((prev) =>
          prev.map((s, i) =>
            i === slotIndex ? { ...s, isSaved: true } : s
          )
        );
        toast.success('Saved!');
      } else {
        toast.error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving slot:', error);
      toast.error('Failed to save');
    } finally {
      setIsSaving(null);
    }
  };

  // Update slot data
  const updateSlot = (index: number, field: 'activity' | 'category', value: string) => {
    setSlots((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, [field]: value, isSaved: false } : s
      )
    );
  };

  // Copy from yesterday
  const copyFromYesterday = async () => {
    const yesterday = getYesterdayDate();
    try {
      const response = await fetch(`/api/time-log?date=${yesterday}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const yesterdayLogs: TimeLog[] = data.data;

        setSlots((prev) =>
          prev.map((slot) => {
            const yesterdaySlot = yesterdayLogs.find((log) => log.timeSlot === slot.timeSlot);
            if (yesterdaySlot && !slot.activity) {
              return {
                ...slot,
                activity: yesterdaySlot.activity,
                category: yesterdaySlot.category,
                isSaved: false,
              };
            }
            return slot;
          })
        );
        toast.success('Copied activities from yesterday');
      } else {
        toast.error('No logs found for yesterday');
      }
    } catch (error) {
      console.error('Error copying from yesterday:', error);
      toast.error('Failed to copy from yesterday');
    }
  };

  // Submit day
  const submitDay = async () => {
    const filledSlots = slots.filter((s) => s.activity.trim());
    if (filledSlots.length < slots.length) {
      toast.error(`Please fill all ${slots.length} time slots before submitting`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/time-log/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate }),
      });

      const data = await response.json();
      if (data.success) {
        setIsDaySubmitted(true);
        setSlots((prev) => prev.map((s) => ({ ...s, isSubmitted: true })));
        toast.success('Day submitted successfully!');
      } else {
        toast.error(data.error || 'Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting day:', error);
      toast.error('Failed to submit day');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate dates
  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const goToToday = () => {
    setSelectedDate(getTodayDate());
  };

  // Calculate completion stats
  const filledCount = slots.filter((s) => s.activity.trim()).length;
  const totalCount = slots.length;
  const completionPercent = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold text-white">Time Log</h1>
              <p className="text-sm text-zinc-400">Track your daily activities</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Date Selector */}
        <div className="bg-zinc-900 rounded-lg border border-red-900/30 p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousDay}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-zinc-400" />
            </button>

            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-red-500" />
              <div className="text-center">
                <p className="text-lg font-semibold text-white">
                  {formatDateDisplay(selectedDate)}
                </p>
                {selectedDate === getTodayDate() && (
                  <span className="text-xs text-green-500">Today</span>
                )}
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
              />
            </div>

            <button
              onClick={goToNextDay}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {selectedDate !== getTodayDate() && (
            <button
              onClick={goToToday}
              className="mt-2 text-sm text-red-500 hover:text-red-400"
            >
              Go to Today
            </button>
          )}
        </div>

        {/* Completion Status */}
        <div className="bg-zinc-900 rounded-lg border border-red-900/30 p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400">Completion Status</span>
            <span className={`font-semibold ${completionPercent === 100 ? 'text-green-500' : 'text-yellow-500'}`}>
              {filledCount}/{totalCount} slots filled
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                completionPercent === 100 ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          {isDaySubmitted && (
            <p className="mt-2 text-sm text-green-500 flex items-center gap-1">
              <Check className="w-4 h-4" />
              Day has been submitted
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={copyFromYesterday}
            disabled={isDaySubmitted}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Copy className="w-4 h-4" />
            Copy from Yesterday
          </button>
          <button
            onClick={submitDay}
            disabled={isDaySubmitted || isSubmitting || filledCount < totalCount}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Day
          </button>
        </div>

        {/* Time Slots */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot, index) => (
              <div
                key={slot.timeSlot}
                className={`bg-zinc-900 rounded-lg border p-4 ${
                  slot.isSubmitted
                    ? 'border-green-900/30'
                    : slot.isSaved
                    ? 'border-blue-900/30'
                    : slot.activity
                    ? 'border-yellow-900/30'
                    : 'border-red-900/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Time Slot */}
                  <div className="w-32 flex-shrink-0">
                    <p className="font-mono text-white font-medium">{slot.timeSlot}</p>
                    <div className="mt-1">
                      {slot.isSubmitted ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-500">
                          <Check className="w-3 h-3" /> Submitted
                        </span>
                      ) : slot.isSaved ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-500">
                          <Check className="w-3 h-3" /> Saved
                        </span>
                      ) : slot.activity ? (
                        <span className="inline-flex items-center gap-1 text-xs text-yellow-500">
                          <AlertCircle className="w-3 h-3" /> Unsaved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500">
                          <AlertCircle className="w-3 h-3" /> Empty
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Activity Input */}
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={slot.activity}
                      onChange={(e) => updateSlot(index, 'activity', e.target.value)}
                      disabled={slot.isSubmitted}
                      placeholder="What did you do?"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>

                  {/* Category */}
                  <div className="w-40 flex-shrink-0">
                    <select
                      value={slot.category}
                      onChange={(e) => updateSlot(index, 'category', e.target.value)}
                      disabled={slot.isSubmitted}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50"
                    >
                      {TIME_LOG_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={() => saveSlot(index)}
                    disabled={slot.isSubmitted || isSaving === slot.timeSlot || !slot.activity.trim()}
                    className="flex-shrink-0 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving === slot.timeSlot ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Settings Modal */}
      <TimeLogSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={setSettings}
      />

      {/* Voice Assistant */}
      <VoiceAssistant />
    </div>
  );
}
