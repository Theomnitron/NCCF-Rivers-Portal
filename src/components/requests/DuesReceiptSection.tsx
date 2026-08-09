import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRequests } from '../../context/RequestsContext';
import { useToast } from '../../context/ToastContext';
import { PaymentType } from '../../types/ledger';
import { processClientSideFile, ProcessedFileResult } from '../../utils/fileProcessor';
import {
  Upload,
  FileText,
  CheckCircle2,
  X,
  FileCheck,
  Sparkles,
  Coins,
  DollarSign,
  AlertCircle,
} from 'lucide-react';

// const MONTH_OPTIONS = [
//   { key: 'AUG-2026', code: 'AUG', year: 2026, name: 'August 2026 (AUG \'26)' },
//   { key: 'SEP-2026', code: 'SEP', year: 2026, name: 'September 2026 (SEP \'26)' },
//   { key: 'OCT-2026', code: 'OCT', year: 2026, name: 'October 2026 (OCT \'26)' },
//   { key: 'NOV-2026', code: 'NOV', year: 2026, name: 'November 2026 (NOV \'26)' },
//   { key: 'DEC-2026', code: 'DEC', year: 2026, name: 'December 2026 (DEC \'26)' },
//   { key: 'JAN-2027', code: 'JAN', year: 2027, name: 'January 2027 (JAN \'27)' },
//   { key: 'FEB-2027', code: 'FEB', year: 2027, name: 'February 2027 (FEB \'27)' },
//   { key: 'MAR-2027', code: 'MAR', year: 2027, name: 'March 2027 (MAR \'27)' },
//   { key: 'APR-2027', code: 'APR', year: 2027, name: 'April 2027 (APR \'27)' },
//   { key: 'MAY-2027', code: 'MAY', year: 2027, name: 'May 2027 (MAY \'27)' },
//   { key: 'JUN-2027', code: 'JUN', year: 2027, name: 'June 2027 (JUN \'27)' },
//   { key: 'JUL-2027', code: 'JUL', year: 2027, name: 'July 2027 (JUL \'27)' },
//   { key: 'AUG-2027', code: 'AUG', year: 2027, name: 'August 2027 (AUG \'27)' },
// ];

