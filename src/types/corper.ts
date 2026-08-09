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
  | '1G (Female)'
  | '1G (Male)'
  | '2G (Female)'
  | '2G (Male)'
  | 'David'
  | 'Delegates (Female)'
  | 'Delegates (Male)'
  | 'Esther'
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

export type ServiceUnit =
  | 'Bible Study'
  | 'Choir'
  | 'Evangelism'
  | 'Welfare'
  | 'Prayer'
  | 'Publicity'
  | 'Ushering';

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
  created_at?: string;
  updated_at?: string;

  has_tripartite_privileges?: boolean;
  is_exempted?: boolean;
  privileges?: CorperPrivileges | null;
}