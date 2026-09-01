import { CorperProfile } from '../types/corper';

export interface TierInfo {
  tier: number;
  label: string;
  categoryName: string;
  hexColor: string;
  badgeBg: string;
  badgeText: string;
  codedPost: string;
  borderColor: string;
  description: string;
}

export const TIER_DEFINITIONS: Record<number, TierInfo> = {
  1: {
    tier: 1,
    label: 'Tier 1',
    categoryName: 'System Administrator',
    hexColor: '#C0C0C0',
    badgeBg: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
    badgeText: 'Admin',
    codedPost: 'Admin',
    borderColor: 'border-slate-300',
    description: 'Full portal system administration & override authority',
  },
  2: {
    tier: 2,
    label: 'Tier 2',
    categoryName: 'Gee',
    hexColor: '#00F5D4',
    badgeBg: 'bg-emerald-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
    badgeText: 'Gee',
    codedPost: 'Gee',
    borderColor: 'border-teal-400',
    description: 'Honorary Senior Corper & Alumni Mentor status',
  },
  3: {
    tier: 3,
    label: 'Tier 3',
    categoryName: 'Tripartite',
    hexColor: '#FFD700',
    badgeBg: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300',
    badgeText: 'Tripartite',
    codedPost: 'Tripartite',
    borderColor: 'border-amber-400',
    description: 'State Executive / Tripartite Leadership (Exempt from Dues)',
  },
  4: {
    tier: 4,
    label: 'Tier 4',
    categoryName: 'Executive',
    hexColor: '#9D4EDD',
    badgeBg: 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300',
    badgeText: 'Executive',
    codedPost: 'Executive',
    borderColor: 'border-purple-400',
    description: 'House / Unit Executive Council Officer',
  },
  5: {
    tier: 5,
    label: 'Tier 5',
    categoryName: 'Delegate',
    hexColor: '#0077B6',
    badgeBg: 'bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300',
    badgeText: 'Delegate',
    codedPost: 'Delegate',
    borderColor: 'border-sky-400',
    description: 'Zonal & House Representative Delegate',
  },
  6: {
    tier: 6,
    label: 'Tier 6',
    categoryName: 'Room Gov',
    hexColor: '#50C878',
    badgeBg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    badgeText: 'Room Gov',
    codedPost: 'Room Gov',
    borderColor: 'border-emerald-400',
    description: 'Room Governor & Sanitation Leads',
  },
  7: {
    tier: 7,
    label: 'Tier 7',
    categoryName: 'Member',
    hexColor: '#708090',
    badgeBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    badgeText: 'Member',
    codedPost: 'Member',
    borderColor: 'border-slate-400',
    description: 'Registered House Resident & Active Member',
  },
};

/**
 * Extracts or derives concise short role title for badges and mobile card display.
 * If executivePost contains parentheses e.g. "Assistant Welfare/Brothers' Coordiantor (AC Papa)", extracts "AC PAPA".
 */
export function getShortRoleTitle(profile: Partial<CorperProfile>, tierInfo?: TierInfo): string {
  const info = tierInfo || evaluateTier(profile);
  return info.badgeText || info.codedPost || 'MEMBER';
}

/**
 * Extracts or derives the specific coded post title from executivePost or role attributes
 */