export const DuesReceiptSection: React.FC = () => {
  const { activeUser } = useAuth();
  const { addDuesSubmission } = useRequests();
  const { showToast } = useToast();

  const [subType, setSubType] = useState<PaymentType>('combined');
  const [targetMonth, setTargetMonth] = useState<string>('2026-08'); // YYYY-MM format
  
  // Calculate month values from targetMonth YYYY-MM
  const [yearStr, monthNumStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const monthIdx = (parseInt(monthNumStr, 10) || 8) - 1;
  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MONTH_CODES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const monthName = MONTH_NAMES[monthIdx] || 'August';
  const monthCode = MONTH_CODES[monthIdx] || 'AUG';
  const monthKey = `${monthCode}-${year}`;

  // Role-based exemption & Gee status checks
  const isExempt =
    Boolean(activeUser?.isExempted) ||
    activeUser?.systemCategory === 'admin' ||
    activeUser?.systemCategory === 'tripartite' ||
    activeUser?.houseStatus === 'Admin' ||
    activeUser?.houseStatus === 'Tripartite' ||
    activeUser?.houseStatus === 'Delegate';

  const isGee = activeUser?.houseStatus === 'Gee';

  // Calculate default amounts based on targets & subType
  const maintTarget = isGee ? 15000 : (activeUser?.targets?.maintenance ?? 15000);
  const feedTarget = isGee ? 0 : (activeUser?.targets?.feeding ?? 10000);
  const fullTarget = maintTarget + feedTarget;
  const defaultAmount = subType === 'maintenance' && !isGee ? maintTarget : fullTarget;

  const [rawAmountText, setRawAmountText] = useState<string>(defaultAmount.toString());
  const [processedFile, setProcessedFile] = useState<ProcessedFileResult | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format amount input as currency with ₦
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setRawAmountText(val);
  };

  const numericAmount = parseInt(rawAmountText, 10) || 0;
  const formattedDisplayAmount = rawAmountText ? `₦${numericAmount.toLocaleString()}` : '';

  const handleSubTypeChange = (newType: PaymentType) => {
    setSubType(newType);
    const amt = newType === 'maintenance' ? maintTarget : fullTarget;
    setRawAmountText(amt.toString());
  };

  const handleFileDrop = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    // Validate type - Image ONLY
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Unsupported file format. Please upload a PNG, JPG, or WEBP image of your bank receipt.');
      return;
    }

    setErrorMessage(null);
    setIsProcessingFile(true);

    try {
      // Pass skipCompression: true to retain 100% full original uncompressed quality for payment receipts
      const result = await processClientSideFile(file, { skipCompression: true });
      setProcessedFile(result);
    } catch (err) {
      console.error('File compression error', err);
      setErrorMessage('Failed to process image payload. Please try another file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount greater than ₦0.');
      showToast('Please enter a valid payment amount greater than ₦0.', 'warning');
      return;
    }

    if (!processedFile) {
      setErrorMessage('Receipt image upload is required for verification.');
      showToast('Receipt image upload is required for verification.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const txnId = addDuesSubmission({
      userId: activeUser.id,
      userName: activeUser.displayName || `${activeUser.firstName} ${activeUser.lastName}`,
      userStateCode: activeUser.stateCode,
      userAvatar: activeUser.avatarUrl,
      userHouseStatus: activeUser.houseStatus,
      userRoom: activeUser.roomName,
      userTier: activeUser.tier,
      monthKey,
      monthCode,
      year,
      monthName,
      subscriptionType: subType,
      amountPaid: numericAmount,
      expectedAmount: defaultAmount,
      fileName: processedFile.fileName,
      fileDataUrl: processedFile.dataUrl,
      fileType: processedFile.fileType,
      originalSizeText: processedFile.originalSizeText,
      processedSizeText: processedFile.processedSizeText,
    });

    setIsSubmitting(false);
    const msg = `Dues clearance proof (${txnId}) submitted for ${monthName} ${year}! Pending Tripartite/Admin approval.`;
    setSuccessMessage(msg);
    showToast(msg, 'success');
    setProcessedFile(null);
    setTimeout(() => setSuccessMessage(null), 6000);
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 transition-all duration-200">
      
      {/* Header Bar */}
      <div className="border-b border-slate-900/10 dark:border-white/10 pb-3 mb-4 flex flex-col xs:flex-row xs:items-center justify-between gap-2 items-start">
        <div>
          <h3 className="text-base sm:text-lg font-bold leading-tight text-zinc-900 dark:text-white flex items-center space-x-2">
            <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Submit Dues Clearance Receipt</span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
            Submit bank transfer receipts for monthly house upkeep & kitchen assessments
          </p>
        </div>
        <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800">
          ROLLING CYCLE '26 - '27
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

      {isExempt ? (
        <div className="p-6 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-center space-y-2.5 my-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h4 className="text-base font-bold text-emerald-100">Exempted from Dues Assessment</h4>
          <p className="text-xs sm:text-sm text-emerald-300/90 max-w-md mx-auto leading-relaxed">
            Corpers with house status <strong>Delegate</strong> or Governing roles (Admin / Tripartite) are exempt from monthly state house dues. Submission of dues clearance receipts is disabled for your account.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
          {/* 1. Subscription Type Toggle Cards */}
          <div>
            <label className="block text-zinc-800 dark:text-zinc-200 font-bold mb-2">
              Subscription Type
            </label>
            <div className={`grid gap-3 ${isGee ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              <button
                type="button"
                onClick={() => handleSubTypeChange('combined')}
                className={`p-3.5 rounded-xl border text-left transition-all min-h-[48px] cursor-pointer flex items-center justify-between ${
                  subType === 'combined'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md font-bold'
                    : 'bg-slate-900/5 dark:bg-black/40 border-slate-900/10 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-slate-900/10'
                }`}
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm">
                    {isGee ? 'Full Assessment' : 'Full Assessment (Maintenance + Welfare)'}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${subType === 'combined' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    Target: ₦{fullTarget.toLocaleString()} / month
                  </div>
                </div>
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${subType === 'combined' ? 'border-emerald-400 bg-emerald-400' : 'border-zinc-400'}`}>
                  {subType === 'combined' && <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                </span>
              </button>

              {!isGee && (
                <button
                  type="button"
                  onClick={() => handleSubTypeChange('maintenance')}
                  className={`p-3.5 rounded-xl border text-left transition-all min-h-[48px] cursor-pointer flex items-center justify-between ${
                    subType === 'maintenance'
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-md font-bold'
                      : 'bg-slate-900/5 dark:bg-black/40 border-slate-900/10 dark:border-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-slate-900/10'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm">Maintenance ONLY</div>
                    <div className={`text-[11px] mt-0.5 ${subType === 'maintenance' ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                      Target: ₦{maintTarget.toLocaleString()} / month
                    </div>
                  </div>
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${subType === 'maintenance' ? 'border-emerald-400 bg-emerald-400' : 'border-zinc-400'}`}>
                    {subType === 'maintenance' && <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                  </span>
                </button>
              )}
            </div>
          </div>

        {/* 2. Target Month Input (YYYY-MM) & Amount Paid Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-800 dark:text-zinc-200 font-bold mb-1.5">
              Target Month (YYYY-MM Format)
            </label>
            <input
              type="month"
              value={targetMonth}
              min="2026-01"
              max="2028-12"
              onChange={(e) => setTargetMonth(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px] cursor-pointer"
              required
            />
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">
              Selected Cycle: <span className="font-bold text-zinc-900 dark:text-white">{monthName} {year}</span> ({monthKey})
            </span>
          </div>

          <div>
            <label className="block text-zinc-800 dark:text-zinc-200 font-bold mb-1.5">
              Amount Paid
            </label>
            <div className="relative">
              <input
                type="text"
                value={formattedDisplayAmount}
                onChange={handleAmountChange}
                placeholder="₦0"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                required
              />
            </div>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block">
              Assessed target: ₦{defaultAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 3. Drag-and-Drop Client-Side File Processing Engine (Image ONLY) */}
        <div>
          <label className="block text-zinc-800 dark:text-zinc-200 font-bold mb-1.5">
            Attach Bank Transfer Proof (Image ONLY - PNG, JPG, WEBP)
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
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center cursor-pointer min-h-[140px] ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-300 dark:border-zinc-700 bg-slate-900/5 dark:bg-black/30 hover:border-zinc-500'
              }`}
              onClick={() => {
                const el = document.getElementById('dues-file-input');
                if (el) el.click();
              }}
            >
              <input
                type="file"
                id="dues-file-input"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={(e) => handleFileDrop(e.target.files)}
              />

              {isProcessingFile ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    Compressing image payload on HTML5 Canvas...
                  </span>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-zinc-500 dark:text-zinc-400 mb-2" />
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    Drag & drop your receipt image here, or <span className="text-emerald-600 dark:text-emerald-400 underline">browse</span>
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                    Image ONLY — Supports PNG, JPG, and WEBP formats
                  </p>
                </>
              )}
            </div>
          ) : (
            /* High-Contrast Glass Thumbnail Preview with Metrics & Remove */
            <div className="p-4 rounded-xl border border-white/80 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center space-x-3 min-w-0">
                {processedFile.fileType === 'image' && processedFile.dataUrl ? (
                  <img
                    src={processedFile.dataUrl}
                    alt="Receipt Thumbnail"
                    className="w-16 h-16 rounded-lg object-cover border border-white/20 shadow-md shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center text-white shrink-0 font-mono font-bold text-xs">
                    <FileText className="w-8 h-8 text-emerald-400" />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm truncate">
                    {processedFile.fileName}
                  </div>
                  <div className="flex items-center space-x-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    <span>Original: {processedFile.originalSizeText}</span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Processed: {processedFile.processedSizeText}
                    </span>
                  </div>
                  <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Canvas Compression Applied
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProcessedFile(null)}
                className="py-1.5 px-3 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 hover:bg-rose-500/20 transition-colors flex items-center space-x-1 cursor-pointer shrink-0 min-h-[36px]"
              >
                <X className="w-4 h-4" />
                <span>Remove File</span>
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isProcessingFile}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/30 transition-all duration-150 cursor-pointer min-h-[44px]"
        >
          <Upload className="w-4 h-4" />
          <span>Submit Dues Proof ({formattedDisplayAmount || '₦0'})</span>
        </button>

      </form>
      )}
    </div>
  );
};
