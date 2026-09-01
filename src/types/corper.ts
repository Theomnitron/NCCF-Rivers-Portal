export type Gender = 'Male' | 'Female' | 'M' | 'F';

export type MaritalStatus = 'Not Engaged' | 'Engaged';

export type HouseStatus =
  | 'Member'
  | 'Room Gov'
  | 'Governor'
  | 'Delegate'
  | 'Executive'
  | 'Tripartite'
  | 'Gee'
  | 'Admin';

export type SystemCategory = 'member' | 'tripartite' | 'admin';

export type PresenceStatus = 'Present' | 'Travelled' | 'Moved On';

export type ExecutivePost =
  | 'President (Papa)'
  | 'General Secretary (Uncle)'
  | 'Assistant General Secretary (Aunty)'
  | 'Transport and Organizing Secretary (TOS Man)'
  | 'Welfare Secretary and Sisters\' Coordinator (Mama)'
  | 'Prayer Secretary (Prayo)'
  | 'Bible Study Secretary (Bishop)'
  | 'Evangelism Secretary (Rugged Man)'
  | 'Treasurer (CBN)'
  | 'Financial Secretary (IMF)'
  | 'Music Director (MD)'
  | 'Drama Director (DD)'
  | 'Business Development Officer (BDO)'
  | 'Publicity Secretary (PubGreat)'
  | 'Assistant Transport and Organizing Secretary (ATOS)'
  | 'Chief Usher/Landlady (Landlady)'
  | 'Assistant Welfare/Brothers\' Coordinator (AC Papa)'
  | 'Assistant Welfare and Sisters\' Coordinator (AC Mama)'
  | 'Assistant Publicity Secretary (A. PubGreat)'
  | 'Assistant Evangelism Secretary (A. Rugged)'
  | 'Assistant Music Director (A. MD)'
  | 'Librarian';

export type RoomName =
  | 'David'
  | 'Delegates (Female)'
  | 'Delegates (Male)'
  | 'Esther'
  | 'Excos (Female)'
  | 'Excos (Male)'
  | 'Gees (Female)'
  | 'Gees (Male)'
  | 'Hephzibah'
  | 'Joseph'
  | 'Judah'
  | 'Lydia'
  | 'Mary'
  | 'Papa\'s'
  | 'Peace'
  | 'Ruth'
  | 'Shekinah'
  | 'Tehilah'
  | 'Timothy'
  | 'Uncle\'s';

export const MALE_ROOMS: RoomName[] = [
  'David',
  'Delegates (Male)',
  'Excos (Male)',
  'Gees (Male)',
  'Hephzibah',
  'Joseph',
  'Judah',
  'Papa\'s',
  'Peace',
  'Timothy',
  'Shekinah',
  'Uncle\'s',
];

export const FEMALE_ROOMS: RoomName[] = [
  'Delegates (Female)',
  'Esther',
  'Excos (Female)',
  'Gees (Female)',
  'Lydia',
  'Mary',
  'Ruth',
  'Tehilah',
];

export const ALL_ROOMS: RoomName[] = [
  ...MALE_ROOMS,
  ...FEMALE_ROOMS,
].sort();

export const ALL_EXECUTIVE_POSTS: ExecutivePost[] = [
  'President (Papa)',
  'General Secretary (Uncle)',
  'Assistant General Secretary (Aunty)',
  'Transport and Organizing Secretary (TOS Man)',
  'Welfare Secretary and Sisters\' Coordinator (Mama)',
  'Prayer Secretary (Prayo)',
  'Bible Study Secretary (Bishop)',
  'Evangelism Secretary (Rugged Man)',
  'Treasurer (CBN)',
  'Financial Secretary (IMF)',
  'Music Director (MD)',
  'Drama Director (DD)',
  'Business Development Officer (BDO)',
  'Publicity Secretary (PubGreat)',
  'Assistant Transport and Organizing Secretary (ATOS)',
  'Chief Usher/Landlady (Landlady)',
  'Assistant Welfare/Brothers\' Coordinator (AC Papa)',
  'Assistant Welfare and Sisters\' Coordinator (AC Mama)',
  'Assistant Publicity Secretary (A. PubGreat)',
  'Assistant Evangelism Secretary (A. Rugged)',
  'Assistant Music Director (A. MD)',
  'Librarian',
];

