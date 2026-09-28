import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Settings,
  AlertCircle,
  Sparkles,
  Calendar,
  X,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { NotificationClientService } from '../../services/notification.service';
import type { NotificationItem, NotificationPreference } from '../../types/notification';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);

  // Preferences Modal/Drawer State
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Browser Notification state
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );

  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const count = await NotificationClientService.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // ignore in background
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await NotificationClientService.getNotifications({
        status: filter === 'unread' ? 'SENT' : undefined,
      });
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const prefs = await NotificationClientService.getPreferences();
      setPreferences(prefs);
    } catch (err) {
      console.error('Failed to load preferences:', err);
    }
  };

  // Poll unread count periodically (every 30s)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // When opened, fetch full list and preferences
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchPreferences();
    }
  }, [isOpen, filter]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationClientService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ', readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationClientService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ', readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  // Request Web Notifications API permission
  const handleRequestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        new Notification('LifeQuest Alerts Active', {
          body: 'You will receive reminders when tasks are pending before your day ends!',
          icon: '/favicon.ico',
        });
      }
    } catch (err) {
      console.error('Permission request failed:', err);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;
    try {
      setSavingPrefs(true);
      const updated = await NotificationClientService.updatePreferences({
        taskNotificationsEnabled: preferences.taskNotificationsEnabled,
        notificationTime: preferences.notificationTime,
        timezone: preferences.timezone,
      });
      setPreferences(updated);
      setShowSettings(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleSimulateCheck = async () => {
    try {
      const res = await NotificationClientService.simulateRun();
      alert(res.message || 'Scheduler simulation evaluated!');
      await fetchNotifications();
    } catch (err: any) {
      alert(err.message || 'Simulation check failed');
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Navbar Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700/60"
        title="Notification Center"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-rose-600 rounded-full animate-pulse shadow-lg shadow-rose-600/40">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#0c1222] border border-slate-800 shadow-2xl shadow-black/80 z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/25">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg text-xs font-medium transition ${
                  showSettings ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Notification Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 text-xs font-medium transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preferences Sub-view */}
          {showSettings && preferences ? (
            <form onSubmit={handleSavePreferences} className="p-4 space-y-4 bg-slate-950/60 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">Alert Preferences</span>
                <span className="text-[10px] font-mono text-indigo-400">Phase 4</span>
              </div>

              {/* Task notification toggle */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Daily Pending Alerts</span>
                <input
                  type="checkbox"
                  checked={preferences.taskNotificationsEnabled}
                  onChange={(e) =>
                    setPreferences({ ...preferences, taskNotificationsEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
                />
              </div>

              {/* Notification time */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Scheduled Reminder Time (24h)
                </label>
                <input
                  type="time"
                  value={preferences.notificationTime}
                  onChange={(e) =>
                    setPreferences({ ...preferences, notificationTime: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs font-mono"
                />
              </div>

              {/* Timezone */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Your Timezone
                </label>
                <select
                  value={preferences.timezone}
                  onChange={(e) =>
                    setPreferences({ ...preferences, timezone: e.target.value })
                  }
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST +9:00)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                </select>
              </div>

              {/* Browser push status */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Desktop Push:</span>
                {browserPermission === 'granted' ? (
                  <span className="text-emerald-400 font-semibold font-mono">Active</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleRequestBrowserPermission}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold underline"
                  >
                    Enable
                  </button>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingPrefs}
                  className="flex-1 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
                >
                  {savingPrefs ? 'Saving...' : 'Save Settings'}
                </button>
                <button
                  type="button"
                  onClick={handleSimulateCheck}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition"
                  title="Check pending tasks right now"
                >
                  Simulate
                </button>
              </div>
            </form>
          ) : null}

          {/* Filter Bar */}
          <div className="flex border-b border-slate-800 bg-slate-950/30 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 text-center font-medium transition ${
                filter === 'all'
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Alerts
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 py-2 text-center font-medium transition ${
                filter === 'unread'
                  ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread
            </button>
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/50">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500">Checking alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-1">
                <Check className="w-8 h-8 text-emerald-400 mx-auto opacity-40 mb-2" />
                <p className="text-xs font-semibold text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-500">No pending notifications found.</p>
              </div>
            ) : (
              notifications.map((item) => {
                const isUnread = item.status === 'SENT';
                return (
                  <div
                    key={item.id}
                    onClick={() => isUnread && handleMarkAsRead(item.id)}
                    className={`p-3.5 flex items-start gap-3 transition cursor-pointer ${
                      isUnread
                        ? 'bg-indigo-950/20 hover:bg-indigo-950/35'
                        : 'bg-transparent hover:bg-slate-900/40 opacity-75'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isUnread
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4" />
                    </div>

                    <div className="flex-grow space-y-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs font-bold truncate ${
                            isUnread ? 'text-white' : 'text-slate-300'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
                          {item.targetDate}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
                        <span>
                          {new Date(item.sentAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {isUnread && (
                          <span className="inline-flex items-center gap-1 text-indigo-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
