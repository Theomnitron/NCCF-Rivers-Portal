import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { hasTripartiteAccess } from '../../types/corper';
import { MemberPortalCanvas } from '../views/MemberPortalCanvas';
import { AdminCommandCanvas } from '../views/AdminCommandCanvas';
import { TripartiteGovernanceCanvas } from '../views/TripartiteGovernanceCanvas';

interface ViewRouterProps {
  currentTab?: string;
  onNavigateTab?: (tab: string) => void;
}

/**
 * Strict Role-Based View Router
 * Inspects activeUser:
 * - 'admin': Renders AdminCommandCanvas (Infrastructure Console, system data steward, state code regex, database maintenance)
 * - 'tripartite' or privileges.tripartite_access: Renders TripartiteGovernanceCanvas (Executive Governance Tier, identity profile header, read-only global telemetry, policy approvals)
 * - 'member': Renders MemberPortalCanvas (Member personal views, dues, GENCO info, House info, requests)
 */
export const ViewRouter: React.FC<ViewRouterProps> = ({ currentTab = 'dashboard', onNavigateTab }) => {
  const { activeUser } = useAuth();

  if (activeUser.systemCategory === 'admin') {
    return <AdminCommandCanvas currentTab={currentTab} onNavigateTab={onNavigateTab} />;
  }

  if (hasTripartiteAccess(activeUser)) {
    return <TripartiteGovernanceCanvas currentTab={currentTab} onNavigateTab={onNavigateTab} />;
  }

  // Default to Member View for systemCategory === 'member' or any fallback
  return <MemberPortalCanvas currentTab={currentTab} />;
};
