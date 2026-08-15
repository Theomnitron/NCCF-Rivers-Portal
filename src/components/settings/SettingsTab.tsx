import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestsContext';
import { useToast } from '../../context/ToastContext';
import { evaluateTier } from '../../utils/tierEvaluator';
import { ALL_SERVICE_UNITS } from '../../types/corper';
import { processClientSideFile } from '../../utils/fileProcessor';
import { uploadFileToStorage } from '../../utils/storage';
import { RevealOnScroll } from '../common/RevealOnScroll';
import {
  User,
  Camera,
  Home,
  Users,
  Heart,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Upload,
  Send,
  Sparkles,
  ShieldAlert,
  LogOut,
} from 'lucide-react';

const ROOM_OPTIONS = [
  'David',
  'Delegates (Female)',
  'Delegates (Male)',
  'Esther',
  'Excos (Female)',
  'Excos (Male)',
  'Gees (Female)',
  'Gees (Male)',
  'Hephzibah',
  'Joseph',
  'Judah',
  'Lydia',
  'Mary',
  "Papa's",
  'Peace',
  'Ruth',
  'Shekinah',
  'Tehilah',
  'Timothy',
  "Uncle's",
];

const SERVICE_UNITS = ALL_SERVICE_UNITS;

export const SettingsTab: React.FC = () => {
  const { activeUser, updateUserProfile, signOut } = useAuth();
  const { profileRequests, addProfileRequest } = useRequests();
  const { showToast } = useToast();
  const tierInfo = evaluateTier(activeUser);

  const isSubmittingRole = activeUser.systemCategory === 'member';

  // Form States for Submitting Roles
  const [editedRoom, setEditedRoom] = useState(activeUser.roomName);
  const [selectedUnits, setSelectedUnits] = useState<string[]>(() => {
    if (!activeUser.serviceUnit) return [];
    return activeUser.serviceUnit
      .split(',')
      .map((s) => s.trim())
      .filter((s) => (SERVICE_UNITS as readonly string[]).includes(s));
  });
  const [editedMarital, setEditedMarital] = useState(activeUser.maritalStatus);

  // Photo Upload State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [photoSuccessMsg, setPhotoSuccessMsg] = useState<string | null>(null);
  const [photoErrorMsg, setPhotoErrorMsg] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback Message
  const [requestSuccessMsg, setRequestSuccessMsg] = useState<string | null>(null);

  // Pending requests check for this user
  const pendingRequestsForUser = profileRequests.filter(
    (r) => r.userId === activeUser.id && r.status === 'pending'
  );

  const hasPendingRoomRequest = pendingRequestsForUser.some(
    (r) => r.roomChange || r.changeType === 'room_name'
  );
  const hasPendingUnitRequest = pendingRequestsForUser.some(
    (r) => r.unitChange || r.changeType === 'service_units'
  );
  const hasPendingMaritalRequest = pendingRequestsForUser.some(
    (r) => r.maritalChange || r.changeType === 'marital_status'
  );

  // Multi-Select Checkbox Handler
  const toggleUnit = (unit: string) => {
    setSelectedUnits((prev) =>
      prev.includes(unit) ? prev.filter((u) => u !== unit) : [...prev, unit]
    );
  };

  // Handle Photo Select & Compression
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPhotoErrorMsg('File size exceeds maximum 5MB limit. Choose an image under 5MB.');
      return;
    }

    setPhotoErrorMsg(null);
    setIsProcessingPhoto(true);

    try {
      const processed = await processClientSideFile(file, 800, 800, 0.85);
      setAvatarPreview(processed.dataUrl);
      setIsProcessingPhoto(false);
    } catch (err) {
      console.error('Photo processing failed', err);
      setPhotoErrorMsg('Failed to process image. Please try again.');
      setIsProcessingPhoto(false);
    }
  };

  const handleSavePhoto = async () => {
    if (!avatarPreview) return;
    setIsProcessingPhoto(true);
    setPhotoErrorMsg(null);

    try {
      const fileName = `${activeUser.id}_avatar_${Date.now()}.png`;
      const uploadRes = await uploadFileToStorage(avatarPreview, 'avatars', fileName);

      const urlToSave = uploadRes.publicUrl || avatarPreview;
      updateUserProfile(activeUser.id, { avatarUrl: urlToSave });
      setPhotoSuccessMsg('Profile photo updated and saved to storage!');
      showToast('Profile photo updated and saved to storage!', 'success');
      setAvatarPreview(null);
      setTimeout(() => setPhotoSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to upload avatar photo:', err);
      setPhotoErrorMsg('Failed to save profile photo to storage. Please try again.');
      showToast('Failed to save profile photo to storage.', 'error');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Independent Request Handlers
  const handleRequestRoomChange = () => {
    if (editedRoom.trim() === activeUser.roomName) return;

    const oldVal = activeUser.roomName;
    const newVal = editedRoom.trim();
    const deltaPayload = `Room change: From ${oldVal} to ${newVal}`;

    addProfileRequest({
      userId: activeUser.id,
      userName: activeUser.displayName,
      userStateCode: activeUser.stateCode,
      userAvatar: activeUser.avatarUrl,
      userHouseStatus: activeUser.houseStatus,
      userRoom: activeUser.roomName,
      userTier: activeUser.tier,
      changeType: 'room_name',
      deltaPayload,
      roomChange: { oldVal, newVal },
    });

    setRequestSuccessMsg('Room change request sent to Approvals queue.');
    showToast('Room change request sent to Approvals queue.', 'success');
    setTimeout(() => setRequestSuccessMsg(null), 4000);
  };

  const handleRequestUnitChange = () => {
    const newVal = selectedUnits.join(', ') || 'None';
    const oldVal = activeUser.serviceUnit || 'None';

    if (newVal === oldVal) return;

    const deltaPayload = `Unit change: From ${oldVal} to ${newVal}`;

    addProfileRequest({
      userId: activeUser.id,
      userName: activeUser.displayName,
      userStateCode: activeUser.stateCode,
      userAvatar: activeUser.avatarUrl,
      userHouseStatus: activeUser.houseStatus,
      userRoom: activeUser.roomName,
      userTier: activeUser.tier,
      changeType: 'service_units',
      deltaPayload,
      unitChange: { oldVal, newVal },
    });

    setRequestSuccessMsg('Service Unit change request sent to Approvals queue.');
    showToast('Service Unit change request sent to Approvals queue.', 'success');
    setTimeout(() => setRequestSuccessMsg(null), 4000);
  };

  const handleRequestMaritalChange = () => {
    if (editedMarital === activeUser.maritalStatus) return;

    const oldVal = activeUser.maritalStatus;
    const newVal = editedMarital;
    const deltaPayload = `Marital Status change: From ${oldVal} to ${newVal}`;

    addProfileRequest({
      userId: activeUser.id,
      userName: activeUser.displayName,
      userStateCode: activeUser.stateCode,
      userAvatar: activeUser.avatarUrl,
      userHouseStatus: activeUser.houseStatus,
      userRoom: activeUser.roomName,
      userTier: activeUser.tier,
      changeType: 'marital_status',
      deltaPayload,
      maritalChange: { oldVal, newVal },
    });

    setRequestSuccessMsg('Marital status change request sent to Approvals queue.');
    showToast('Marital status change request sent to Approvals queue.', 'success');
    setTimeout(() => setRequestSuccessMsg(null), 4000);
  };

  return (
    <RevealOnScroll className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 transition-all duration-200">
        <div className="flex items-start justify-between gap-4 w-full">
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg md:text-xl font-bold leading-tight text-zinc-900 dark:text-white">
              Profile Settings
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
              {isSubmittingRole
                ? 'Update avatar photo directly or submit independent requests for Room, Service Units, and Marital status updates.'
                : 'Manage system security, avatar display, and house notification preferences.'}
            </p>
          </div>

          <div className="shrink-0 pt-0.5">
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-zinc-900 shadow-2xs inline-block whitespace-nowrap"
              style={{ backgroundColor: tierInfo.hexColor }}
            >
              {tierInfo.badgeText}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Photo Upload & Avatar Card (All Roles) */}
        <div className="lg:col-span-1 bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 space-y-4">
          <div className="border-b border-slate-900/10 dark:border-white/10 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
              <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Profile Photo</span>
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 font-bold bg-slate-900/5 dark:bg-white/10 px-2 py-0.5 rounded">Max 5MB</span>
          </div>

          <div className="flex flex-col items-center space-y-4 pt-2">
            <div className="relative">
              <img
                src={avatarPreview || activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                alt={activeUser.displayName}
                className="w-28 h-28 rounded-full object-cover shadow-md transition-all duration-200"
                style={{ border: `3px solid ${tierInfo.hexColor}` }}
              />
              {avatarPreview && (
                <span className="absolute top-0 right-0 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-md">
                  New
                </span>
              )}
            </div>

            <div className="text-center space-y-1">
              <div className="font-bold text-sm text-zinc-900 dark:text-white">
                {activeUser.firstName} {activeUser.middleName} {activeUser.lastName}
              </div>
              <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                {activeUser.stateCode}
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />

            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="w-full py-2.5 px-4 min-h-[44px] rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 hover:bg-slate-900/10 dark:hover:bg-black/60 text-xs font-bold text-zinc-900 dark:text-white flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                <span>{isProcessingPhoto ? 'Compressing Image...' : 'Choose Photo (< 5MB)'}</span>
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleSavePhoto}
                  className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black tracking-wider uppercase flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Photo Update</span>
                </button>
              )}
            </div>

            {photoSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center space-x-1.5 w-full">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{photoSuccessMsg}</span>
              </div>
            )}

            {photoErrorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center space-x-1.5 w-full">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{photoErrorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Profile Requests (Submitting Roles ONLY) & System Settings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Submitting Roles ONLY: Independent Profile Modification Pipeline */}
          {isSubmittingRole ? (
            <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 space-y-6">
              <div className="border-b border-slate-900/10 dark:border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                    <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Profile Modification</span>
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                    Submit change requests for Room, Service Units, or Marital status.
                  </p>
                </div>

                {pendingRequestsForUser.length > 0 && (
                  <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold flex items-center space-x-1 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{pendingRequestsForUser.length} Request(s) Pending</span>
                  </span>
                )}
              </div>

              {requestSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>{requestSuccessMsg}</span>
                </div>
              )}

              {/* 1. ROOM CHANGE FIELD */}
              <div className="p-4 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                    <Home className="w-4 h-4 text-emerald-500" />
                    <span>Room Assignment</span>
                  </label>
                  {hasPendingRoomRequest && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
                      Pending Approval
                    </span>
                  )}
                </div>

                <select
                  value={ROOM_OPTIONS.includes(editedRoom) ? editedRoom : (ROOM_OPTIONS[0] || editedRoom)}
                  onChange={(e) => setEditedRoom(e.target.value)}
                  disabled={hasPendingRoomRequest}
                  className="w-full py-2.5 px-3 min-h-[44px] rounded-xl border border-slate-900/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {!ROOM_OPTIONS.includes(activeUser.roomName) && (
                    <option value={activeUser.roomName}>{activeUser.roomName} (Current)</option>
                  )}
                  {ROOM_OPTIONS.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-0.5">
                  <span>Current: <strong className="text-zinc-800 dark:text-zinc-200">{activeUser.roomName}</strong></span>
                </div>

                <button
                  type="button"
                  disabled={hasPendingRoomRequest || editedRoom.trim() === activeUser.roomName}
                  onClick={handleRequestRoomChange}
                  className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-md mt-1"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                  <span>{hasPendingRoomRequest ? 'Room Change Pending Review' : 'Request Room Change'}</span>
                </button>
              </div>

              {/* 2. MULTI-SELECT SERVICE UNITS FIELD */}
              <div className="p-4 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>Service Units (Multi-Select Checkboxes)</span>
                  </label>
                  {hasPendingUnitRequest && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
                      Pending Approval
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Tick all service units you want to belong to. {/* (Selecting <strong className="text-emerald-600 dark:text-emerald-400">Welfare</strong> unit applies the ₦5,000 feeding subsidy rate). */}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SERVICE_UNITS.map((unit) => {
                    const isChecked = selectedUnits.includes(unit);
                    return (
                      <label
                        key={unit}
                        className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-white dark:bg-zinc-900 border-slate-900/10 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:bg-slate-900/5'
                        } ${hasPendingUnitRequest ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleUnit(unit)}
                          disabled={hasPendingUnitRequest}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                        <span>{unit}</span>
                      </label>
                    );
                  })}
                </div>

                <div className="text-[11px] text-zinc-500 pt-0.5">
                  Current Units: <strong className="text-zinc-800 dark:text-zinc-200">{activeUser.serviceUnit || 'None'}</strong>
                </div>

                <button
                  type="button"
                  disabled={
                    hasPendingUnitRequest ||
                    selectedUnits.sort().join(', ') ===
                      (activeUser.serviceUnit || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .sort()
                        .join(', ')
                  }
                  onClick={handleRequestUnitChange}
                  className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-md mt-1"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                  <span>{hasPendingUnitRequest ? 'Unit Change Pending Review' : 'Request Service Unit Change'}</span>
                </button>
              </div>

              {/* 3. MARITAL STATUS FIELD */}
              <div className="p-4 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-900 dark:text-white flex items-center space-x-1.5">
                    <Heart className="w-4 h-4 text-emerald-500" />
                    <span>Marital Status</span>
                  </label>
                  {hasPendingMaritalRequest && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold">
                      Pending Approval
                    </span>
                  )}
                </div>

                <select
                  value={editedMarital === 'Engaged' ? 'Engaged' : 'Not Engaged'}
                  onChange={(e) => setEditedMarital(e.target.value as any)}
                  disabled={hasPendingMaritalRequest}
                  className="w-full py-2.5 px-3 min-h-[44px] rounded-xl border border-slate-900/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <option value="Not Engaged">Not Engaged</option>
                  <option value="Engaged">Engaged</option>
                </select>
                <div className="text-[11px] text-zinc-500 pt-0.5">
                  Current: <strong className="text-zinc-800 dark:text-zinc-200">{activeUser.maritalStatus}</strong>
                </div>

                <button
                  type="button"
                  disabled={hasPendingMaritalRequest || editedMarital === activeUser.maritalStatus}
                  onClick={handleRequestMaritalChange}
                  className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-md mt-1"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400 dark:text-amber-600" />
                  <span>{hasPendingMaritalRequest ? 'Marital Request Pending Review' : 'Request Marital Status Change'}</span>
                </button>
              </div>

            </div>
          ) : (
            /* Governing Roles Notice Banner (Admin / Tripartite) */
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-2 text-xs">
              <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Governing Role Notice</span>
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                You are currently signed in under an administrative governance role (<strong>{activeUser.systemCategory.toUpperCase()}</strong>). Profile modification requests are reserved for submitting members. As a governing steward, you evaluate incoming delta requests inside the <strong>Approvals</strong> console.
              </p>
            </div>
          )}

          {/* Preferences Settings (All Roles)
          <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="border-b border-slate-900/10 dark:border-white/10 pb-3">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Notification & House Alerts</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl border border-slate-900/10 dark:border-white/5 bg-slate-900/5 dark:bg-black/50 shadow-inner flex items-center justify-between gap-3 min-h-[44px]">
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">House Announcement Alerts</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Receive instant push & banner alerts for general fellowship notices</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 min-w-[20px] min-h-[20px] accent-zinc-900 dark:accent-zinc-100 rounded cursor-pointer" />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-900/10 dark:border-white/5 bg-slate-900/5 dark:bg-black/50 shadow-inner flex items-center justify-between gap-3 min-h-[44px]">
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">Welfare & Meal Duty Reminders</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Alerts when meal schedules or welfare unit duties are updated</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 min-w-[20px] min-h-[20px] accent-zinc-900 dark:accent-zinc-100 rounded cursor-pointer" />
              </div>

              <div className="p-3.5 rounded-xl border border-slate-900/10 dark:border-white/5 bg-slate-900/5 dark:bg-black/50 shadow-inner flex items-center justify-between gap-3 min-h-[44px]">
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">Dues & Target Reminders</h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">Periodic financial target status updates</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 min-w-[20px] min-h-[20px] accent-zinc-900 dark:accent-zinc-100 rounded cursor-pointer" />
              </div>
            </div>
          </div> */}

          {/* Account Session & Sign Out Section */}
          <div className="bg-white/50 backdrop-blur-xl border border-rose-500/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-rose-500/20 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="border-b border-rose-500/10 dark:border-rose-500/20 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-rose-700 dark:text-rose-300 flex items-center space-x-2">
                  <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Account Security</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Currently signed in as <strong>{activeUser.displayName}</strong> ({activeUser.stateCode})
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                End your active portal session securely on this device.
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-2 shadow-md hover:shadow-lg transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </RevealOnScroll>
  );
};


