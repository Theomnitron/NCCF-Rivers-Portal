import React, { useState, useMemo } from 'react';
import { CorperProfile, HouseStatus, PresenceStatus, hasTripartiteAccess, ALL_SERVICE_UNITS } from '../../types/corper';
import { evaluateTier, getShortRoleTitle } from '../../utils/tierEvaluator';
import { getStoredUserLedger } from '../../data/initialLedger';
import { calculateWaterfallDues, getCurrentActiveLedgerMonth } from '../../utils/duesCalculator';
import { useRequests } from '../../context/RequestsContext';
import {
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  SlidersHorizontal,
  X,
  RotateCcw,
  Check,
} from 'lucide-react';

interface CorperRosterTableProps {
  users: CorperProfile[];
  readOnly?: boolean;
  onViewProfile: (user: CorperProfile) => void;
  onEditUser?: (user: CorperProfile) => void;
  onForceClearUser?: (user: CorperProfile) => void;
  onResetUser?: (user: CorperProfile) => void;
}

export const CorperRosterTable: React.FC<CorperRosterTableProps> = ({
  users,
  readOnly = false,
  onViewProfile,
}) => {
  const { duesSubmissions } = useRequests();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoleStatus, setFilterRoleStatus] = useState<string>('all');
  const [filterPresence, setFilterPresence] = useState<string>('all');
  const [filterSub, setFilterSub] = useState<string>('all');
  const [filterRoom, setFilterRoom] = useState<string>('all');
  const [filterUnit, setFilterUnit] = useState<string>('all');

  // Mobile Filter Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Pagination State
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterRoleStatus !== 'all') count++;
    if (filterPresence !== 'all') count++;
    if (filterSub !== 'all') count++;
    if (filterRoom !== 'all') count++;
    if (filterUnit !== 'all') count++;
    return count;
  }, [filterRoleStatus, filterPresence, filterSub, filterRoom, filterUnit]);

  const resetAllFilters = () => {
    setFilterRoleStatus('all');
    setFilterPresence('all');
    setFilterSub('all');
    setFilterRoom('all');
    setFilterUnit('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Extract distinct Room & Unit options
  // Extract distinct Room & Unit options
  const availableRooms = useMemo(() => {
    const set = new Set(users.map((u) => u.roomName).filter(Boolean));
    return Array.from(set).sort();
  }, [users]);

  const DEFAULT_SERVICE_UNITS = useMemo(() => ALL_SERVICE_UNITS, []);

  const availableUnits = useMemo(() => {
    const set = new Set<string>(DEFAULT_SERVICE_UNITS);
    users.forEach((u) => {
      if (Array.isArray(u.serviceUnits)) {
        u.serviceUnits.forEach((su) => su && set.add(su.trim()));
      }
      if (u.serviceUnit) {
        u.serviceUnit.split(',').forEach((su) => su && set.add(su.trim()));
      }
    });
    return Array.from(set).filter(Boolean).sort();
  }, [users, DEFAULT_SERVICE_UNITS]);

  // Helper for Monthly Sub Status
  const getSubStatus = (user: CorperProfile): 'Fully Paid' | 'Partially Paid' | 'Maint ONLY' | 'Unpaid' | 'Exempt' => {
    if (user.isExempted || user.systemCategory === 'admin' || user.systemCategory === 'tripartite' || user.houseStatus === 'Admin' || user.houseStatus === 'Tripartite' || user.houseStatus === 'Delegate') {
      return 'Exempt';
    }
    const userEntries = getStoredUserLedger(user, duesSubmissions);
    const { monthCode, monthName, year } = getCurrentActiveLedgerMonth();
    const currentEntry = userEntries.find(
      (e) => e.year === year && (e.monthKey === monthCode || e.monthName === monthName)
    );
    if (!currentEntry) return 'Unpaid';
    const totalPaid = currentEntry.maintenancePaid + currentEntry.feedingPaid;

    const waterfall = calculateWaterfallDues(totalPaid, user);
    if (waterfall.isTripartiteExempt && waterfall.feedTarget === 0 && waterfall.maintTarget === 0) return 'Exempt';
    if (waterfall.paymentStatus === 'Fully Paid') return 'Fully Paid';
    if (waterfall.paymentStatus === 'Maint ONLY') return 'Maint ONLY';
    if (waterfall.paymentStatus === 'Partially Paid') return 'Partially Paid';
    return 'Unpaid';
  };

  // Helper for rendering Monthly Sub Badge
  const renderSubBadge = (user: CorperProfile) => {
    const status = getSubStatus(user);
    let badgeStyle = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
    if (status === 'Exempt') {
      badgeStyle = 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30';
    } else if (status === 'Fully Paid') {
      badgeStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    } else if (status === 'Maint ONLY') {
      badgeStyle = 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30';
    } else if (status === 'Partially Paid') {
      badgeStyle = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    }
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border shadow-2xs whitespace-nowrap ${badgeStyle}`}>
        {status}
      </span>
    );
  };

  // Multi-Field Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search: Name or State Code or Room or Unit
      const searchLower = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !searchLower ||
        (user.displayName && user.displayName.toLowerCase().includes(searchLower)) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchLower)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchLower)) ||
        (user.stateCode && user.stateCode.toLowerCase().includes(searchLower)) ||
        (user.roomName && user.roomName.toLowerCase().includes(searchLower)) ||
        (user.serviceUnit && user.serviceUnit.toLowerCase().includes(searchLower)) ||
        (Array.isArray(user.serviceUnits) && user.serviceUnits.some((su) => su.toLowerCase().includes(searchLower)));

      // Filter 1: Role Tier / House Status / System Category
      let matchesRoleStatus = filterRoleStatus === 'all';
      if (!matchesRoleStatus) {
        const target = filterRoleStatus.toLowerCase();
        if (target === 'executive') {
          matchesRoleStatus = user.houseStatus === 'Executive' || Boolean(user.executivePost);
        } else if (target === 'tripartite') {
          matchesRoleStatus =
            user.systemCategory === 'tripartite' ||
            user.houseStatus === 'Tripartite' // ||
            // hasTripartiteAccess(user);
        } else if (target === 'room gov' || target === 'governor') {
          matchesRoleStatus = user.houseStatus === 'Room Gov' || user.houseStatus === 'Governor';
        } else if (target === 'gee') {
          matchesRoleStatus = user.houseStatus === 'Gee';
        } else if (target === 'delegate') {
          matchesRoleStatus = user.houseStatus === 'Delegate';
        } else if (target === 'member') {
          matchesRoleStatus = user.houseStatus === 'Member';
        } else {
          matchesRoleStatus = user.houseStatus?.toLowerCase() === target;
        }
      }

      // Filter 2: Presence
      const matchesPresence =
        filterPresence === 'all' || user.presence === filterPresence;

      // Filter 3: Monthly Sub
      const matchesSub =
        filterSub === 'all' || getSubStatus(user) === filterSub;

      // Filter 4: Room
      const matchesRoom =
        filterRoom === 'all' || user.roomName === filterRoom;

      // Filter 5: Service Unit
      let matchesUnit = filterUnit === 'all';
      if (!matchesUnit) {
        const targetUnit = filterUnit.toLowerCase();
        const hasInUnitsArray =
          Array.isArray(user.serviceUnits) &&
          user.serviceUnits.some((su) => su.trim().toLowerCase() === targetUnit);
        const hasInUnitString =
          Boolean(user.serviceUnit && user.serviceUnit.toLowerCase().includes(targetUnit));
        matchesUnit = hasInUnitsArray || hasInUnitString;
      }

      return (
        matchesSearch &&
        matchesRoleStatus &&
        matchesPresence &&
        matchesSub &&
        matchesRoom &&
        matchesUnit
      );
    });
  }, [users, searchTerm, filterRoleStatus, filterPresence, filterSub, filterRoom, filterUnit]);

  // Handle Page Size Change
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const totalFiltered = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);

  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="space-y-4">
      
      {/* HEADER & MULTI-FIELD FILTER STRIP */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-bold leading-tight text-zinc-900 dark:text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-zinc-900 dark:text-white flex-shrink-0" />
            <span>State Corper Roster Directory</span>
            {readOnly} {/* && (
             <span className="text-[10px] font-mono bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                Read-Only
              </span>
            )*/}
          </h3>

          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
            Total Active Records: <span className="font-bold text-zinc-900 dark:text-white">{filteredUsers.length}</span>
          </div>
        </div>

        {/* SEARCH & MULTI-FIELD FILTER CONTROL BAR */}
        
        {/* Mobile View Search & Filter Drawer Trigger (< md) */}
        <div className="flex flex-col gap-2.5 md:hidden">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name, state code, or unit..."
              className="w-full py-2.5 pl-10 pr-4 min-h-[44px] rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex-1 py-2.5 px-4 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs flex items-center justify-center space-x-2 shadow-sm active:scale-[0.98] transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter Roster</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500 text-zinc-950 shadow-2xs">
                  Filters ({activeFilterCount})
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="py-2.5 px-3 min-h-[44px] rounded-xl bg-slate-900/10 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center space-x-1 active:scale-[0.98] transition-all cursor-pointer"
                title="Reset All Filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop Multi-field Filter Control Bar (md+) */}
        <div className="hidden md:grid grid-cols-6 lg:grid-cols-6 gap-2">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search name or code..."
              className="w-full py-2 pl-9 pr-3 min-h-[40px] rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 font-medium"
            />
          </div>

          {/* Filter 1: Role Tier / House Status */}
          <select
            value={filterRoleStatus}
            onChange={(e) => {
              setFilterRoleStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 min-h-[40px] rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white font-medium cursor-pointer"
          >
            <option value="all">Role Tier: All</option>
            <option value="Executive">Executives</option>
            <option value="tripartite">Tripartite</option>
            <option value="Gee">Gees</option>
            <option value="Room Gov">Room Govs</option>
            <option value="Delegate">Delegates</option>
            <option value="Member">Members</option>
          </select>

          {/* Filter 2: Presence Status */}
          <select
            value={filterPresence}
            onChange={(e) => {
              setFilterPresence(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 min-h-[40px] rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white font-medium cursor-pointer"
          >
            <option value="all">Presence: All</option>
            <option value="Present">Present</option>
            <option value="Travelled">Travelled</option>
            <option value="Moved On">Moved On</option>
          </select>

          {/* Filter 3: Monthly Sub Standing */}
          <select
            value={filterSub}
            onChange={(e) => {
              setFilterSub(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 min-h-[40px] rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white font-medium cursor-pointer"
          >
            <option value="all">Monthly Sub: All</option>
            <option value="Fully Paid">Fully Paid</option>
            <option value="Partially Paid">Partially Paid</option>
            <option value="Maint ONLY">Maint ONLY</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Exempt">Exempt</option>
          </select>

          {/* Filter 4: Room Dropdown */}
          <select
            value={filterRoom}
            onChange={(e) => {
              setFilterRoom(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 min-h-[40px] rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white font-medium cursor-pointer"
          >
            <option value="all">Room: All</option>
            {availableRooms.map((rm) => (
              <option key={rm} value={rm}>
                {rm}
              </option>
            ))}
          </select>

          {/* Filter 5: Service Unit Dropdown */}
          <select
            value={filterUnit}
            onChange={(e) => {
              setFilterUnit(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full py-2 px-3 min-h-[40px] rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white font-medium cursor-pointer"
          >
            <option value="all">Unit: All</option>
            {availableUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

        </div>
      </div>

      {/* MOBILE SLIDE-OVER FILTER SHEET / DRAWER */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />

          {/* Sheet Panel */}
          <div className="relative z-10 w-full max-w-xs bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col justify-between p-5 space-y-4 overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-900/10 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-5 h-5 text-zinc-900 dark:text-white" />
                  <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                    Filter Roster Directory
                  </h4>
                </div>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 active:scale-90 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Form Controls */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    House Status
                  </label>
                  <select
                    value={filterRoleStatus}
                    onChange={(e) => {
                      setFilterRoleStatus(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white font-medium"
                  >
                    <option value="all">All Role Tiers</option>
                    <option value="Executive">Executives</option>
                    <option value="tripartite">Tripartite</option>
                    <option value="Gee">Gees</option>
                    <option value="Room Gov">Room Govs</option>
                    <option value="Delegate">Delegates</option>
                    <option value="Member">Members</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Presence Status
                  </label>
                  <select
                    value={filterPresence}
                    onChange={(e) => {
                      setFilterPresence(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white font-medium"
                  >
                    <option value="all">All Presence Statuses</option>
                    <option value="Present">Present</option>
                    <option value="Travelled">Travelled</option>
                    <option value="Moved On">Moved On</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Monthly Sub Standing
                  </label>
                  <select
                    value={filterSub}
                    onChange={(e) => {
                      setFilterSub(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white font-medium"
                  >
                    <option value="all">All Sub Standing</option>
                    <option value="Fully Paid">Fully Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Maint ONLY">Maint ONLY</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Exempt">Exempt</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Room Allocation
                  </label>
                  <select
                    value={filterRoom}
                    onChange={(e) => {
                      setFilterRoom(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white font-medium"
                  >
                    <option value="all">All Rooms</option>
                    {availableRooms.map((rm) => (
                      <option key={rm} value={rm}>
                        {rm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Service Units
                  </label>
                  <select
                    value={filterUnit}
                    onChange={(e) => {
                      setFilterUnit(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/40 text-xs text-zinc-900 dark:text-white font-medium"
                  >
                    <option value="all">All Service Units</option>
                    {availableUnits.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-slate-900/10 dark:border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <Check className="w-4 h-4" />
                <span>Apply Filters ({filteredUsers.length} Records)</span>
              </button>

              <button
                type="button"
                onClick={resetAllFilters}
                className="w-full py-2.5 min-h-[44px] rounded-xl bg-slate-900/10 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 font-bold text-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STREAMLINED DESKTOP TABLE (STRICT 8 COLUMNS) */}
      <div className="hidden md:block w-full overflow-x-auto scrollbar-none rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/40 dark:bg-zinc-950/40 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-900/5 dark:bg-black/60 text-zinc-900 dark:text-zinc-100 font-bold border-b border-slate-900/10 dark:border-white/10">
              <th className="py-3.5 px-4 w-16 text-center">Avatar</th>
              <th className="py-3.5 px-4">Name</th>
              <th className="py-3.5 px-4">House Status</th>
              <th className="py-3.5 px-4">Room</th>
              <th className="py-3.5 px-4">Unit(s)</th>
              <th className="py-3.5 px-4">Presence</th>
              <th className="py-3.5 px-4">Monthly Sub</th>
              <th className="py-3.5 px-4 text-center w-16">More</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/10 dark:divide-white/10">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-zinc-500 font-mono">
                  No Corper records matched filter criteria.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const tierInfo = evaluateTier(user);

                return (
                  <tr key={user.id} className="hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors">
                    
                    {/* 1. Avatar (w-10 h-10 aspect-square object-cover) */}
                    <td className="py-3 px-4 text-center">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover aspect-square inline-block shadow-sm"
                        style={{ border: `2px solid ${tierInfo.hexColor}` }}
                      />
                    </td>

                    {/* 2. Name (Truncated) */}
                    <td className="py-3 px-4 font-bold text-zinc-900 dark:text-white">
                      <div className="truncate max-w-[150px]" title={`${user.firstName} ${user.lastName}`}>
                        {user.displayName}
                      </div>
                    </td>

                    {/* 3. Role Tier Badge */}
                    <td className="py-3 px-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold text-zinc-950 shadow-2xs inline-block whitespace-nowrap"
                        style={{ backgroundColor: tierInfo.hexColor }}
                        title={user.executivePost || tierInfo.categoryName}
                      >
                        {getShortRoleTitle(user, tierInfo)}
                      </span>
                    </td>

                    {/* 4. Room Badge */}
                    <td className="py-3 px-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      <span className="px-2.5 py-1 rounded-xl text-xs bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 inline-block whitespace-nowrap">
                        {user.roomName}
                      </span>
                    </td>

                    {/* 5. Unit Pill */}
                    <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300">
                      <span className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-900/5 dark:bg-white/5 inline-block max-w-[130px] truncate" title={user.serviceUnit}>
                        {user.serviceUnit}
                      </span>
                    </td>

                    {/* 6. Presence Status Pill */}
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                          user.presence === 'Present'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                            : user.presence === 'Travelled'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                        }`}
                      >
                        {user.presence}
                      </span>
                    </td>

                    {/* 7. Monthly Sub Standing */}
                    <td className="py-3 px-4">
                      {renderSubBadge(user)}
                    </td>

                    {/* 8. More (Eye Icon Button ONLY) */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onViewProfile(user)}
                        className="p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20 active:scale-95 transition-all cursor-pointer"
                        title="View Full Profile Details"
                        aria-label="View Full Profile Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW (< 768px Viewports) */}
      <div className="md:hidden space-y-3">
        {paginatedUsers.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 font-mono text-xs bg-slate-900/5 dark:bg-black/40 rounded-xl">
            No Corpers matched filter criteria.
          </div>
        ) : (
          paginatedUsers.map((user) => {
            const tierInfo = evaluateTier(user);

            return (
              <div
                key={user.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-900/10 dark:border-white/10 bg-white/70 dark:bg-zinc-950/70 shadow-md space-y-3"
              >
                {/* TOP BAR */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-sm"
                      style={{ border: `2px solid ${tierInfo.hexColor}` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                        {user.displayName}
                      </div>
                      <div className="font-mono text-[11px] font-bold text-zinc-500 truncate">
                        {user.stateCode} {user.schoolGraduatedFrom ? `• ${user.schoolGraduatedFrom}` : ''}
                      </div>
                    </div>
                  </div>

                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-zinc-950 shadow-2xs flex-shrink-0"
                    style={{ backgroundColor: tierInfo.hexColor }}
                    title={user.executivePost || tierInfo.categoryName}
                  >
                    {getShortRoleTitle(user, tierInfo)}
                  </span>
                </div>

                {/* DETAILS & STATUSES */}
                <div className="text-xs space-y-2 text-zinc-700 dark:text-zinc-300 pt-2 border-t border-slate-900/5 dark:border-white/5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-zinc-600 dark:text-zinc-400 truncate">
                      {user.roomName || 'Unassigned'} • {user.serviceUnit || 'No Unit'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border flex-shrink-0 ${
                        user.presence === 'Present'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                          : user.presence === 'Travelled'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                      }`}
                    >
                      {user.presence}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-500 text-[11px] font-mono truncate">
                      {user.email || 'No Email'}
                    </span>
                    <div className="flex-shrink-0">
                      {renderSubBadge(user)}
                    </div>
                  </div>
                </div>

                {/* VIEW DETAILS ACTION BUTTON */}
                <div className="pt-2 border-t border-slate-900/10 dark:border-white/10">
                  <button
                    onClick={() => onViewProfile(user)}
                    className="w-full py-2.5 px-3 min-h-[44px] rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center space-x-2 hover:bg-sky-500/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Profile Details</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* SINGLE BOTTOM PAGINATION CONTROL */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/5 dark:bg-black/40 border border-slate-900/10 dark:border-white/10 p-3 sm:p-3.5 rounded-xl mt-4">
        {/* Row Count Selector */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto space-x-2 text-xs">
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">Show rows:</span>
          
          {/* Mobile Select vs Desktop Buttons */}
          <div className="sm:hidden">
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="py-1 px-2.5 rounded-lg border border-slate-900/10 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-zinc-900 dark:text-white"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} rows
                </option>
              ))}
            </select>
          </div>

          <div className="hidden sm:flex items-center space-x-1">
            {[10, 25, 50, 100].map((size) => (
              <button
                key={size}
                onClick={() => handlePageSizeChange(size)}
                className={`min-h-[36px] min-w-[36px] px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all cursor-pointer active:scale-95 ${
                  pageSize === size
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md'
                    : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Range Display & Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-3 text-xs">
          <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300 text-[11px] sm:text-xs text-center">
            Showing {totalFiltered === 0 ? 0 : startIndex + 1}–{endIndex} of {totalFiltered} Corpers
          </span>

          <div className="flex items-center justify-center space-x-1 w-full sm:w-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className={`min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] px-3 py-2 rounded-xl flex items-center justify-center font-bold transition-all ${
                safePage <= 1
                  ? 'opacity-40 cursor-not-allowed text-zinc-400 bg-slate-200 dark:bg-zinc-800'
                  : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98] cursor-pointer shadow-sm'
              }`}
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200 px-2 text-[11px] sm:text-xs">
              Page {safePage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className={`min-h-[40px] sm:min-h-[44px] min-w-[40px] sm:min-w-[44px] px-3 py-2 rounded-xl flex items-center justify-center font-bold transition-all ${
                safePage >= totalPages
                  ? 'opacity-40 cursor-not-allowed text-zinc-400 bg-slate-200 dark:bg-zinc-800'
                  : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white active:scale-[0.98] cursor-pointer shadow-sm'
              }`}
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
