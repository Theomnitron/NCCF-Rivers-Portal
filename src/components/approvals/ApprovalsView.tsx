import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { hasTripartiteAccess } from '../../types/corper';
import { RevealOnScroll } from '../common/RevealOnScroll';
import { ZoomableImageViewer } from '../common/ZoomableImageViewer';
import {
  useRequests,
  DuesReceiptSubmission,
  TravelRequestSubmission,
  ProfileChangeRequestSubmission,
} from '../../context/RequestsContext';
import { evaluateTier } from '../../utils/tierEvaluator';
import {
  ShieldCheck,
  Coins,
  Plane,
  CheckCircle2,
  XCircle,
  Edit3,
  Eye,
  Calendar,
  FileText,
  User,
  X,
  AlertCircle,
  Sparkles,
  Check,
  UserCheck,
} from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const { activeUser, updateUserProfile } = useAuth();
  const { showToast } = useToast();
  const {
    duesSubmissions,
    travelRequests,
    profileRequests,
    approveDuesSubmission,
    rejectDuesSubmission,
    approveTravelRequest,
    rejectTravelRequest,
    approveProfileRequest,
    rejectProfileRequest,
  } = useRequests();

  const [activeSubTab, setActiveSubTab] = useState<'dues' | 'travel' | 'profile'>('dues');

  // Preview Modal State for Receipts/Documents
  const [previewItem, setPreviewItem] = useState<{
    title: string;
    fileName?: string;
    fileDataUrl?: string;
    fileType?: string;
    details: string;
  } | null>(null);

  // Modify & Approve Modal State for Dues
  const [modifyDuesItem, setModifyDuesItem] = useState<DuesReceiptSubmission | null>(null);
  const [overrideAmountText, setOverrideAmountText] = useState('');

  // Modify & Approve Modal State for Travel
  const [modifyTravelItem, setModifyTravelItem] = useState<TravelRequestSubmission | null>(null);
  const [overrideDeptDate, setOverrideDeptDate] = useState('');
  const [overrideRetDate, setOverrideRetDate] = useState('');

  // Reject Prompt Modal State
  const [rejectingItem, setRejectingItem] = useState<{ id: string; type: 'dues' | 'travel' | 'profile'; name: string } | null>(
    null
  );
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  // Helper for rendering Corper Full Name + House Status accent color pill
  const renderCorperBadgeCell = (
    userName: string,
    houseStatus: string,
    stateCode?: string,
    tier?: number
  ) => {
    const cleanUserName = userName ? userName.replace(/\s*\([^)]*\)/g, '').trim() : '';
    const tierInfo = evaluateTier({ houseStatus: houseStatus as any, tier });
    return (
      <div className="flex flex-col text-left">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          <span className="font-bold text-zinc-900 dark:text-white font-sans text-xs sm:text-sm">{cleanUserName}</span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-zinc-950 inline-block whitespace-nowrap shadow-2xs"
            style={{ backgroundColor: tierInfo.hexColor }}
          >
            {houseStatus}
          </span>
        </div>
        {stateCode && (
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
            {stateCode}
          </span>
        )}
      </div>
    );
  };

  // Reviewer Name string
  const isTripartiteSteward = hasTripartiteAccess(activeUser);
  const reviewerName = `${activeUser.displayName} (${activeUser.systemCategory === 'admin' ? 'Admin Data Steward' : isTripartiteSteward ? 'Tripartite Steward' : 'Steward'})`;

  // Handlers for Dues
  const handleApproveDues = (sub: DuesReceiptSubmission) => {
    approveDuesSubmission(sub.id, reviewerName);
    showToast(`Approved dues submission for ${sub.userName}`, 'success');
  };

  const handleOpenModifyDues = (sub: DuesReceiptSubmission) => {
    setModifyDuesItem(sub);
    setOverrideAmountText(sub.amountPaid.toString());
  };

  const handleConfirmModifyDues = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyDuesItem) return;
    const num = parseInt(overrideAmountText, 10) || modifyDuesItem.amountPaid;
    approveDuesSubmission(modifyDuesItem.id, reviewerName, num);
    showToast(`Modified & approved dues for ${modifyDuesItem.userName} (₦${num.toLocaleString()})`, 'success');
    setModifyDuesItem(null);
  };

  // Handlers for Travel
  const handleApproveTravel = (req: TravelRequestSubmission) => {
    approveTravelRequest(req.id, reviewerName, undefined, undefined, updateUserProfile);
    showToast(`Approved travel permit for ${req.userName}`, 'success');
  };

  const handleOpenModifyTravel = (req: TravelRequestSubmission) => {
    setModifyTravelItem(req);
    setOverrideDeptDate(req.departureDate);
    setOverrideRetDate(req.returnDate);
  };

  const handleConfirmModifyTravel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyTravelItem) return;
    approveTravelRequest(modifyTravelItem.id, reviewerName, overrideDeptDate, overrideRetDate, updateUserProfile);
    showToast(`Modified & approved travel dates for ${modifyTravelItem.userName}`, 'success');
    setModifyTravelItem(null);
  };

  // Handler for Profile Requests
  const handleApproveProfile = (req: ProfileChangeRequestSubmission) => {
    approveProfileRequest(req.id, reviewerName, updateUserProfile);
    showToast(`Approved profile update for ${req.userName}`, 'success');
  };

  // Handler for Reject
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    const reason = rejectionReasonText.trim() || 'Submission rejected by governance stewards.';

    if (rejectingItem.type === 'dues') {
      rejectDuesSubmission(rejectingItem.id, reviewerName, reason);
      showToast(`Rejected dues submission for ${rejectingItem.name}`, 'info');
    } else if (rejectingItem.type === 'travel') {
      rejectTravelRequest(rejectingItem.id, reviewerName, reason);
      showToast(`Rejected travel request for ${rejectingItem.name}`, 'info');
    } else if (rejectingItem.type === 'profile') {
      rejectProfileRequest(rejectingItem.id, reviewerName, reason);
      showToast(`Rejected profile request for ${rejectingItem.name}`, 'info');
    }

    setRejectingItem(null);
    setRejectionReasonText('');
  };

  const pendingDues = duesSubmissions.filter((d) => d.status === 'pending');
  const processedDues = duesSubmissions.filter((d) => d.status !== 'pending');

  const pendingTravel = travelRequests.filter((t) => t.status === 'pending');
  const processedTravel = travelRequests.filter((t) => t.status !== 'pending');

  const pendingProfile = profileRequests.filter((p) => p.status === 'pending');
  const processedProfile = profileRequests.filter((p) => p.status !== 'pending');

  return (
    <div className="space-y-6">
      
      {/* Executive Approvals Header Banner */}
      <RevealOnScroll delay={0.05}>
        <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-5 sm:p-6 transition-all duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-start sm:items-center space-x-2">
                  <h1 className="text-base sm:text-lg md:text-xl font-bold leading-tight text-zinc-900 dark:text-white">
                    Approvals Console
                  </h1>
                  <span className="text-[10px] whitespace-nowrap shrink-0 font-mono font-bold bg-amber-500/20 text-amber-600 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    STEWARD EVALUATOR
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                  Evaluate member dues clearance proofs, travel exeat permits, & profile modification requests.
                </p>
              </div>
            </div>

            <div className="flex items-start sm:items-center space-x-2 font-mono text-xs">
              <span className="px-3 py-1.5 whitespace-nowrap shrink-0 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-500/20 font-bold">
                {pendingDues.length + pendingTravel.length + pendingProfile.length} PENDING APPROVAL
              </span>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* Segmented Control Bar */}
      <RevealOnScroll delay={0.1}>
        <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-1.5 sm:p-3 transition-all duration-200">
          <div className="grid grid-cols-3 gap-1 sm:gap-2 items-center">
            <button
              type="button"
              onClick={() => setActiveSubTab('dues')}
              className={`w-full py-2 sm:py-2.5 px-1 sm:px-3.5 rounded-xl text-[11px] sm:text-sm font-bold flex items-center justify-center space-x-1 sm:space-x-2 transition-all cursor-pointer min-h-[44px] ${
                activeSubTab === 'dues'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
              }`}
            >
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-emerald-500" />
              <span className="truncate text-center">
                <span className="inline sm:hidden">Dues ({pendingDues.length})</span>
                <span className="hidden sm:inline">Dues Receipts ({pendingDues.length})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('travel')}
              className={`w-full py-2 sm:py-2.5 px-1 sm:px-3.5 rounded-xl text-[11px] sm:text-sm font-bold flex items-center justify-center space-x-1 sm:space-x-2 transition-all cursor-pointer min-h-[44px] ${
                activeSubTab === 'travel'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
              }`}
            >
              <Plane className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-sky-500" />
              <span className="truncate text-center">
                <span className="inline sm:hidden">Travel ({pendingTravel.length})</span>
                <span className="hidden sm:inline">Travel Permits ({pendingTravel.length})</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('profile')}
              className={`w-full py-2 sm:py-2.5 px-1 sm:px-3.5 rounded-xl text-[11px] sm:text-sm font-bold flex items-center justify-center space-x-1 sm:space-x-2 transition-all cursor-pointer min-h-[44px] ${
                activeSubTab === 'profile'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-amber-500" />
              <span className="truncate text-center">
                <span className="inline sm:hidden">Profile ({pendingProfile.length})</span>
                <span className="hidden sm:inline">Profile Requests ({pendingProfile.length})</span>
              </span>
            </button>
          </div>
        </div>
      </RevealOnScroll>

      {/* DUES CLEARANCE RECEIPTS SUB-TAB */}
      {activeSubTab === 'dues' && (
        <div className="space-y-6">
          
          {/* Pending Queue Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Pending Dues Review Queue ({pendingDues.length})</span>
            </h3>

            {pendingDues.length === 0 ? (
              <div className="bg-white/50 backdrop-blur-xl border border-white/80 dark:bg-zinc-950/60 dark:border-white/10 rounded-2xl p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
                No pending dues receipts in the evaluation queue. All clear!
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingDues.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white/60 backdrop-blur-xl border border-white/90 dark:bg-zinc-950/70 dark:border-white/15 shadow-md rounded-2xl p-5 space-y-4 transition-all hover:border-emerald-500/40"
                  >
                    {/* Header: User Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={sub.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt={sub.userName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shrink-0"
                        />
                        <div className="min-w-0">
                          {renderCorperBadgeCell(sub.userName, sub.userHouseStatus, sub.userStateCode, sub.userTier)}
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full shrink-0">
                        PENDING
                      </span>
                    </div>

                    {/* Submission Details */}
                    <div className="p-3.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/5 space-y-1.5 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">Transaction ID:</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{sub.id}</span>
                      </div>
                      {sub.fileName && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-zinc-500 dark:text-zinc-400">Image / File ID:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[180px]" title={sub.fileName}>
                            {sub.fileName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">Target Month:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{sub.monthName} {sub.year}</span> {/* ({sub.monthCode}) e.g AUG */}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 dark:text-zinc-400">Subscription Type:</span>
                        <span className="font-bold text-zinc-800 dark:text-zinc-200 capitalize">{sub.subscriptionType} Assessment</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-900/10 dark:border-white/10 pt-1.5 text-sm">
                        <span className="text-zinc-600 dark:text-zinc-300 font-sans font-bold">Amount Paid:</span>
                        <span className="font-bold text-zinc-900 dark:text-white">₦{sub.amountPaid.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Receipt File Trigger */}
                    {sub.fileName && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewItem({
                            title: `Dues Clearance Proof - ${sub.userName}`,
                            fileName: sub.fileName,
                            fileDataUrl: sub.fileDataUrl,
                            fileType: sub.fileType,
                            details: `Month: ${sub.monthName} ${sub.year} | Amount: ₦${sub.amountPaid.toLocaleString()} | Txn: ${sub.id}`,
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/30 hover:bg-slate-900/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer min-h-[40px]"
                      >
                        <Eye className="w-4 h-4 text-emerald-500" />
                        <span>Inspect Receipt File ({sub.fileName})</span>
                      </button>
                    )}

                    {/* Action Control Buttons */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900/10 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => handleApproveDues(sub)}
                        className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer min-h-[40px]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenModifyDues(sub)}
                        className="py-2.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer min-h-[40px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modify</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRejectingItem({ id: sub.id, type: 'dues', name: sub.userName })}
                        className="py-2.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer min-h-[40px]"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical/Processed Dues Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Evaluated Dues History ({processedDues.length})
            </h3>
            <div className="bg-white/50 backdrop-blur-xl border border-white/80 dark:bg-zinc-950/60 dark:border-white/10 rounded-2xl p-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-900/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-bold">
                    <th className="py-2 px-3">Corper</th>
                    <th className="py-2 px-3">Month</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Receipt / Image ID</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Reviewed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
                  {processedDues.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-900/5 dark:hover:bg-white/5">
                      <td className="py-2.5 px-3">
                        {renderCorperBadgeCell(d.userName, d.userHouseStatus, d.userStateCode, d.userTier)}
                      </td>
                      <td className="py-2.5 px-3">{d.monthName} {d.year}</td>
                      <td className="py-2.5 px-3 capitalize">{d.subscriptionType}</td>
                      <td className="py-2.5 px-3 font-bold">₦{(d.approvedAmount || d.amountPaid).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px]">
                        {d.fileName ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewItem({
                                title: `Dues Clearance Proof - ${d.userName}`,
                                fileName: d.fileName,
                                fileDataUrl: d.fileDataUrl,
                                fileType: d.fileType,
                                details: `Month: ${d.monthName} ${d.year} | Amount: ₦${d.amountPaid.toLocaleString()} | Txn: ${d.id}`,
                              })
                            }
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{d.fileName}</span>
                          </button>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400 font-mono">ID: {d.id}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : d.status === 'modified_approved'
                              ? 'bg-sky-500/10 text-sky-600'
                              : 'bg-rose-500/10 text-rose-600'
                          }`}
                        >
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-zinc-500 font-sans">{d.reviewedBy || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TRAVEL PERMITS SUB-TAB */}
      {activeSubTab === 'travel' && (
        <div className="space-y-6">
          
          {/* Pending Travel Queue */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
              <span>Pending Travel Permits Queue ({pendingTravel.length})</span>
            </h3>

            {pendingTravel.length === 0 ? (
              <div className="bg-white/50 backdrop-blur-xl border border-white/80 dark:bg-zinc-950/60 dark:border-white/10 rounded-2xl p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
                No pending travel permit requests. All exeat records evaluated!
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingTravel.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white/60 backdrop-blur-xl border border-white/90 dark:bg-zinc-950/70 dark:border-white/15 shadow-md rounded-2xl p-5 space-y-4 transition-all hover:border-sky-500/40"
                  >
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={req.userAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150'}
                          alt={req.userName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-sky-500 shrink-0"
                        />
                        <div className="min-w-0">
                          {renderCorperBadgeCell(req.userName, req.userHouseStatus, req.userStateCode, req.userTier)}
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full shrink-0">
                        PENDING EXEAT
                      </span>
                    </div>

                    {/* Travel Details */}
                    <div className="p-3.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/5 space-y-2 text-xs">
                      <div className="font-bold text-zinc-900 dark:text-white text-sm">
                        {req.reason}
                      </div>
                      {req.detailedExplanation && (
                        <p className="text-zinc-600 dark:text-zinc-400 text-xs">
                          {req.detailedExplanation}
                        </p>
                      )}
                      {req.contactDuringAbsence && (
                        <div className="text-zinc-700 dark:text-zinc-300 font-medium bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                          <span className="font-bold text-zinc-900 dark:text-white">Contact During Absence:</span> {req.contactDuringAbsence}
                        </div>
                      )}
                      {req.letterFileName && (
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-zinc-500 dark:text-zinc-400">Doc / Image Ref ID:</span>
                          <span className="font-bold text-sky-600 dark:text-sky-400 truncate max-w-[180px]" title={req.letterFileName}>
                            {req.letterFileName}
                          </span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-slate-900/10 dark:border-white/10 font-mono font-bold text-sky-600 dark:text-sky-400 flex items-center justify-between">
                        <span>Requested Window:</span>
                        <span>{req.departureDate} – {req.returnDate}</span>
                      </div>
                    </div>

                    {/* Attached Letter File Trigger */}
                    {req.letterFileName && (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewItem({
                            title: `Signed Travel Letter - ${req.userName}`,
                            fileName: req.letterFileName,
                            fileDataUrl: req.letterFileDataUrl,
                            fileType: req.letterFileType,
                            details: `Reason: ${req.reason} | Dates: ${req.departureDate} – ${req.returnDate}`,
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/30 hover:bg-slate-900/10 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer min-h-[40px]"
                      >
                        <Eye className="w-4 h-4 text-sky-500" />
                        <span>Inspect Official Letter ({req.letterFileName})</span>
                      </button>
                    )}

                    {/* Controls */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-900/10 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => handleApproveTravel(req)}
                        className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer min-h-[40px]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenModifyTravel(req)}
                        className="py-2.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer min-h-[40px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modify Dates</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRejectingItem({ id: req.id, type: 'travel', name: req.userName })}
                        className="py-2.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-md transition-all cursor-pointer min-h-[40px]"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical Travel Permits */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Evaluated Travel History ({processedTravel.length})
            </h3>
            <div className="bg-white/50 backdrop-blur-xl border border-white/80 dark:bg-zinc-950/60 dark:border-white/10 rounded-2xl p-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-900/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-bold">
                    <th className="py-2 px-3">Corper</th>
                    <th className="py-2 px-3">Reason</th>
                    <th className="py-2 px-3">Approved Window</th>
                    <th className="py-2 px-3">Contact</th>
                    <th className="py-2 px-3">Doc / Image Ref</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Evaluator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
                  {processedTravel.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/5 dark:hover:bg-white/5">
                      <td className="py-2.5 px-3">
                        {renderCorperBadgeCell(t.userName, t.userHouseStatus, t.userStateCode, t.userTier)}
                      </td>
                      <td className="py-2.5 px-3 font-sans truncate max-w-[180px]">{t.reason}</td>
                      <td className="py-2.5 px-3 font-bold">{t.approvedDepartureDate || t.departureDate} – {t.approvedReturnDate || t.returnDate}</td>
                      <td className="py-2.5 px-3 font-mono text-zinc-800 dark:text-zinc-200">{t.contactDuringAbsence || 'N/A'}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px]">
                        {t.letterFileName ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewItem({
                                title: `Signed Travel Letter - ${t.userName}`,
                                fileName: t.letterFileName,
                                fileDataUrl: t.letterFileDataUrl,
                                fileType: t.letterFileType,
                                details: `Reason: ${t.reason} | Window: ${t.approvedDepartureDate || t.departureDate} – ${t.approvedReturnDate || t.returnDate}`,
                              })
                            }
                            className="text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{t.letterFileName}</span>
                          </button>
                        ) : (
                          <span className="text-zinc-500 dark:text-zinc-400 font-mono">ID: {t.id}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : t.status === 'modified_approved'
                              ? 'bg-sky-500/10 text-sky-600'
                              : 'bg-rose-500/10 text-rose-600'
                          }`}
                        >
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-zinc-500 font-sans">{t.reviewedBy || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* PROFILE MODIFICATION REQUESTS SUB-TAB */}
      {activeSubTab === 'profile' && (
        <div className="space-y-6">
          {/* Pending Profile Requests Queue */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Pending Profile Update Requests ({pendingProfile.length})</span>
            </h3>

            {pendingProfile.length === 0 ? (
              <div className="bg-white/50 backdrop-blur-xl border border-white/80 dark:bg-zinc-950/60 dark:border-white/10 rounded-2xl p-8 text-center text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
                No pending profile modification requests in the queue.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingProfile.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white/60 backdrop-blur-xl border border-white/90 dark:bg-zinc-950/70 dark:border-white/15 shadow-md rounded-2xl p-5 space-y-4 transition-all hover:border-amber-500/40"
                  >
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={req.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                          alt={req.userName}
                          className="w-11 h-11 rounded-full object-cover border-2 border-amber-500 shrink-0"
                        />
                        <div className="min-w-0">
                          {renderCorperBadgeCell(req.userName, req.userHouseStatus, req.userStateCode, req.userTier)}
                        </div>
                      </div>

                      <span className="px-2.5 py-0.5 text-[10px] font-bold font-mono uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-full shrink-0">
                        PENDING DELTA
                      </span>
                    </div>

                    {/* Delta Payload Glass Badge */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1.5 font-mono text-xs shadow-inner">
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400">
                        <span>Delta Tracking Payload:</span>
                        <span className="text-zinc-500 dark:text-zinc-400 font-mono">Ref ID: {req.id}</span>
                      </div>
                      <div className="font-bold text-sm leading-snug">
                        {req.deltaPayload}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/10 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => handleApproveProfile(req)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer min-h-[40px]"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Profile Delta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRejectingItem({ id: req.id, type: 'profile', name: req.userName })}
                        className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md transition-all cursor-pointer min-h-[40px]"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject Delta</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historical/Processed Profile Requests Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Evaluated Profile Delta History ({processedProfile.length})
            </h3>
            <div className="bg-white/50 backdrop-blur-xl border border-white/80 dark:bg-zinc-950/60 dark:border-white/10 rounded-2xl p-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-900/10 dark:border-white/10 text-zinc-600 dark:text-zinc-400 font-bold">
                    <th className="py-2 px-3">Corper</th>
                    <th className="py-2 px-3">State Code</th>
                    <th className="py-2 px-3">Delta String</th>
                    <th className="py-2 px-3">Request Ref ID</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Evaluator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
                  {processedProfile.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/5 dark:hover:bg-white/5">
                      <td className="py-2.5 px-3">
                        {renderCorperBadgeCell(p.userName, p.userHouseStatus, p.userStateCode, p.userTier)}
                      </td>
                      <td className="py-2.5 px-3 font-mono">{p.userStateCode}</td>
                      <td className="py-2.5 px-3 font-bold text-zinc-800 dark:text-zinc-200 max-w-[280px] truncate">{p.deltaPayload}</td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-amber-600 dark:text-amber-400 font-bold">{p.id}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-rose-500/10 text-rose-600'
                          }`}
                        >
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-zinc-500 font-sans">{p.reviewedBy || 'System'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Document / Receipt File Preview Modal with Zoom & Rotation Controls */}
      {previewItem && (
        <ZoomableImageViewer
          src={previewItem.fileDataUrl || ''}
          alt={previewItem.title}
          title={previewItem.title}
          details={previewItem.details}
          fileName={previewItem.fileName}
          fileType={previewItem.fileType}
          onClose={() => setPreviewItem(null)}
        />
      )}

      {/* MODAL 2: Modify & Approve Dues Modal */}
      {modifyDuesItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmModifyDues}
            className="bg-white dark:bg-zinc-900 border border-slate-900/20 dark:border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-sky-500" />
                <span>Modify & Approve Dues Assessment</span>
              </h3>
              <button type="button" onClick={() => setModifyDuesItem(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Adjust the verified payment amount for <span className="font-bold text-zinc-900 dark:text-white">{modifyDuesItem.userName}</span> ({modifyDuesItem.monthName} {modifyDuesItem.year}):
            </p>

            <div>
              <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                Approved Amount (₦)
              </label>
              <input
                type="number"
                value={overrideAmountText}
                onChange={(e) => setOverrideAmountText(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setModifyDuesItem(null)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Confirm Modified Approval
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: Modify & Approve Travel Dates Modal */}
      {modifyTravelItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmModifyTravel}
            className="bg-white dark:bg-zinc-900 border border-slate-900/20 dark:border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-sky-500" />
                <span>Modify & Approve Travel Exeat Window</span>
              </h3>
              <button type="button" onClick={() => setModifyTravelItem(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Adjust travel dates for <span className="font-bold text-zinc-900 dark:text-white">{modifyTravelItem.userName}</span>:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Approved Departure Date
                </label>
                <input
                  type="date"
                  value={overrideDeptDate}
                  onChange={(e) => setOverrideDeptDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white font-mono font-bold text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-1">
                  Approved Return Date
                </label>
                <input
                  type="date"
                  value={overrideRetDate}
                  onChange={(e) => setOverrideRetDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white font-mono font-bold text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setModifyTravelItem(null)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Confirm Modified Dates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 4: Reject Reason Prompt Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white dark:bg-zinc-900 border border-slate-900/20 dark:border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3">
              <h3 className="font-bold text-sm sm:text-base text-rose-600 dark:text-rose-400 flex items-center space-x-2">
                <XCircle className="w-5 h-5" />
                <span>Reject Submission</span>
              </h3>
              <button type="button" onClick={() => setRejectingItem(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Provide feedback for rejecting <span className="font-bold text-zinc-900 dark:text-white">{rejectingItem.name}</span>’s submission:
            </p>

            <textarea
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              rows={3}
              placeholder="e.g. Illegible transaction receipt image — please re-upload a clear transfer proof statement."
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900/5 dark:bg-black/50 border border-slate-900/10 dark:border-white/10 text-zinc-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="py-2 px-4 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
