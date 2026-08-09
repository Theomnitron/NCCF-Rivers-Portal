import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests, TravelRequestSubmission } from '../../context/RequestsContext';
import { useToast } from '../../context/ToastContext';
import { processClientSideFile, ProcessedFileResult } from '../../utils/fileProcessor';
import {
  Plane,
  Calendar,
  Send,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export const TravelRequestSection: React.FC = () => {
  const { activeUser } = useAuth();
  const { travelRequests, addTravelRequest } = useRequests();
  const { showToast } = useToast();

  // Filter travel requests for this user
  const userTravelRequests = travelRequests.filter((r) => r.userId === activeUser.id);

  const [departureDate, setDepartureDate] = useState('2026-08-12');
  const [returnDate, setReturnDate] = useState('2026-08-18');
  const [reason, setReason] = useState('');
  const [detailedExplanation, setDetailedExplanation] = useState('');
  const [contactDuringAbsence, setContactDuringAbsence] = useState('');
  const [processedFile, setProcessedFile] = useState<ProcessedFileResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileDrop = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload a PNG, JPG, or WEBP image of your supporting letter.');
      return;
    }

    setErrorMessage(null);
    setIsProcessingFile(true);

    try {
      // Minimal compression for official letters/documents snapped with phone to ensure handwritten text is crisp
      const result = await processClientSideFile(file, { maxWidth: 2500, maxHeight: 2500, quality: 0.95 });
      setProcessedFile(result);
    } catch (err) {
      console.error('File error', err);
      setErrorMessage('Failed to process letter file payload.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage('Please provide a short travel reason.');
      return;
    }
    if (!contactDuringAbsence.trim()) {
      setErrorMessage('Please provide contact information during your absence.');
      return;
    }
    if (new Date(returnDate) < new Date(departureDate)) {
      setErrorMessage('Return date cannot be earlier than departure date.');
      return;
    }
    if (!processedFile) {
      setErrorMessage('Please upload a photo/copy of your signed exeat letter or official request document.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const reqId = addTravelRequest({
      userId: activeUser.id,
      userName: activeUser.displayName || `${activeUser.firstName} ${activeUser.lastName}`,
      userStateCode: activeUser.stateCode,
      userAvatar: activeUser.avatarUrl,
      userHouseStatus: activeUser.houseStatus,
      userRoom: activeUser.roomName,
      userTier: activeUser.tier,
      departureDate,
      returnDate,
      reason,
      detailedExplanation: detailedExplanation.trim() ? detailedExplanation : undefined,
      contactDuringAbsence,
      letterFileName: processedFile?.fileName,
      letterFileDataUrl: processedFile?.dataUrl,
      letterFileType: processedFile?.fileType,
      letterOriginalSizeText: processedFile?.originalSizeText,
      letterProcessedSizeText: processedFile?.processedSizeText,
    });

    setIsSubmitting(false);
    setSuccessMessage(`Travel permit request (${reqId}) submitted successfully for Executive review!`);
    showToast(`Travel permit request (${reqId}) submitted successfully!`, 'success');
    setReason('');
    setDetailedExplanation('');
    setContactDuringAbsence('');
    setProcessedFile(null);
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  const getStatusBadge = (status: TravelRequestSubmission['status']) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Approved',
          icon: '🟢',
          style: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'modified_approved':
        return {
          label: 'Modified & Approved',
          icon: '🔵',
          style: 'bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          icon: '🔴',
          style: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
        };
      case 'pending':
      default:
        return {
          label: 'Pending Review',
          icon: '🟡',
          style: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Module Container */}
      <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 transition-all duration-200">
        
        {/* Header Bar */}
        <div className="border-b border-slate-900/10 dark:border-white/10 pb-3 mb-4 flex flex-col xs:flex-row xs:items-center justify-between gap-2 items-start">
          <div>
            <h3 className="text-base sm:text-lg font-bold leading-tight text-zinc-900 dark:text-white flex items-center space-x-2">
              <Plane className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
              <span>Submit Travel Request / Exeat Notice</span>
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
              Request formal travel permission from the Executive Council & Tripartite Stewards
            </p>
          </div>
          <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/20 dark:bg-sky-950/80 dark:text-sky-300 dark:border-sky-800">
            EXEAT REGULATION
          </span>
        </div>

        {successMessage && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-xs underline text-emerald-400 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-rose-950/90 text-rose-300 border border-rose-500/30 text-xs sm:text-sm flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-xs underline text-rose-400 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          
          {/* 1. Date Range Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-800 dark:text-zinc-200 font-bold mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-sky-500" />
                <span>Departure Date</span>
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                required
              />
            </div>

            <div>
              <label className="block text-zinc-800 dark:text-zinc-200 font-bold mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-sky-500" />
                <span>Return Date</span>
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
                required
              />
            </div>
          </div>

          {/* 2. Short Travel Reason */}
          <div>
            <label className="block text-zinc-800 dark:text-zinc-200 font-bold mb-1.5">
              Short Travel Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Attending Family Wedding in Lagos State"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
              required
            />
          </div>

          {/* 3. Detailed Context (Optional) */}
          <div>
            <label className="block text-zinc-800 dark:text-zinc-200 font-bold mb-1.5">
              Detailed Context (Optional)
            </label>
            <textarea
              value={detailedExplanation}
              onChange={(e) => setDetailedExplanation(e.target.value)}
              rows={3}
              placeholder="Provide full context regarding travel destination and coverage for duties (optional)..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* 4. Contact During Absence (Required) */}
          <div>
            <label className="block text-zinc-800 dark:text-zinc-200 font-bold mb-1.5">
              Contact During Absence
            </label>
            <input
              type="text"
              value={contactDuringAbsence}
              onChange={(e) => setContactDuringAbsence(e.target.value)}
              placeholder="e.g. Phone number (+234 803 000 0000) or emergency contact..."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px]"
              required
            />
          </div>

          {/* 5. Supporting Letter (Image ONLY) */}
          <div>
            <label className="block text-zinc-800 dark:text-zinc-200 font-bold mb-1.5">
              Supporting Letter Image (Image ONLY)
            </label>

            {!processedFile ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileDrop(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[120px] ${
                  isDragging
                    ? 'border-sky-500 bg-sky-500/10'
                    : 'border-slate-300 dark:border-zinc-700 bg-slate-900/5 dark:bg-black/30 hover:border-zinc-500'
                }`}
                onClick={() => {
                  const el = document.getElementById('travel-file-input');
                  if (el) el.click();
                }}
              >
                <input
                  type="file"
                  id="travel-file-input"
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                  onChange={(e) => handleFileDrop(e.target.files)}
                />

                {isProcessingFile ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                      Compressing image payload...
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-zinc-500 dark:text-zinc-400 mb-1" />
                    <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      Drop official supporting letter image here
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Image ONLY — Supports PNG, JPG, and WEBP formats
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-white/80 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 backdrop-blur-md flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-sky-950/80 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-zinc-900 dark:text-white text-xs truncate">
                      {processedFile.fileName}
                    </div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                      Size: {processedFile.processedSizeText}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setProcessedFile(null)}
                  className="py-1 px-2.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center space-x-1 cursor-pointer shrink-0 min-h-[32px]"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isProcessingFile}
            className="w-full py-3 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98] transition-all duration-150 text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-md cursor-pointer min-h-[44px]"
          >
            <Send className="w-4 h-4" />
            <span>Submit Travel Request</span>
          </button>

        </form>
      </div>

      {/* Interactive Absence Status Feed */}
      <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 transition-all duration-200">
        
        <div className="border-b border-slate-900/10 dark:border-white/10 pb-3 mb-4 flex flex-col xs:flex-row xs:items-center justify-between gap-2 items-start">
          <h3 className="text-base sm:text-lg font-bold leading-tight text-zinc-900 dark:text-white flex items-center space-x-2">
            <Clock className="w-5 h-5 text-zinc-700 dark:text-zinc-300 flex-shrink-0" />
            <span>Absence & Travel Status Feed</span>
          </h3>
          <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider rounded-full bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-zinc-100 border border-slate-900/10 dark:border-white/10">
            {userTravelRequests.length} Submissions
          </span>
        </div>

        {userTravelRequests.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium">
            No travel requests submitted yet.
          </div>
        ) : (
          <div className="space-y-3.5">
            {userTravelRequests.map((req) => {
              const badge = getStatusBadge(req.status);
              const displayDept = req.approvedDepartureDate || req.departureDate;
              const displayRet = req.approvedReturnDate || req.returnDate;

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-xl border border-slate-900/10 dark:border-white/5 bg-slate-900/5 dark:bg-black/50 shadow-inner space-y-2 text-xs sm:text-sm transition-all active:scale-[0.98] duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                >
                  <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-zinc-600 dark:text-zinc-400">
                      {req.id} • Submitted {req.submittedAt}
                    </span>
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold tracking-wide rounded-full border backdrop-blur-md shadow-2xs inline-flex items-center space-x-1 ${badge.style}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div className="font-bold text-zinc-900 dark:text-white text-sm">
                    {req.reason}
                  </div>

                  {req.detailedExplanation && (
                    <p className="text-zinc-600 dark:text-zinc-400 text-xs leading-relaxed">
                      {req.detailedExplanation}
                    </p>
                  )}

                  {req.contactDuringAbsence && (
                    <div className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                      <span className="font-bold text-zinc-900 dark:text-white">Contact During Absence:</span> {req.contactDuringAbsence}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-900/10 dark:border-white/10 font-mono text-xs">
                    <div className="text-zinc-800 dark:text-zinc-200">
                      Approved Window:{' '}
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {displayDept} – {displayRet}
                      </span>
                    </div>
                    {req.letterFileName && (
                      <span className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold underline">
                        📄 {req.letterFileName}
                      </span>
                    )}
                  </div>

                  {req.rejectionReason && (
                    <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-medium mt-2">
                      <span className="font-bold">Executive Feedback:</span> {req.rejectionReason}
                    </div>
                  )}

                  {req.reviewedBy && (
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 italic">
                      Reviewed by {req.reviewedBy} on {req.reviewedAt}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
