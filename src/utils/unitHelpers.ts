import { CorperProfile } from '../types/corper';

/**
 * Service Unit Display Rule helper based on NCCF Portal specifications:
 * 1. Tripartite members: Do NOT belong to a unit while they are tripartite members.
 *    The unit field should NOT be displayed at all.
 * 2. Gee (Alumnus): If they are still in a unit, display their unit.
 *    If they are no longer in a unit (blank or 'Nil'), do NOT display the unit field at all.
 * 3. Individual (Member, Governor, Executive, Delegate, Admin, etc.):
 *    Can belong to single/multiple units. If not in any unit, display "Nil".
 */
export function shouldDisplayUnit(user: CorperProfile): boolean {
  // 1. Tripartite: Never display unit field
  if (user.systemCategory === 'tripartite') {
    return false;
  }

  // 2. Gee: Only display if unit is specified and not empty/'nil'
  if (user.houseStatus === 'Gee') {
    if (!user.serviceUnit) return false;
    const trimmed = user.serviceUnit.trim().toLowerCase();
    return trimmed !== '' && trimmed !== 'nil' && trimmed !== 'none';
  }

  // 3. All other categories: Always display unit field
  return true;
}

/**
 * Returns formatted unit text for users whose unit field is displayed.
 * Returns "Nil" if no unit is set for standard members/executives.
 */
export function formatServiceUnitText(user: CorperProfile): string {
  if (user.serviceUnit && user.serviceUnit.trim() !== '') {
    const trimmed = user.serviceUnit.trim();
    if (trimmed.toLowerCase() === 'none') return 'Nil';
    return trimmed;
  }
  return 'Nil';
}
