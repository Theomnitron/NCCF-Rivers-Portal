import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { evaluateTier, TIER_DEFINITIONS } from '../../utils/tierEvaluator';
import { isValidStateCode } from '../../utils/sanitizers';
import { getStoredUserLedger } from '../../data/initialLedger';
import { CorperProfile } from '../../types/corper';
import { MemberPortalCanvas } from './MemberPortalCanvas';
import { ApprovalsView } from '../approvals/ApprovalsView';
import { AnnouncementsTab } from '../announcements/AnnouncementsTab';
import { HrDashboardOverview } from '../dashboard/HrDashboardOverview';
import { CsvOnboardingZone } from '../admin/CsvOnboardingZone';
import { SaturdayCronCelebrationsWidget } from '../admin/SaturdayCronCelebrationsWidget';
import { UserEditModal } from '../admin/UserEditModal';
import { IntentAllocationDrawer } from '../admin/IntentAllocationDrawer';
import { OverrideGuardrailModal } from '../admin/OverrideGuardrailModal';
import { CorperFullProfileModal } from '../admin/CorperFullProfileModal';
import { AddSingleCorperModal } from '../admin/AddSingleCorperModal';
import { CorperRosterTable } from '../admin/CorperRosterTable';
import { RevealOnScroll } from '../common/RevealOnScroll';
import {
  Users,
  Shield,
  Coins,
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Edit3,
  Layers,
  ShieldAlert,
  ChevronRight,
  Eye,
  Sliders,
} from 'lucide-react';

export const AdminCommandCanvas: React.FC<{ currentTab?: string; onNavigateTab?: (tab: string) => void }> = ({
  currentTab = 'dashboard',
  onNavigateTab,
}) => {
  const { allUsers, activeUser, deleteCorperUser } = useAuth();

  // Modals state
  const [editingUser, setEditingUser] = useState<CorperProfile | null>(null);
  const [allocationUser, setAllocationUser] = useState<CorperProfile | null>(null);
  const [overrideUser, setOverrideUser] = useState<CorperProfile | null>(null);
  const [overrideMode, setOverrideMode] = useState<'force_clear' | 'reset'>('force_clear');
  const [viewingProfileUser, setViewingProfileUser] = useState<CorperProfile | null>(null);
  const [isAddingSingleUser, setIsAddingSingleUser] = useState(false);

  if (currentTab === 'approvals') {
    return <ApprovalsView />;
  }

  if (currentTab === 'announcements') {
    return <AnnouncementsTab />;
  }

  if (currentTab === 'requests' || currentTab === 'settings') {
    return <MemberPortalCanvas currentTab={currentTab} />;
  }

  // Aggregates
  const totalCorpers = allUsers.length;
  const countByTier = (tierNum: number) => allUsers.filter((u) => u.tier === tierNum).length;

  return (
    <div className="space-y-6">
      {/* Executive Command Banner */}
      <RevealOnScroll>
        <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-5 sm:p-6 transition-all duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center font-bold text-white dark:text-zinc-900 text-lg shadow-md flex-shrink-0">
                <Shield className="w-6 h-6 text-white dark:text-zinc-900" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-base sm:text-lg md:text-xl font-bold leading-tight text-zinc-900 dark:text-white">
                    Master Admin Operations Console
                  </h1>
                  {/* <span className="text-[11px] font-mono bg-slate-900/5 dark:bg-black/50 px-2.5 py-0.5 rounded-full text-zinc-900 dark:text-zinc-100 font-bold border border-slate-900/10 dark:border-white/10">
                    FULL CRUD WORKSPACE
                  </span> */}
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">
                  System operator console • Full CRUD & data management
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md font-mono select-none">
                Operator: {activeUser.displayName} (Exempt)
              </span>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {/* HR Operational Overview Dashboard */}
      <HrDashboardOverview onNavigateTab={onNavigateTab} />

      {/* Saturday Cron & Celebrations Widget */}
      <RevealOnScroll delay={0.15}>
        <SaturdayCronCelebrationsWidget />
      </RevealOnScroll>

      {/* Raw CSV Drag-and-Drop Onboarding Dropzone */}
      <RevealOnScroll delay={0.2}>
        <CsvOnboardingZone onOpenAddSingleModal={() => setIsAddingSingleUser(true)} />
      </RevealOnScroll>

      {/* Executive Ledger Grid Section with High-Density Paginated Table */}
      <RevealOnScroll delay={0.25}>
        <div className="bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-md rounded-2xl p-5 sm:p-6 space-y-4 transition-all duration-200">
          <CorperRosterTable
            users={allUsers}
            readOnly={false}
            onViewProfile={(user) => setViewingProfileUser(user)}
            onEditUser={(user) => setEditingUser(user)}
            onForceClearUser={(user) => {
              setOverrideUser(user);
              setOverrideMode('force_clear');
            }}
            onResetUser={(user) => {
              setOverrideUser(user);
              setOverrideMode('reset');
            }}
          />
        </div>
      </RevealOnScroll>

      {/* Add Single Corper Form Modal */}
      {isAddingSingleUser && (
        <AddSingleCorperModal onClose={() => setIsAddingSingleUser(false)} />
      )}

      {/* Full Profile Modal */}
      {viewingProfileUser && (
        <CorperFullProfileModal
          user={viewingProfileUser}
          readOnly={false}
          onClose={() => setViewingProfileUser(null)}
          onEditUser={(user) => setEditingUser(user)}
          onForceClearUser={(user) => {
            setOverrideUser(user);
            setOverrideMode('force_clear');
          }}
          onResetUser={(user) => {
            setOverrideUser(user);
            setOverrideMode('reset');
          }}
          onDeleteUser={(user) => deleteCorperUser(user.id)}
        />
      )}

      {/* User Edit Modal */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}

      {/* Intent-Based Allocation Drawer */}
      {allocationUser && (
        <IntentAllocationDrawer
          user={allocationUser}
          onClose={() => setAllocationUser(null)}
        />
      )}

      {/* Override & Guardrail Modal */}
      {overrideUser && (
        <OverrideGuardrailModal
          user={overrideUser}
          mode={overrideMode}
          onClose={() => setOverrideUser(null)}
        />
      )}
    </div>
  );
};
