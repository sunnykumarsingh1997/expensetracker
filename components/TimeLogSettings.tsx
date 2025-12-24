'use client';

import { useState } from 'react';
import { X, Clock, Save } from 'lucide-react';
import { TimeLogSettings as TimeLogSettingsType, DEFAULT_TIME_LOG_SETTINGS } from '@/lib/types';
import toast from 'react-hot-toast';

interface TimeLogSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: TimeLogSettingsType;
  onSave: (settings: TimeLogSettingsType) => void;
}

// Generate hour options (00:00 to 23:00)
const hourOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export default function TimeLogSettings({
  isOpen,
  onClose,
  settings,
  onSave,
}: TimeLogSettingsProps) {
  const [startHour, setStartHour] = useState(settings.startHour || DEFAULT_TIME_LOG_SETTINGS.startHour);
  const [endHour, setEndHour] = useState(settings.endHour || DEFAULT_TIME_LOG_SETTINGS.endHour);

  if (!isOpen) return null;

  const handleSave = () => {
    // Validate end time is after start time
    const startMinutes = parseInt(startHour.split(':')[0]) * 60;
    const endMinutes = parseInt(endHour.split(':')[0]) * 60;

    if (endMinutes <= startMinutes) {
      toast.error('End time must be after start time');
      return;
    }

    onSave({
      ...settings,
      startHour,
      endHour,
    });

    toast.success('Settings saved');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg border border-red-900/30 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-red-900/30">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white">Working Hours</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-zinc-400">
            Configure your working hours to generate time slots for daily activity logging.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Hour */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Start Time
              </label>
              <select
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {hourOptions.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </div>

            {/* End Hour */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                End Time
              </label>
              <select
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {hourOptions.map((hour) => (
                  <option key={hour} value={hour}>
                    {hour}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-zinc-800/50 rounded-lg p-3 text-sm text-zinc-400">
            <p>
              <strong className="text-zinc-300">Note:</strong> Time slots are 1 hour each.
              Changing these settings will regenerate your time slots for the current day.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-red-900/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
