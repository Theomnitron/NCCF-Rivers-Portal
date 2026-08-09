import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { evaluateTier } from '../utils/tierEvaluator';
import { isValidStateCode } from '../utils/sanitizers';
import { shouldDisplayUnit, formatServiceUnitText } from '../utils/unitHelpers';
import {
  Shield,
  Home,
  Briefcase,
  GraduationCap,
  Heart,
  CheckCircle2,
  AlertCircle,
  Coins,
  MapPin,
  Edit2,
  Save,
  X,
} from 'lucide-react';

export const CorperProfileCard: React.FC = () => {
  const { activeUser, updateUserProfile } = useAuth();
  const tierInfo = evaluateTier(activeUser);
  const isCodeValid = isValidStateCode(activeUser.stateCode);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: activeUser.firstName,
    lastName: activeUser.lastName,
    stateCode: activeUser.stateCode,
    houseStatus: activeUser.houseStatus,
    serviceUnit: activeUser.serviceUnit,
    roomName: activeUser.roomName,
    systemCategory: activeUser.systemCategory,
    presence: activeUser.presence,
    maritalStatus: activeUser.maritalStatus,
  });

  const handleEditClick = () => {
    setFormData({
      firstName: activeUser.firstName,
      lastName: activeUser.lastName,
      stateCode: activeUser.stateCode,
      houseStatus: activeUser.houseStatus,
      serviceUnit: activeUser.serviceUnit,
      roomName: activeUser.roomName,
      systemCategory: activeUser.systemCategory,
      presence: activeUser.presence,
      maritalStatus: activeUser.maritalStatus,
    });
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(activeUser.id, formData);
    setIsEditing(false);
  };

  const maintTarget = activeUser?.targets?.maintenance ?? 15000;
  const feedTarget = activeUser?.targets?.feeding ?? 10000;
  const totalTarget = maintTarget + feedTarget;

  return (
    <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl overflow-hidden transition-all duration-200">
      {/* Top Banner Accent */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: tierInfo.hexColor }}
      />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-900/10 dark:border-white/10">
          
          {/* Avatar & Key Names */}
          <div className="flex items-start space-x-4">
            <div className="relative flex-shrink-0">
              <img
                src={activeUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                alt={activeUser.displayName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-md"
                style={{ border: `3px solid ${tierInfo.hexColor}` }}
              />
              <span
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 shadow-md"
                style={{ backgroundColor: tierInfo.hexColor }}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight text-zinc-900 dark:text-white">
                  {activeUser.firstName} {activeUser.middleName ? `${activeUser.middleName} ` : ''}{activeUser.lastName}
                </h2>
                <span className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold bg-slate-900/5 dark:bg-black/40 px-2.5 py-0.5 rounded-full border border-slate-900/10 dark:border-white/10">
                  ({activeUser.displayName})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center space-x-1 font-mono font-semibold bg-slate-900/5 dark:bg-black/40 px-2 py-0.5 rounded text-zinc-800 dark:text-zinc-100 border border-slate-900/10 dark:border-white/10">
                  <span>{activeUser.stateCode}</span>
                  {isCodeValid ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-900 dark:text-white" title="Valid NYSC Rivers State Code" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-zinc-400" title="Invalid State Code Format" />
                  )}
                </div>

                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="flex items-center text-zinc-600 dark:text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                  {activeUser.stateOfOrigin} State
                </span>

                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900/5 dark:bg-black/40 text-zinc-900 dark:text-zinc-100 border border-slate-900/10 dark:border-white/10">
                  {activeUser.presence}
                </span>
              </div>
            </div>
          </div>

          {/* Tier & Edit Buttons */}
          <div className="flex flex-wrap sm:flex-col items-end justify-between gap-2">
            <div
              className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-black text-zinc-900 shadow-sm select-none"
              style={{ backgroundColor: tierInfo.hexColor }}
            >
              <Shield className="w-4 h-4 text-zinc-900" />
              <span>{tierInfo.badgeText}</span>
            </div>

            {!isEditing ? (
              <button
                onClick={handleEditClick}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white px-3.5 py-2 rounded-xl active:scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-sm cursor-pointer select-none"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Corper Info</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-slate-900/5 dark:bg-black/40 px-3.5 py-2 rounded-xl border border-slate-900/10 dark:border-white/10 active:scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer select-none"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Edit Form */}
        {isEditing ? (
          <form onSubmit={handleSave} className="mt-6 p-4 sm:p-5 bg-slate-900/5 dark:bg-black/40 rounded-2xl border border-slate-900/10 dark:border-white/10 shadow-inner space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
              Update Corper Profile Attributes & Role
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">State Code</label>
                <input
                  type="text"
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value.toUpperCase() })}
                  placeholder="RV/24A/0001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 font-mono text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">House Status</label>
                <select
                  value={formData.houseStatus}
                  onChange={(e) => setFormData({ ...formData, houseStatus: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 font-medium cursor-pointer"
                >
                  <option value="Member">Member</option>
                  <option value="Room Gov">Room Gov</option>
                  <option value="Executive">Executive</option>
                  <option value="Delegate">Delegate</option>
                  <option value="Gee">Gee</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Service Unit</label>
                <input
                  type="text"
                  value={formData.serviceUnit}
                  onChange={(e) => setFormData({ ...formData, serviceUnit: e.target.value })}
                  placeholder="Bible Study, Prayer, Welfare, Choir, etc."
                  className="w-full px-3 py-2 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">System Category</label>
                <select
                  value={formData.systemCategory}
                  onChange={(e) => setFormData({ ...formData, systemCategory: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-900/80 text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 font-medium cursor-pointer"
                >
                  <option value="member">member</option>
                  <option value="tripartite">tripartite</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs px-4 py-2.5 rounded-xl font-bold active:scale-[0.98] transition-all duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer select-none"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes & Recalculate Tiers</span>
              </button>
            </div>
          </form>
        ) : null}

        {/* Detailed Attribute Grid: GENCO Info & House Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          {/* GENCO Info */}
          <div className="p-5 rounded-2xl bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 shadow-inner">
            <div className="flex items-center space-x-2 text-zinc-900 dark:text-white pb-3 border-b border-slate-900/10 dark:border-white/10 font-bold text-sm">
              <GraduationCap className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              <span>GENCO Info</span>
            </div>
            
            <div className="mt-3 space-y-2.5 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">State of Origin:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeUser.stateOfOrigin} State</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">Course Studied:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-left sm:text-right">{activeUser.courseOfStudy}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">School Attended:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-left sm:text-right">{activeUser.schoolGraduatedFrom}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">Marital Status:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeUser.maritalStatus}</span>
              </div>
            </div>
          </div>

          {/* House Info */}
          <div className="p-5 rounded-2xl bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 shadow-inner">
            <div className="flex items-center space-x-2 text-zinc-900 dark:text-white pb-3 border-b border-slate-900/10 dark:border-white/10 font-bold text-sm">
              <Home className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
              <span>House Info</span>
            </div>

            <div className="mt-3 space-y-2.5 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">House Status:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeUser.houseStatus}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">Room:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{activeUser.roomName}</span>
              </div>
              {activeUser.houseStatus === 'Executive' && activeUser.systemCategory === 'member' ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-zinc-600 dark:text-zinc-400">Service Unit:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 backdrop-blur-sm uppercase">
                    EXECUTIVE
                  </span>
                </div>
              ) : shouldDisplayUnit(activeUser) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-zinc-600 dark:text-zinc-400">Service Unit:</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatServiceUnitText(activeUser)}</span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-zinc-600 dark:text-zinc-400">Presence Status:</span>
                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900/5 dark:bg-black/40 text-zinc-900 dark:text-zinc-100 border border-slate-900/10 dark:border-white/10 w-fit">
                  {activeUser.presence}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Target Fee Assessment Block */}
        <div className="mt-6 p-4 sm:p-5 rounded-2xl bg-zinc-900 text-white shadow-md border border-zinc-900 dark:border-zinc-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 font-bold text-sm">
                <Coins className="w-4 h-4 text-white" />
                <span>Target Dues & Fee Assessment</span>
              </div>
              <p className="text-xs text-zinc-300 mt-0.5">
                {activeUser.systemCategory === 'tripartite'
                  ? 'Tripartite Executive Status: Fully Exempt from Maintenance & Feeding Dues (₦0 / ₦0)'
                  : activeUser.houseStatus === 'Executive' || activeUser.houseStatus === 'Room Gov'
                  ? 'Exco/Governor Subsidy Applied: Maintenance ₦15,000 + Subsidized Feeding ₦5,000'
                  : activeUser.serviceUnit.toLowerCase().includes('welfare') || activeUser.serviceUnit.toLowerCase().includes('kitchen')
                  ? 'Welfare Staff Subsidy Applied: Maintenance ₦15,000 + Subsidized Feeding ₦5,000'
                  : 'Standard Corper Rate: Maintenance ₦15,000 + Feeding ₦10,000'}
              </p>
            </div>

            <div className="flex items-center space-x-6 text-right">
              <div>
                <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">
                  Maintenance
                </span>
                <span className="text-base font-bold text-white font-mono">
                  ₦{maintTarget.toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">
                  Feeding Dues
                </span>
                <span className="text-base font-bold text-white font-mono">
                  ₦{feedTarget.toLocaleString()}
                </span>
              </div>

              <div className="pl-4 border-l border-zinc-700">
                <span className="text-[10px] text-zinc-300 block uppercase tracking-wider font-bold">
                  Total Target
                </span>
                <span className="text-lg font-extrabold text-white font-mono">
                  ₦{totalTarget.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
