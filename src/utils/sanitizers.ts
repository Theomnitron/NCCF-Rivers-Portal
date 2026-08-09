import { CorperProfile, TargetFees } from '../types/corper';

/**
 * Regex enforcing Rivers State NYSC Corper State Code format:
 * RV / YY [A-C] / 0000
 * Example: RV/24A/0001
 */
export const STATE_CODE_REGEX = /^RV\/\d{2}[A-C]\/\d{4}$/;

/**
 * Validates state code string against state code regex pattern
 */
export function isValidStateCode(stateCode: string): boolean {
  if (!stateCode) return false;
  return STATE_CODE_REGEX.test(stateCode.trim().toUpperCase());
}

/**
 * Sanitizes and formats state code to uppercase trimmed string
 */
export function sanitizeStateCode(stateCode: string): string {
  return stateCode.trim().toUpperCase();
}

/**
 * Generates displayName truncated as "FirstName L." (e.g. "Emmanuel O.")
 */
export function formatTruncatedName(firstName: string, lastName: string): string {
  const cleanFirst = firstName ? firstName.trim() : '';
  const cleanLast = lastName ? lastName.trim() : '';
  
  if (!cleanFirst && !cleanLast) return 'Corper';
  if (!cleanLast) return cleanFirst;
  if (!cleanFirst) return `${cleanLast.charAt(0).toUpperCase()}.`;

  const lastInitial = cleanLast.charAt(0).toUpperCase();
  return `${cleanFirst} ${lastInitial}.`;
}

/**
 * Calculates financial target fees based on system category, house status, and service unit
 * - Tripartite members are exempt: ₦0 maintenance, ₦0 feeding
 * - Executive, Governor, or Welfare unit staff get subsidized feeding: ₦15,000 maintenance, ₦5,000 feeding
 * - Standard Members, Gees, and Delegates: ₦15,000 maintenance, ₦10,000 feeding
 */
export function calculateTargets(profile: Partial<CorperProfile>): TargetFees {
  // Admin operators, Tripartite state executive leadership, Delegates, and explicitly exempted corpers are exempt from dues (Target: ₦0)
  if (
    Boolean(profile.isExempted) ||
    profile.systemCategory === 'admin' ||
    profile.systemCategory === 'tripartite' ||
    profile.houseStatus === 'Delegate'
  ) {
    return {
      maintenance: 0,
      feeding: 0,
    };
  }

  // Corpers with house_status 'Gee' pay ₦15,000 total (₦15k maintenance, ₦0 feeding)
  if (profile.houseStatus === 'Gee') {
    return {
      maintenance: 15000,
      feeding: 0,
    };
  }

  const isExcoOrGov = profile.houseStatus === 'Executive' || profile.houseStatus === 'Room Gov';
  const isWelfareStaff = profile.serviceUnit
    ? profile.serviceUnit.toLowerCase().includes('welfare') || profile.serviceUnit.toLowerCase().includes('kitchen')
    : false;

  if (isExcoOrGov || isWelfareStaff) {
    return {
      maintenance: 15000,
      feeding: 5000,
    };
  }

  return {
    maintenance: 15000,
    feeding: 10000,
  };
}