export function getCodedPostTitle(profile: Partial<CorperProfile>): string {
  if (profile.systemCategory === 'admin') return 'ADMIN';

  // Helper to extract or derive concise slogan from executivePost string
  const resolveSlogan = (rawEp: string): string => {
    // Rule 1: Always extract bracketed title if present, e.g. "Drama Director (DD)" -> "DD"
    const bracketMatch = rawEp.match(/\(([^)]+)\)/);
    if (bracketMatch && bracketMatch[1] && bracketMatch[1].trim()) {
      return bracketMatch[1].trim().toUpperCase();
    }

    const ep = rawEp.toUpperCase();

    // Rule 2: Check longer / more specific titles FIRST before broader titles!
    if (ep.includes('ASSISTANT GENERAL SECRETARY') || ep.includes('AGS') || ep.includes('AUNTY')) return 'AUNTY';
    if (ep.includes('GENERAL SECRETARY') || ep.includes('GEN SEC') || ep.includes('UNCLE')) return 'UNCLE';
    if (ep.includes('PRESIDENT') || ep.includes('PAPA')) return 'PAPA';

    if (ep.includes('ASSISTANT TRANSPORT') || ep.includes('ATOS')) return 'ATOS';
    if (ep.includes('TRANSPORT') || ep.includes('TOS')) return 'TOS MAN';

    if (ep.includes('ASSISTANT WELFARE') && ep.includes('BROTHERS')) return 'AC PAPA';
    if (ep.includes('ASSISTANT WELFARE') && ep.includes('SISTERS')) return 'AC MAMA';
    if (ep.includes('WELFARE SECRETARY') || ep.includes('MAMA')) return 'MAMA';

    if (ep.includes('ASSISTANT EVANGELISM')) return 'A. RUGGED';
    if (ep.includes('EVANGELISM') || ep.includes('RUGGED')) return 'RUGGED MAN';

    if (ep.includes('ASSISTANT PUBLICITY')) return 'A. PUBGREAT';
    if (ep.includes('PUBLICITY SECRETARY') || ep.includes('PUB')) return 'PUBGREAT';

    if (ep.includes('ASSISTANT MUSIC')) return 'A. MD';
    if (ep.includes('MUSIC DIRECTOR') || ep.includes('MD')) return 'MD';
    if (ep.includes('DRAMA DIRECTOR') || ep.includes('DD')) return 'DD';

    if (ep.includes('PRAYER')) return 'PRAYO';
    if (ep.includes('BIBLE STUDY') || ep.includes('BS')) return 'BISHOP';
    if (ep.includes('TREASURER')) return 'CBN';
    if (ep.includes('FINANCIAL SECRETARY') || ep.includes('FIN SEC')) return 'IMF';
    if (ep.includes('CHIEF USHER')) return 'LANDLADY';
    if (ep.includes('BUSINESS DEVELOPMENT') || ep.includes('BDO')) return 'BDO';
    if (ep.includes('LIBRARIAN')) return 'LIBRARIAN';

    if (ep.includes('ADMIN') || ep.includes('TECH')) return 'ADMIN';

    return ep.length > 12 ? ep.substring(0, 12) : ep;
  };

  // If houseStatus is Gee, combine 'GEE' with slogan if post exists
  if (profile.houseStatus === 'Gee') {
    if (profile.executivePost && profile.executivePost.trim() && profile.executivePost !== 'None' && profile.executivePost !== 'Member') {
      const slogan = resolveSlogan(profile.executivePost.trim());
      return `GEE ${slogan}`;
    }
    return 'GEE';
  }

  // Check executivePost for other statuses
  if (profile.executivePost && profile.executivePost.trim() && profile.executivePost !== 'None' && profile.executivePost !== 'Member') {
    return resolveSlogan(profile.executivePost.trim());
  }

  if (profile.houseStatus === 'Executive') return 'EXECUTIVE';
  if (profile.systemCategory === 'tripartite' || profile.houseStatus === 'Tripartite') return 'TRIPARTITE';
  if (profile.houseStatus === 'Delegate') return 'DELEGATE';
  if (profile.houseStatus === 'Room Gov' || profile.houseStatus === 'Governor') return 'ROOM GOV';

  return 'MEMBER';
}

/**
 * Evaluates the profile's role-tier priority hierarchy and assigns the numerical tier:
 * Tier 1: systemCategory === 'admin'
 * Tier 2: houseStatus === 'Gee'
 * Tier 3: systemCategory === 'tripartite'
 * Tier 4: houseStatus === 'Executive'
 * Tier 5: houseStatus === 'Delegate'
 * Tier 6: houseStatus === 'Governor'
 * Tier 7: Default (Member)
 */
export function evaluateTier(profile: Partial<CorperProfile>): TierInfo {
  let baseTier = TIER_DEFINITIONS[7];

  if (profile.systemCategory === 'admin') {
    baseTier = TIER_DEFINITIONS[1]
  } else if (profile.houseStatus === 'Gee') {
    baseTier = TIER_DEFINITIONS[2]
  } else if (profile.systemCategory === 'tripartite') {
    baseTier = TIER_DEFINITIONS[3]
  } else if (profile.houseStatus === 'Executive') {
    baseTier = TIER_DEFINITIONS[4]
  } else if (profile.houseStatus === 'Delegate') {
    baseTier = TIER_DEFINITIONS[5]
  } else if (profile.houseStatus === 'Room Gov') {
    baseTier = TIER_DEFINITIONS[6]
  }

  const codedPost = getCodedPostTitle(profile);

  return {
    ...baseTier,
    badgeText: codedPost,
    codedPost: codedPost,
  };
}

/**
 // Mutates/assigns profile.tier based on evaluateTier and returns full TierInfo metadata
 */
export function assignTierAndBadges(profile: CorperProfile): { profile: CorperProfile; tierInfo: TierInfo } {
  const tierInfo = evaluateTier(profile);
  profile.tier = tierInfo.tier;
  return { profile, tierInfo };
}

/**
 * Formats a truncated name: First Name + Last Name Initial (e.g. Emmanuel O.)
 */
export function formatTruncatedName(firstName?: string, lastName?: string): string {
  if (!firstName && !lastName) return 'Anonymous Corper';
  const f = firstName ? firstName.trim() : '';
  const l = lastName ? lastName.trim() : '';
  if (f && l) {
    return `${f} ${l.charAt(0).toUpperCase()}.`;
  }
  return f || l;
}
