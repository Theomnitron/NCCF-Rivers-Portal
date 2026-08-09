import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasTripartiteAccess } from '../../types/corper';
import {
  CalendarDays,
  Clock,
  MapPin,
  X,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Sparkles,
  BookmarkCheck,
} from 'lucide-react';

export interface RegularScheduleItem {
  id: string;
  title: string;
  day: string;
  time: string;
  location?: string;
  description?: string;
}

const DEFAULT_REGULAR_SCHEDULE: RegularScheduleItem[] = [
  {
    id: 'default-1',
    title: 'Daily Room Prayers',
    day: 'Except Sundays',
    time: '12 AM - 1 AM',
    location: 'NCCF Compound',
    description: 'Build a consistent prayer life as you pray with room members on your room\'s assigned day.',
  },
  // {
  //   id: 'default-2',
  //   title: 'Mid-Week Bible Study',
  //   day: 'Tuesdays',
  //   time: '5:00 PM',
  //   location: 'Main Chapel / Online Stream',
  //   description: 'In-depth exposition of the scriptures, practical Christian living discussions, and interactive Q&A.',
  // },
  // {
  //   id: 'default-3',
  //   title: 'State Prayer Power Meeting',
  //   day: 'Fridays',
  //   time: '5:00 PM',
  //   location: 'State Secretariat Chapel',
  //   description: 'Corporate intercession, spiritual warfare, state fellowship prayers, and personal ministrations.',
  // },
];

interface RegularServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegularServicesModal: React.FC<RegularServicesModalProps> = ({ isOpen, onClose }) => {
  const { activeUser } = useAuth();
  const { showToast } = useToast();
  const isGoverningRole = activeUser.systemCategory === 'admin' || hasTripartiteAccess(activeUser);

  const [schedules, setSchedules] = useState<RegularScheduleItem[]>(DEFAULT_REGULAR_SCHEDULE);
  const [isLoading, setIsLoading] = useState(false);

  // Form Drawer state for adding/editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<RegularScheduleItem | null>(null);
  const [title, setTitle] = useState('');
  const [day, setDay] = useState('Sundays');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const fetchSchedule = async () => {
    setIsLoading(true);
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('regular_schedule')
          .select('*')
          .order('id', { ascending: true });

        if (!error && data && data.length > 0) {
          setSchedules(data);
        } else {
          setSchedules(DEFAULT_REGULAR_SCHEDULE);
        }
      } catch (err) {
        console.warn('Could not load regular_schedule from Supabase, using defaults', err);
        setSchedules(DEFAULT_REGULAR_SCHEDULE);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchSchedule();
    }
  }, [isOpen]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setDay('Sundays');
    setTime('5:00 PM');
    setLocation('State Secretariat Chapel');
    setDescription('');
    setIsEditing(true);
  };

  const handleOpenEdit = (item: RegularScheduleItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDay(item.day);
    setTime(item.time);
    setLocation(item.location || '');
    setDescription(item.description || '');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !day.trim() || !time.trim()) {
      showToast('Title, Day, and Time are required', 'warning');
      return;
    }

    const payloadItem: RegularScheduleItem = {
      id: editingItem ? editingItem.id : `sched-${Date.now()}`,
      title: title.trim(),
      day: day.trim(),
      time: time.trim(),
      location: location.trim() || 'State Secretariat Chapel',
      description: description.trim() || undefined,
    };

    if (editingItem) {
      setSchedules((prev) => prev.map((s) => (s.id === editingItem.id ? payloadItem : s)));
    } else {
      setSchedules((prev) => [...prev, payloadItem]);
    }

    if (supabase) {
      try {
        await supabase.from('regular_schedule').upsert({
          id: payloadItem.id,
          title: payloadItem.title,
          day: payloadItem.day,
          time: payloadItem.time,
          location: payloadItem.location,
          description: payloadItem.description,
        });
        showToast(
          editingItem ? 'Regular service updated successfully' : 'New regular service added',
          'success'
        );
      } catch (err: any) {
        showToast(`Saved locally: ${err?.message || 'Database notice'}`, 'info');
      }
    } else {
      showToast('Service schedule updated', 'success');
    }

    setIsEditing(false);
  };

  const handleDelete = async (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
    if (supabase) {
      try {
        await supabase.from('regular_schedule').delete().eq('id', id);
        showToast('Service schedule deleted', 'info');
      } catch (err) {
        // ignore
      }
    } else {
      showToast('Service schedule removed', 'info');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-white/80 dark:border-white/15 rounded-2xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] dark:shadow-[0_16px_40px_0_rgba(0,0,0,0.7)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
          <div className="flex items-start sm:items-center space-x-3 pr-10 sm:pr-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="font-bold text-sm sm:text-base md:text-lg text-zinc-900 dark:text-white leading-tight">
                  Regular Fellowship Services
                </h3>
                <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                  FIXTURES
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-normal">
                Standing weekly fellowship services, times, and meeting locations
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
            {isGoverningRole && !isEditing && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="py-1.5 px-3 sm:py-2 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Service</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 sm:static p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/10 cursor-pointer transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {isEditing ? (
            /* Edit / Create Form */
            <form onSubmit={handleSave} className="space-y-4 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/70 dark:border-white/10">
              <div className="flex items-center justify-between pb-2 border-b border-white/60 dark:border-white/10">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{editingItem ? 'Edit Service Schedule' : 'Add New Regular Service'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Service Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sunday Service"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/70 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    Day of the Week *
                  </label>
                  <input
                    type="text"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    placeholder="e.g. Sundays"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/70 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    Time *
                  </label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 3:00 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/70 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Location / Venue
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. State Secretariat Chapel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/70 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Brief Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional brief notes or agenda..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/70 dark:border-white/10 bg-white/60 dark:bg-zinc-900/60 text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-2 px-4 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg cursor-pointer transition-transform active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Schedule</span>
                </button>
              </div>
            </form>
          ) : (
            /* Packaged Service Cards List */
            <div className="space-y-3">
              {schedules.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-4.5 rounded-2xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border border-white/70 dark:border-white/10 space-y-3 hover:border-amber-500/40 transition-all duration-200 shadow-sm active:scale-[0.995]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0 mt-0.5">
                        <BookmarkCheck className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white leading-tight">
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {isGoverningRole && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors cursor-pointer"
                          title="Edit Service"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Delete Service"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-2 text-xs border-t border-slate-900/5 dark:border-white/5 font-medium">
                    <span className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.day}</span>
                    </span>

                    <span className="flex items-center space-x-1 text-zinc-700 dark:text-zinc-300 bg-white/60 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-white/70 dark:border-white/10">
                      <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-mono font-bold">{item.time}</span>
                    </span>

                    {item.location && (
                      <span className="flex items-center space-x-1 text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-white/70 dark:border-white/10 max-w-full">
                        <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/60 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md flex items-center justify-between text-xs text-zinc-500">
          <span>{schedules.length} regular fellowship service(s) registered</span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:opacity-90 cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
