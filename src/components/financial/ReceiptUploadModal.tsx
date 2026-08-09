import React, { useState } from 'react';
import { CorperProfile } from '../../types/corper';
import { PaymentType } from '../../types/ledger';
import {
  X,
  Upload,
  FileCheck,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Coins,
  Receipt,
  Sparkles,
} from 'lucide-react';

const MODAL_MONTH_GROUPS = [
  {
    year: 2026,
    label: '2026 Fiscal Cycle',
    months: [
      { key: 'AUG', name: 'August' },
      { key: 'SEP', name: 'September' },
      { key: 'OCT', name: 'October' },
      { key: 'NOV', name: 'November' },
      { key: 'DEC', name: 'December' },
    ],
  },
  {
    year: 2027,
    label: '2027 Fiscal Cycle',
    months: [
      { key: 'JAN', name: 'January' },
      { key: 'FEB', name: 'February' },
      { key: 'MAR', name: 'March' },
      { key: 'APR', name: 'April' },
      { key: 'MAY', name: 'May' },
      { key: 'JUN', name: 'June' },
      { key: 'JUL', name: 'July' },
      { key: 'AUG', name: 'August' },
      { key: 'SEP', name: 'September' },
      { key: 'OCT', name: 'October' },
      { key: 'NOV', name: 'November' },
      { key: 'DEC', name: 'December' },
    ],
  },
];

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUser: CorperProfile;
  initialMonthKey?: string;
  onUploadSuccess: (
    monthKey: string,
    paymentType: PaymentType,
    amount: number,
    transactionId: string,
    fileName: string
  ) => void;
}

export const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({
  isOpen,
  onClose,
  activeUser,
  initialMonthKey = 'AUG',
  onUploadSuccess,
}) => {
  const initialFullKey = initialMonthKey.includes('-')
    ? initialMonthKey
    : `${initialMonthKey}-2026`;

  const [selectedMonthKey, setSelectedMonthKey] = useState(initialFullKey);
  const [paymentType, setPaymentType] = useState<PaymentType>('combined');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>(
    `TXN-2026-${initialMonthKey.split('-')[0]}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);

  if (!isOpen) return null;

  const [monthCode, monthYearStr] = selectedMonthKey.split('-');
  const monthYear = monthYearStr ? parseInt(monthYearStr, 10) : 2026;
  const groupObj = MODAL_MONTH_GROUPS.find((g) => g.year === monthYear);
  const currentMonthObj =
    groupObj?.months.find((m) => m.key === monthCode) || MODAL_MONTH_GROUPS[0].months[0];

  const maintTarget = activeUser?.targets?.maintenance ?? 15000;
  const feedTarget = activeUser?.targets?.feeding ?? 10000;

  // Calculate default target based on payment type toggle
  let defaultAmount = maintTarget + feedTarget;
  if (paymentType === 'maintenance') defaultAmount = maintTarget;
  if (paymentType === 'feeding') defaultAmount = feedTarget;

  const finalAmount = customAmount !== '' ? parseFloat(customAmount) || 0 : defaultAmount;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    // Simulate snappy network submission
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessState(true);

      const fileName = uploadedFile
        ? uploadedFile.name
        : `bank_transfer_receipt_${monthCode.toLowerCase()}.png`;

      onUploadSuccess(
        monthCode,
        paymentType,
        finalAmount,
        transactionId || `TXN-${monthYear}-${monthCode}-${Math.floor(1000 + Math.random() * 9000)}`,
        fileName
      );

      setTimeout(() => {
        setShowSuccessState(false);
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white/80 dark:bg-zinc-900/90 border border-white/90 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-2xl rounded-3xl p-6 sm:p-7 overflow-hidden transition-all text-zinc-900 dark:text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900/10 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">
                Upload Dues Payment Proof
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Submit bank transfer receipt for verification by Executive Stewards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showSuccessState ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30 shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold">Proof Submitted!</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-xs">
              Your receipt for <span className="font-bold text-zinc-900 dark:text-white">{currentMonthObj.name}</span> has been logged as <span className="font-bold text-amber-500">Pending Review</span>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs sm:text-sm">
            
            {/* Month & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Assessment Month
                </label>
                <select
                  value={selectedMonthKey}
                  onChange={(e) => {
                    setSelectedMonthKey(e.target.value);
                    const code = e.target.value.split('-')[0];
                    setTransactionId(`TXN-${monthYear}-${code}-${Math.floor(1000 + Math.random() * 9000)}`);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                >
                  {MODAL_MONTH_GROUPS.map((group) => (
                    <optgroup
                      key={group.year}
                      label={group.label}
                      className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold"
                    >
                      {group.months.map((m) => {
                        const fullKey = `${m.key}-${group.year}`;
                        return (
                          <option
                            key={fullKey}
                            value={fullKey}
                            className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-mono"
                          >
                            {m.name} {group.year} ({m.key})
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Payment Type
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-black/50 border border-slate-300 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setPaymentType('combined')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg transition-all min-h-[36px] cursor-pointer ${
                      paymentType === 'combined'
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Both
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('maintenance')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg transition-all min-h-[36px] cursor-pointer ${
                      paymentType === 'maintenance'
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Maint
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('feeding')}
                    className={`py-1.5 text-[11px] font-bold rounded-lg transition-all min-h-[36px] cursor-pointer ${
                      paymentType === 'feeding'
                        ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Feeding
                  </button>
                </div>
              </div>
            </div>

            {/* Amount Paid & Transaction Ref Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Amount Paid (₦)
                </label>
                <input
                  type="number"
                  placeholder={defaultAmount.toString()}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block font-medium">
                  Assessed target: ₦{defaultAmount.toLocaleString()} for {currentMonthObj.name} '{monthYear.toString().slice(-2)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Transaction / Bank Ref ID
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-black/50 border border-slate-300 dark:border-zinc-700 text-zinc-900 dark:text-white font-mono text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  placeholder="e.g. TXN-2026-JUL-8492"
                />
              </div>
            </div>

            {/* File Dropzone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Upload Payment Receipt (JPG, PNG, WEBP)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : uploadedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-300 dark:border-zinc-700 hover:border-slate-400 dark:hover:border-zinc-600 bg-slate-100/50 dark:bg-black/30'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                />

                {uploadedFile ? (
                  <div className="flex items-center justify-center space-x-3 text-emerald-600 dark:text-emerald-400">
                    <FileCheck className="w-6 h-6 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="font-bold text-xs truncate max-w-[200px] sm:max-w-[280px]">
                        {uploadedFile.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {(uploadedFile.size / 1024).toFixed(1)} KB • Click or drop to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-2">
                    <Upload className="w-6 h-6 mx-auto text-zinc-500 dark:text-zinc-400" />
                    <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 underline">
                        Click to browse file
                      </span>{' '}
                      or drag & drop here
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      Maximum file size: 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl border border-slate-300 dark:border-zinc-700 hover:bg-slate-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/30 cursor-pointer transition-all duration-150 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <span className="inline-block animate-spin font-bold">⌛ Submitting...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Proof</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