export const NIGERIAN_STATES: string[] = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];

export function getGeeSloganBadge(executivePost?: string | null): string {
  if (!executivePost) return 'Gee';
  const match = executivePost.match(/\(([^)]+)\)/);
  if (match && match[1]) {
    return `Gee ${match[1]}`;
  }
  // Fallback if no parentheses
  if (executivePost.toLowerCase().includes('librarian')) return 'Gee Librarian';
  return `Gee ${executivePost}`;
}

export type ServiceUnit =
  | 'Bible Study'
  | 'Choir'
  | 'Drama'
  | 'Evangelism'
  | 'Welfare'
  | 'Prayer'
  | 'Publicity'
  | 'TOS'
  | 'Ushering';

export const ALL_SERVICE_UNITS: ServiceUnit[] = [
  'Bible Study',
  'Choir',
  'Drama',
  'Evangelism',
  'Prayer',
  'Publicity',
  'TOS',
  'Ushering',
  'Welfare',
];

export interface TargetFees {
  maintenance: number;
  feeding: number;
}

export interface CorperPrivileges {
  tripartite_access?: boolean;
  [key: string]: any;
}

export function hasTripartiteAccess(user?: {
  systemCategory?: SystemCategory | string;
  system_category?: SystemCategory | string;
  privileges?: CorperPrivileges | null;
  hasTripartitePrivileges?: boolean;
} | null): boolean {
  if (!user) return false;
  const sysCat = user.systemCategory || user.system_category;
  if (sysCat === 'tripartite' || sysCat === 'admin') return true;
  if (Boolean(user.privileges?.tripartite_access)) return true;
  if (Boolean(user.hasTripartitePrivileges)) return true;
  return false;
}

export interface CorperProfile {
  id: string;
  userId?: string | null;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  stateCode: string;
  email: string;
  phone: string;
  dateOfBirth: string; // YYYY-MM-DD
  stateOfOrigin: string;
  courseOfStudy: string;
  schoolGraduatedFrom: string;
  maritalStatus: MaritalStatus;
  houseStatus: HouseStatus;
  executivePost?: ExecutivePost | string | null;
  systemCategory: SystemCategory;
  systemAccessCategory?: SystemCategory;
  roomName: string;
  serviceUnits: string[];
  serviceUnit?: string;
  presence: PresenceStatus;
  nextOfKinName?: string;
  nextOfKinPhone?: string;

  // Derived UI & System Metadata
  displayName: string;
  fullName?: string;
  tier: number; // 1 to 7
  targets: TargetFees;
  avatarUrl?: string;
  customAvatarUrl?: string;
  hasTripartitePrivileges?: boolean;
  isExempted?: boolean;
  privileges?: CorperPrivileges | null;
}

export interface Corper {
  id: string;
  user_id?: string | null;
  state_code: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  gender?: Gender | null;
  email: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  date_of_birth?: string | null;
  state_of_origin?: string | null;
  course_of_study?: string | null;
  school_graduated_from?: string | null;
  marital_status: MaritalStatus;
  house_status: HouseStatus;
  executive_post?: ExecutivePost | string | null;
  system_category: SystemCategory;
  room_name?: RoomName | string | null;
  service_units: ServiceUnit[] | string[];
  presence: PresenceStatus;
  next_of_kin_name?: string | null;
  next_of_kin_phone?: string | null;
  created_at?: string;
  updated_at?: string;

  has_tripartite_privileges?: boolean;
  is_exempted?: boolean;
  privileges?: CorperPrivileges | null;
}