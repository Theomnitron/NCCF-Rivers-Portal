import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAnnouncements, Announcement } from '../../context/AnnouncementsContext';
import { useToast } from '../../context/ToastContext';
import { hasTripartiteAccess } from '../../types/corper';
import { processClientSideFile } from '../../utils/fileProcessor';
import { uploadFileToStorage } from '../../utils/storage';
import { RegularServicesModal } from './RegularServicesModal';
import { RevealOnScroll } from '../common/RevealOnScroll';
import {
  Megaphone,
  Plus,
  Calendar,
  CalendarDays,
  MapPin,
  Clock,
  Eye,
  Edit3,
  Trash2,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Archive,
  Image as ImageIcon,
} from 'lucide-react';

export const AnnouncementsTab: React.FC = () => {
  const { activeUser } = useAuth();
  const { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useAnnouncements();
  const { showToast } = useToast();

  const isGoverningRole = activeUser.systemCategory === 'admin' || hasTripartiteAccess(activeUser);

  // Modal State for Regular Services
  const [isRegularServicesOpen, setIsRegularServicesOpen] = useState(false);

  // Toggle for showing expired notices
  const [showExpired, setShowExpired] = useState(false);

  // Lightbox State
  const [activeLightboxImage, setActiveLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Drawer / Form State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form inputs
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [expirationDate, setExpirationDate] = useState(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    return defaultDate.toISOString().split('T')[0];
  });

  // Flyer upload state
  const [flyerDataUrl, setFlyerDataUrl] = useState<string | undefined>(undefined);
  const [flyerFileName, setFlyerFileName] = useState<string | undefined>(undefined);
  const [isCompressing, setIsCompressing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Active vs Expired filtering
  const activeNotices = announcements.filter((a) => a.expirationDate >= todayStr);
  const expiredNotices = announcements.filter((a) => a.expirationDate < todayStr);
  const displayedNotices = showExpired ? announcements : activeNotices;

  // Open Drawer for Create
  const handleOpenCreate = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setVenue('');
    setEventDate('');
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setExpirationDate(d.toISOString().split('T')[0]);
    setFlyerDataUrl(undefined);
    setFlyerFileName(undefined);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEdit = (a: Announcement) => {
    setEditingId(a.id);
    setTitle(a.title);
    setDescription(a.description || '');
    setVenue(a.venue || '');
    setEventDate(a.eventDate || '');
    setExpirationDate(a.expirationDate);
    setFlyerDataUrl(a.flyerUrl);
    setFlyerFileName(a.flyerFileName);
    setFormError(null);
    setIsDrawerOpen(true);
  };

  // Flyer Select with Client-side compression
  const handleFlyerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Flyer image size exceeds 5MB. Please select an image under 5MB.');
      return;
    }

    setFormError(null);
    setIsCompressing(true);

    try {
      const processed = await processClientSideFile(file, 1200, 1200, 0.85);
      setFlyerDataUrl(processed.dataUrl);
      setFlyerFileName(file.name);
      setIsCompressing(false);
    } catch (err) {
      console.error('Failed to process flyer', err);
      setFormError('Failed to process flyer image.');
      setIsCompressing(false);
    }
  };

  // Submit Drawer Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setFormError('Notice Title is required.');
      return;
    }

    if (!expirationDate) {
      setFormError('Expiration Date is required for auto-archiving.');
      return;
    }

    const authorRole = activeUser.systemCategory === 'admin' ? 'Admin Command' : 'Tripartite Governance Council';
    const authorName = activeUser.displayName;

    let finalFlyerUrl = flyerDataUrl;
    if (flyerDataUrl && flyerDataUrl.startsWith('data:')) {
      try {
        const uploadRes = await uploadFileToStorage(
          flyerDataUrl,
          'flyers',
          `flyer_${Date.now()}_${flyerFileName || 'notice.png'}`
        );
        if (uploadRes.publicUrl) {
          finalFlyerUrl = uploadRes.publicUrl;
        }
      } catch (err) {
        console.warn('Failed to upload flyer to storage bucket, using dataUrl fallback', err);
      }
    }

    if (editingId) {
      updateAnnouncement(editingId, {
        title: title.trim(),
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        eventDate: eventDate.trim() || undefined,
        expirationDate,
        flyerUrl: finalFlyerUrl,
        flyerFileName,
        authorName,
        authorRole,
        authorId: activeUser.id,
      });
      showToast('Announcement updated successfully', 'success');
    } else {
      addAnnouncement({
        title: title.trim(),
        description: description.trim() || undefined,
        venue: venue.trim() || undefined,
        eventDate: eventDate.trim() || undefined,
        expirationDate,
        flyerUrl: finalFlyerUrl,
        flyerFileName,
        authorName,
        authorRole,
        authorId: activeUser.id,
      });
      showToast('New announcement published to State Bulletin', 'success');
    }

    setIsDrawerOpen(false);
  };

  // Delete Notice
  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteAnnouncement(deletingId);
      setDeletingId(null);
      showToast('Announcement deleted from State Bulletin', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <RevealOnScroll delay={0.05}>
        <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm rounded-2xl p-4 sm:p-6 transition-all duration-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center space-x-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500 text-zinc-950 flex items-center justify-center font-bold text-lg shadow-md shrink-0 mt-0.5 sm:mt-0">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-lg md:text-xl font-bold leading-tight text-zinc-900 dark:text-white">
                    House Notices & Announcements
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 leading-normal">
                  Official fellowship notices, program flyers, and bulletins
                </p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-2 sm:flex sm:flex-row sm:items-center pt-1 lg:pt-0 w-full sm:w-auto">
              {/* View Regular Services Button */}
              {isGoverningRole ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsRegularServicesOpen(true)}
                    className="col-span-7 sm:col-span-auto px-2.5 sm:px-3.5 py-2.5 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center space-x-1.5 sm:space-x-2 cursor-pointer transition-all shadow-sm active:scale-95 min-h-[40px]"
                  >
                    <CalendarDays className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="truncate">View Regular Services</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCreate}
                    className="col-span-5 sm:col-span-auto py-2.5 px-2 sm:px-4 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 sm:space-x-2 shadow-lg transition-all cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="hidden sm:inline">Create Announcement</span>
                    <span className="inline sm:hidden">Create</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRegularServicesOpen(true)}
                  className="col-span-12 sm:col-span-auto px-3.5 py-2.5 rounded-xl text-xs font-bold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center space-x-2 cursor-pointer transition-all shadow-sm active:scale-95 min-h-[40px]"
                >
                  <CalendarDays className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>View Regular Schedule</span>
                </button>
              )}

              {expiredNotices.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowExpired(!showExpired)}
                  className={`col-span-12 sm:col-span-auto px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center space-x-2 cursor-pointer min-h-[40px] active:scale-95 ${
                    showExpired
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900'
                      : 'bg-slate-900/5 dark:bg-black/40 text-zinc-700 dark:text-zinc-300 border-slate-900/10 dark:border-white/10 hover:bg-slate-900/10'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>{showExpired ? 'Showing All' : `Show Archived (${expiredNotices.length})`}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* Notice List Cards */}
      {displayedNotices.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-xl border border-white/80 dark:bg-zinc-950/60 dark:border-white/10 rounded-2xl p-10 text-center space-y-3">
          <Megaphone className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mx-auto" />
          <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            No active announcements found
          </div>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Check back later for state fellowship updates and official notices.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedNotices.map((notice) => {
            const isExpired = notice.expirationDate < todayStr;

            return (
              <div
                key={notice.id}
                className={`bg-white/60 backdrop-blur-xl border border-white/90 dark:bg-zinc-950/70 dark:border-white/15 shadow-md rounded-2xl overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl ${
                  isExpired ? 'opacity-65 grayscale-[30%]' : ''
                }`}
              >
                {/* Flyer Image Container (Flyer-First Layout) */}
                {notice.flyerUrl && (
                  <div
                    onClick={() =>
                      setActiveLightboxImage({
                        url: notice.flyerUrl!,
                        title: notice.title,
                      })
                    }
                    className="relative w-full h-48 sm:h-52 bg-zinc-900 group cursor-pointer overflow-hidden"
                  >
                    <img
                      src={notice.flyerUrl}
                      alt={notice.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2 text-white font-bold text-xs">
                      <Eye className="w-4 h-4 text-amber-400" />
                      <span>Expand Flyer</span>
                    </div>
                    {isExpired && (
                      <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold shadow-md">
                        ARCHIVED / EXPIRED
                      </span>
                    )}
                  </div>
                )}

                {/* Card Content Body */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h2 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white leading-snug">
                        {notice.title}
                      </h2>
                      {/* <span className="px-2.5 py-0.5 rounded-full bg-slate-900/5 dark:bg-white/10 text-zinc-900 dark:text-zinc-100 text-[10px] font-mono font-bold border border-slate-900/10 dark:border-white/10">
                        {notice.authorRole}
                      </span> */}
                      <span className="text-[10px] font-mono text-zinc-500">
                        {notice.createdAt}
                      </span>
                    </div>

                    

                    {notice.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-3">
                        {notice.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Pills */}
                  <div className="pt-3 border-t border-slate-900/10 dark:border-white/10 space-y-2 text-xs">
                    {notice.venue && (
                      <div className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-medium truncate">{notice.venue}</span>
                      </div>
                    )}

                    {notice.eventDate && (
                      <div className="flex items-center space-x-2 text-zinc-700 dark:text-zinc-300">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-medium">{notice.eventDate}</span>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-zinc-500 text-[11px] font-mono">
                      <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span>Notice disappears after: {notice.expirationDate}</span>
                    </div>
                  </div>

                  {/* Governing Role Actions */}
                  {isGoverningRole && (
                    <div className="pt-3 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(notice)}
                        className="py-1.5 px-3 rounded-lg border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 hover:bg-slate-900/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-sky-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingId(notice.id)}
                        className="py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {activeLightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-3xl w-full space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between text-white">
              <h3 className="font-bold text-sm sm:text-base">
                {activeLightboxImage.title}
              </h3>
              <button
                type="button"
                onClick={() => setActiveLightboxImage(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/20 bg-black shadow-2xl flex items-center justify-center max-h-[80vh]">
              <img
                src={activeLightboxImage.url}
                alt={activeLightboxImage.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* ANNOUNCEMENT CREATOR / EDIT DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-end">
          <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border-l border-white/80 dark:border-white/15 h-full w-full max-w-lg p-6 overflow-y-auto space-y-5 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-4">
              <div className="flex items-center space-x-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  {editingId ? 'Edit Official Notice' : 'Publish New Official Notice'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. August State Fellowship & Welfare Distribution"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Brief Description / Notice Body
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Provide essential details, agenda, or instructions for corps members..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Program Flyer Uploader */}
              <div className="p-4 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>Program Flyer Image (Optional)</span>
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">Max 5MB</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFlyerSelect}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-slate-900/20 dark:border-white/20 bg-white/50 dark:bg-black/40 hover:bg-slate-900/5 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center space-x-2 transition-all cursor-pointer min-h-[44px]"
                >
                  <Upload className="w-4 h-4 text-amber-500" />
                  <span>{isCompressing ? 'Compressing Image...' : flyerFileName ? `Replace (${flyerFileName})` : 'Upload Program Flyer'}</span>
                </button>

                {flyerDataUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-white/10 mt-2 max-h-36">
                    <img src={flyerDataUrl} alt="Flyer Preview" className="w-full h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setFlyerDataUrl(undefined);
                        setFlyerFileName(undefined);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Venue / Location (Optional)
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. State Secretariat Chapel, Port Harcourt"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Event Date & Expiration Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    Event Date / Range (Optional)
                  </label>
                  <input
                    type="text"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="e.g. August 16, 2026"
                    className="w-full px-3 py-2 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                    Auto-Expiration Date *
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md text-xs text-zinc-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-900/10 dark:border-white/10 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-white cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg transition-all cursor-pointer min-h-[44px]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingId ? 'Save Changes' : 'Publish Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-2xl border border-white/80 dark:border-white/15 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-base">
              <Trash2 className="w-5 h-5" />
              <span>Delete Announcement?</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Are you sure you want to permanently delete this announcement? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Delete Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGULAR SERVICES FIXTURES POP-OUT MODAL */}
      <RegularServicesModal
        isOpen={isRegularServicesOpen}
        onClose={() => setIsRegularServicesOpen(false)}
      />
    </div>
  );
};
