import React, { createContext, useContext, useState, useEffect } from 'react';
import { MonthLedgerEntry, PaymentType, PaymentStatus } from '../types/ledger';
import { saveUserLedger, getStoredUserLedger } from '../data/initialLedger';
import { calculateWaterfallDues, getFeedingTarget, getCurrentActiveLedgerMonth } from '../utils/duesCalculator';
import { CorperProfile } from '../types/corper';
import { supabase } from '../lib/supabase';
import { uploadFileToStorage } from '../utils/storage';
import { PendingRegistration, getStoredPendingRegistrations, saveStoredPendingRegistrations } from '../types/registration';
import { syncApprovedCorperToGoogleSheet } from '../services/registrationService';

export interface CorperRequest {
  id: string;
  user_id?: string;
  corper_id: string;
  request_type: string;
  request_category?: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  attachment_url?: string;
  reviewer_notes?: string;
  reviewed_by?: string;
  resolved_at?: string;
  created_at?: string;
  updated_at?: string;
  payload?: any;
}

export interface DuesReceiptSubmission {
  id: string;
  userId: string;
  userName: string;
  userStateCode: string;
  userAvatar?: string;
  userHouseStatus: string;
  userRoom: string;
  userTier: number;
  monthKey: string; // e.g. "AUG" or "AUG-2026"
  monthCode: string; // "AUG"
  year: number; // 2026
  monthName: string; // "August"
  subscriptionType: PaymentType; // 'combined' | 'maintenance' | 'feeding'
  amountPaid: number;
  expectedAmount: number;
  fileName: string;
  fileDataUrl?: string;
  fileType?: 'image';
  originalSizeText?: string;
  processedSizeText?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'modified_approved' | 'rejected';
  approvedAmount?: number;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  receiptUrl?: string;
}

export interface TravelRequestSubmission {
  id: string;
  userId: string;
  userName: string;
  userStateCode: string;
  userAvatar?: string;
  userHouseStatus: string;
  userRoom: string;
  userTier: number;
  departureDate: string; // YYYY-MM-DD
  returnDate: string; // YYYY-MM-DD
  approvedDepartureDate?: string;
  approvedReturnDate?: string;
  reason: string; // Short Travel Reason
  detailedExplanation?: string; // Detailed context (Optional)
  contactDuringAbsence?: string; // Contact During Absence (Required)
  letterFileName?: string;
  letterFileDataUrl?: string;
  letterFileType?: 'image';
  letterOriginalSizeText?: string;
  letterProcessedSizeText?: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'modified_approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  supportingLetterUrl?: string;
}

export interface ProfileChangeRequestSubmission {
  id: string; // e.g. "PR-2026-501"
  userId: string;
  userName: string;
  userStateCode: string;
  userAvatar?: string;
  userHouseStatus: string;
  userRoom: string;
  userTier: number;
  changeType: 'room_name' | 'service_units' | 'marital_status' | 'multi';
  deltaPayload: string; // "From X to Y" format
  roomChange?: { oldVal: string; newVal: string };
  unitChange?: { oldVal: string; newVal: string };
  maritalChange?: { oldVal: string; newVal: string };
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

interface RequestsContextType {
  duesSubmissions: DuesReceiptSubmission[];
  travelRequests: TravelRequestSubmission[];
  profileRequests: ProfileChangeRequestSubmission[];
  pendingRegistrations: PendingRegistration[];
  isLoadingRequests?: boolean;
  addDuesSubmission: (sub: Omit<DuesReceiptSubmission, 'id' | 'submittedAt' | 'status'>) => string;
  approveDuesSubmission: (id: string, reviewerName: string, overrideAmount?: number) => void;
  rejectDuesSubmission: (id: string, reviewerName: string, reason: string) => void;
  addTravelRequest: (req: Omit<TravelRequestSubmission, 'id' | 'submittedAt' | 'status'>) => string;
  approveTravelRequest: (id: string, reviewerName: string, overrideDeptDate?: string, overrideRetDate?: string, updateUserProfile?: (userId: string, updates: any) => void) => void;
  rejectTravelRequest: (id: string, reviewerName: string, reason: string) => void;
  addProfileRequest: (req: Omit<ProfileChangeRequestSubmission, 'id' | 'submittedAt' | 'status'>) => string;
  approveProfileRequest: (id: string, reviewerName: string, updateUserProfile: (userId: string, updates: any) => void) => void;
  rejectProfileRequest: (id: string, reviewerName: string, reason: string) => void;

  // New Registration Approvals
  approveRegistration: (id: string, reviewerName: string, addCorperUser?: (data: any) => any) => Promise<{ success: boolean; error?: string }>;
  rejectRegistration: (id: string, reviewerName: string, reason: string) => Promise<{ success: boolean; error?: string }>;

  // Convenience Aliases for prompt requirement compliance
  submitTravelPermit?: (req: Omit<TravelRequestSubmission, 'id' | 'submittedAt' | 'status'>) => string;
  approveRequest?: (id: string, type: 'dues' | 'travel' | 'profile' | 'registration', reviewerName: string, extra?: any) => void;
  rejectRequest?: (id: string, type: 'dues' | 'travel' | 'profile' | 'registration', reviewerName: string, reason: string) => void;
  publishNotice?: (noticeData: any) => string;
  forceClearUserDues?: (user: CorperProfile, justification: string) => Promise<void>;
  resetUserDues?: (user: CorperProfile, justification: string) => Promise<void>;
  refetchRequests?: () => Promise<void>;
}

const LOCAL_STORAGE_KEY_DUES = 'nccf_rivers_dues_submissions_v1';
const LOCAL_STORAGE_KEY_TRAVEL = 'nccf_rivers_travel_requests_v1';
const LOCAL_STORAGE_KEY_PROFILE = 'nccf_rivers_profile_requests_v1';

export function mapRowToDuesSubmission(row: any): DuesReceiptSubmission {
  const p = row.payload || {};
  const corperId = row.corper_id || row.user_id || p.userId;
  const statusVal = (p.status || row.status || 'pending').toLowerCase();

  return {
    id: row.id || p.id,
    userId: corperId,
    userName: (p.userName || 'Corper Member').replace(/\s*\([^)]*\)/g, '').trim(),
    userStateCode: p.userStateCode || '',
    userAvatar: p.userAvatar,
    userHouseStatus: p.userHouseStatus || 'Member',
    userRoom: p.userRoom || 'Unassigned',
    userTier: p.userTier || 7,
    monthKey: p.monthKey || 'AUG-2026',
    monthCode: p.monthCode || 'AUG',
    year: p.year || 2026,
    monthName: p.monthName || 'August',
    subscriptionType: p.subscriptionType || 'combined',
    amountPaid: p.amountPaid || row.amount_paid || row.amount || 0,
    expectedAmount: p.expectedAmount || row.amount_due || 0,
    fileName: row.attachment_url || p.fileName || 'receipt.jpg',
    fileDataUrl: p.fileDataUrl || (typeof row.attachment_url === 'string' && row.attachment_url.startsWith('http') ? row.attachment_url : undefined),
    fileType: p.fileType || 'image',
    originalSizeText: p.originalSizeText,
    processedSizeText: p.processedSizeText,
    submittedAt: row.created_at ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 16) : p.submittedAt || '2026-07-28 10:00',
    status: (statusVal === 'modified_approved' ? 'modified_approved' : statusVal === 'approved' ? 'approved' : statusVal === 'declined' || statusVal === 'rejected' ? 'rejected' : 'pending'),
    approvedAmount: p.approvedAmount || row.approved_amount,
    rejectionReason: row.reviewer_notes || row.rejection_reason || p.rejectionReason,
    reviewedBy: row.reviewed_by || p.reviewedBy,
    reviewedAt: row.resolved_at || row.updated_at || p.reviewedAt,
  };
}

export function mapRowToTravelRequest(row: any): TravelRequestSubmission {
  const p = row.payload || {};
  const corperId = row.corper_id || row.user_id || p.userId;
  const statusVal = (p.status || row.status || 'pending').toLowerCase();

  return {
    id: row.id || p.id,
    userId: corperId,
    userName: (p.userName || 'Corper Member').replace(/\s*\([^)]*\)/g, '').trim(),
    userStateCode: p.userStateCode || '',
    userAvatar: p.userAvatar,
    userHouseStatus: p.userHouseStatus || 'Member',
    userRoom: p.userRoom || 'Unassigned',
    userTier: p.userTier || 7,
    departureDate: p.departureDate || '',
    returnDate: p.returnDate || '',
    approvedDepartureDate: p.approvedDepartureDate || row.approved_start_date,
    approvedReturnDate: p.approvedReturnDate || row.approved_end_date,
    reason: row.reason || row.title || p.reason || '',
    detailedExplanation: p.detailedExplanation || row.reason || '',
    contactDuringAbsence: p.contactDuringAbsence || row.contact_during_absence || '',
    letterFileName: row.attachment_url || p.letterFileName,
    letterFileDataUrl: p.letterFileDataUrl || (typeof row.attachment_url === 'string' && row.attachment_url.startsWith('http') ? row.attachment_url : undefined),
    letterFileType: p.letterFileType,
    letterOriginalSizeText: p.letterOriginalSizeText,
    letterProcessedSizeText: p.letterProcessedSizeText,
    submittedAt: row.created_at ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 16) : p.submittedAt || '2026-07-28 10:00',
    status: (statusVal === 'modified_approved' ? 'modified_approved' : statusVal === 'approved' ? 'approved' : statusVal === 'declined' || statusVal === 'rejected' ? 'rejected' : 'pending'),
    rejectionReason: row.reviewer_notes || row.rejection_reason || p.rejectionReason,
    reviewedBy: row.reviewed_by || p.reviewedBy,
    reviewedAt: row.resolved_at || row.updated_at || p.reviewedAt,
  };
}

export function mapRowToProfileRequest(row: any): ProfileChangeRequestSubmission {
  const p = row.payload || {};
  const corperId = row.corper_id || row.user_id || p.userId;
  const statusVal = (p.status || row.status || 'pending').toLowerCase();

  return {
    id: row.id || p.id,
    userId: corperId,
    userName: (p.userName || 'Corper Member').replace(/\s*\([^)]*\)/g, '').trim(),
    userStateCode: p.userStateCode || '',
    userAvatar: p.userAvatar,
    userHouseStatus: p.userHouseStatus || 'Member',
    userRoom: p.userRoom || 'Unassigned',
    userTier: p.userTier || 7,
    changeType: p.changeType || 'room_name',
    deltaPayload: row.title || p.deltaPayload || '',
    roomChange: p.roomChange,
    unitChange: p.unitChange,
    maritalChange: p.maritalChange,
    submittedAt: row.created_at ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 16) : p.submittedAt || '2026-07-28 10:00',
    status: (statusVal === 'approved' ? 'approved' : statusVal === 'declined' || statusVal === 'rejected' ? 'rejected' : 'pending'),
    rejectionReason: row.reviewer_notes || row.rejection_reason || p.rejectionReason,
    reviewedBy: row.reviewed_by || p.reviewedBy,
    reviewedAt: row.resolved_at || row.updated_at || p.reviewedAt,
  };
}

// const INITIAL_DUES_SUBMISSIONS: DuesReceiptSubmission[] = [
//   {
//     id: '11111111-1111-4000-8000-000000000101',
//     userId: '00000000-0000-4000-a000-000000000007',
//     userName: 'Blessing A. (Blessing Adeleke)',
//     userStateCode: 'RV/24C/0102',
//     userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
//     userHouseStatus: 'Member',
//     userRoom: 'Judah (Welfare)',
//     userTier: 7,
//     monthKey: 'AUG-2026',
//     monthCode: 'AUG',
//     year: 2026,
//     monthName: 'August',
//     subscriptionType: 'combined',
//     amountPaid: 25000,
//     expectedAmount: 25000,
//     fileName: 'gtbank_transfer_receipt_august.jpg',
//     fileType: 'image',
//     originalSizeText: '2.4 MB',
//     processedSizeText: '380 KB',
//     fileDataUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
//     submittedAt: '2026-07-26 14:20',
//     status: 'pending',
//   },
//   {
//     id: '11111111-1111-4000-8000-000000000102',
//     userId: '00000000-0000-4000-a000-000000000002',
//     userName: 'Samuel D. (Samuel Danladi)',
//     userStateCode: 'RV/24B/0150',
//     userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
//     userHouseStatus: 'Governor',
//     userRoom: 'Room Zion',
//     userTier: 2,
//     monthKey: 'AUG-2026',
//     monthCode: 'AUG',
//     year: 2026,
//     monthName: 'August',
//     subscriptionType: 'maintenance',
//     amountPaid: 15000,
//     expectedAmount: 15000,
//     fileName: 'firstbank_transfer_samuel.png',
//     fileType: 'image',
//     originalSizeText: '1.8 MB',
//     processedSizeText: '290 KB',
//     fileDataUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=600',
//     submittedAt: '2026-07-25 09:15',
//     status: 'approved',
//     approvedAmount: 15000,
//     reviewedBy: 'Adebayo T. (Tripartite Steward)',
//     reviewedAt: '2026-07-25 11:30',
//   },
//   {
//     id: '11111111-1111-4000-8000-000000000103',
//     userId: '00000000-0000-4000-a000-000000000003',
//     userName: 'David D. (David Dogara)',
//     userStateCode: 'RV/24A/0200',
//     userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
//     userHouseStatus: 'Delegate',
//     userRoom: 'Room Carmel',
//     userTier: 3,
//     monthKey: 'SEP-2026',
//     monthCode: 'SEP',
//     year: 2026,
//     monthName: 'September',
//     subscriptionType: 'combined',
//     amountPaid: 25000,
//     expectedAmount: 25000,
//     fileName: 'zenith_mobile_proof_david.pdf',
//     fileType: 'image',
//     originalSizeText: '1.1 MB',
//     processedSizeText: '1.1 MB',
//     submittedAt: '2026-07-27 08:45',
//     status: 'pending',
//   },
// ];

// const INITIAL_TRAVEL_REQUESTS: TravelRequestSubmission[] = [
//   {
//     id: '22222222-2222-4000-8000-000000000201',
//     userId: '00000000-0000-4000-a000-000000000002',
//     userName: 'Samuel D. (Samuel Danladi)',
//     userStateCode: 'RV/24B/0150',
//     userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
//     userHouseStatus: 'Governor',
//     userRoom: 'Room Zion',
//     userTier: 2,
//     departureDate: '2026-08-12',
//     returnDate: '2026-08-18',
//     reason: 'Attending Family Wedding in Lagos State',
//     detailedExplanation:
//       'Requesting official exeat permission to travel to Ikeja, Lagos State for my elder brother’s wedding ceremony. I will be fully reachable via mobile phone.',
//     letterFileName: 'exeat_request_letter_samuel.pdf',
//     letterFileType: 'image',
//     letterOriginalSizeText: '1.2 MB',
//     letterProcessedSizeText: '1.2 MB',
//     submittedAt: '2026-07-24 16:30',
//     status: 'pending',
//   },
//   {
//     id: '22222222-2222-4000-8000-000000000202',
//     userId: '00000000-0000-4000-a000-000000000003',
//     userName: 'David D. (David Dogara)',
//     userStateCode: 'RV/24A/0200',
//     userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
//     userHouseStatus: 'Delegate',
//     userRoom: 'Room Carmel',
//     userTier: 3,
//     departureDate: '2026-08-01',
//     returnDate: '2026-08-08',
//     approvedDepartureDate: '2026-08-01',
//     approvedReturnDate: '2026-08-08',
//     reason: 'NYSC Orientation Camp Ad-hoc Duties in Abuja FCT',
//     detailedExplanation:
//       'Selected for national mobilization assignment at Kubwa Orientation Camp. Formal deployment letter from State Secretariat attached.',
//     letterFileName: 'nysc_official_posting_letter.pdf',
//     letterFileType: 'image',
//     letterOriginalSizeText: '890 KB',
//     letterProcessedSizeText: '890 KB',
//     submittedAt: '2026-07-20 10:15',
//     status: 'approved',
//     reviewedBy: 'Tripartite Governance Council',
//     reviewedAt: '2026-07-21 14:00',
//   },
//   {
//     id: '22222222-2222-4000-8000-000000000203',
//     userId: '00000000-0000-4000-a000-000000000007',
//     userName: 'Blessing A. (Blessing Adeleke)',
//     userStateCode: 'RV/24C/0102',
//     userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
//     userHouseStatus: 'Member',
//     userRoom: 'Peace (Welfare)',
//     userTier: 7,
//     departureDate: '2026-09-05',
//     returnDate: '2026-09-10',
//     reason: 'Medical Checkup & Dental Procedure in Benin City',
//     detailedExplanation:
//       'Scheduled medical examination and dental consultation at UBTH Benin City. Doctor’s appointment slip attached as supporting documentation.',
//     letterFileName: 'benin_medical_appointment_slip.png',
//     letterFileType: 'image',
//     letterOriginalSizeText: '3.1 MB',
//     letterProcessedSizeText: '420 KB',
//     letterFileDataUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=600',
//     submittedAt: '2026-07-26 18:00',
//     status: 'pending',
//   },
// ];

// const INITIAL_PROFILE_REQUESTS: ProfileChangeRequestSubmission[] = [
//   {
//     id: '33333333-3333-4000-8000-000000000301',
//     userId: '00000000-0000-4000-a000-000000000007',
//     userName: 'Blessing A. (Blessing Adeleke)',
//     userStateCode: 'RV/24C/0102',
//     userAvatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=250',
//     userHouseStatus: 'Member',
//     userRoom: 'Room Zion (Female Wing)',
//     userTier: 7,
//     changeType: 'unit',
//     deltaPayload: 'Unit change: From Choir to Welfare, Choir',
//     unitChange: { oldVal: 'Choir', newVal: 'Welfare, Choir' },
//     submittedAt: '2026-07-27 10:30',
//     status: 'pending',
//   },
//   {
//     id: '33333333-3333-4000-8000-000000000302',
//     userId: '00000000-0000-4000-a000-000000000005',
//     userName: 'Samuel D. (Samuel Danladi)',
//     userStateCode: 'RV/24B/0150',
//     userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
//     userHouseStatus: 'Delegate',
//     userRoom: 'Room Zion 3',
//     userTier: 5,
//     changeType: 'room',
//     deltaPayload: 'Room change: From Room Zion 3 to Room Bethel',
//     roomChange: { oldVal: 'Room Zion 3', newVal: 'Room Bethel' },
//     submittedAt: '2026-07-26 15:45',
//     status: 'pending',
//   },
// ];

const RequestsContext = createContext<RequestsContextType | undefined>(undefined);

export const RequestsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [duesSubmissions, setDuesSubmissions] = useState<DuesReceiptSubmission[]>([]);
  const [travelRequests, setTravelRequests] = useState<TravelRequestSubmission[]>([]);
  const [profileRequests, setProfileRequests] = useState<ProfileChangeRequestSubmission[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>(() => getStoredPendingRegistrations());
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(true);

  // Fetch initial state from Supabase approval_requests, announcements, dues_ledgers, and pending_registrations
  const fetchInitialRequests = async () => {
    if (!supabase) {
      setIsLoadingRequests(false);
      return;
    }
    setIsLoadingRequests(true);
    try {
      const [approvalsRes, ledgerRes, regRes] = await Promise.all([
        supabase.from('approval_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('dues_ledgers').select('*').order('created_at', { ascending: false }),
        supabase.from('pending_registrations').select('*').order('created_at', { ascending: false }),
      ]);

      const approvalsData = approvalsRes.data;
      const ledgerData = ledgerRes.data;
      const regData = regRes.data;

      const duesList: DuesReceiptSubmission[] = [];
      const travelList: TravelRequestSubmission[] = [];
      const profileList: ProfileChangeRequestSubmission[] = [];
      const regList: PendingRegistration[] = [];

      if (approvalsData) {
        for (const row of approvalsData) {
          const reqType = row.request_type || row.request_category;
          if (reqType === 'dues_waiver' || reqType === 'dues_proof') {
            duesList.push(mapRowToDuesSubmission(row));
          } else if (reqType === 'travel_permit' || reqType === 'travel_exeat' || reqType === 'leave' || reqType === 'exemption') {
            travelList.push(mapRowToTravelRequest(row));
          } else if (reqType === 'profile_update' || reqType === 'room_change' || reqType === 'unit_change' || reqType === 'marital_status_change') {
            profileList.push(mapRowToProfileRequest(row));
          } else if (reqType === 'user_registration' || reqType === 'new_registration' || reqType === 'member_registration') {
            // Also pick up from approval_requests fallback if stored there
            const p = row.payload || {};
            const st = (row.status === 'approved' ? 'approved' : row.status === 'rejected' ? 'rejected' : 'pending');
            regList.push({
              id: row.id,
              first_name: p.firstName || '',
              middle_name: p.middleName || '',
              last_name: p.lastName || '',
              state_code: p.stateCode || '',
              phone_number: p.phone || p.phoneNumber || '',
              firstName: p.firstName || '',
              middleName: p.middleName || '',
              lastName: p.lastName || '',
              fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
              stateCode: p.stateCode || '',
              email: p.email || '',
              phone: p.phone || p.phoneNumber || '',
              phoneNumber: p.phone || p.phoneNumber || '',
              gender: p.gender || 'Male',
              date_of_birth: p.dateOfBirth || '',
              dateOfBirth: p.dateOfBirth || '',
              state_of_origin: p.stateOfOrigin || '',
              stateOfOrigin: p.stateOfOrigin || '',
              course_of_study: p.courseOfStudy || '',
              courseOfStudy: p.courseOfStudy || '',
              school_graduated_from: p.schoolGraduatedFrom || '',
              schoolGraduatedFrom: p.schoolGraduatedFrom || '',
              marital_status: p.maritalStatus || 'Not Engaged',
              maritalStatus: p.maritalStatus || 'Not Engaged',
              next_of_kin_name: p.nextOfKinName || '',
              nextOfKinName: p.nextOfKinName || '',
              next_of_kin_phone: p.nextOfKinPhone || '',
              nextOfKinPhone: p.nextOfKinPhone || '',
              house_status: p.houseStatus || 'Member',
              houseStatus: p.houseStatus || 'Member',
              room_name: p.roomName || '',
              roomName: p.roomName || '',
              service_units: p.serviceUnits || [],
              serviceUnits: p.serviceUnits || [],
              presence: p.presence || 'Present',
              avatar_url: p.avatarUrl || row.attachment_url || '',
              avatarUrl: p.avatarUrl || row.attachment_url || '',
              status: st,
              created_at: row.created_at || new Date().toISOString(),
              createdAt: row.created_at || new Date().toISOString(),
              reviewed_by: row.reviewed_by,
              reviewedBy: row.reviewed_by,
              reviewedAt: row.resolved_at,
              rejectionReason: row.reviewer_notes,
            });
          }
        }
      }

      if (regData && regData.length > 0) {
        for (const r of regData) {
          // Avoid duplicate if already mapped
          const existingIdx = regList.findIndex((x) => x.id === r.id || (r.state_code && x.state_code === r.state_code) || (r.email && x.email === r.email));
          const st = (r.status === 'approved' ? 'approved' : r.status === 'rejected' ? 'rejected' : 'pending');
          if (existingIdx >= 0) {
            regList[existingIdx].status = st;
          } else {
            regList.push({
              id: r.id,
              first_name: r.first_name || '',
              middle_name: r.middle_name || '',
              last_name: r.last_name || '',
              state_code: r.state_code || '',
              phone_number: r.phone_number || r.phone || '',
              firstName: r.first_name || '',
              middleName: r.middle_name || '',
              lastName: r.last_name || '',
              fullName: `${r.first_name || ''} ${r.middle_name ? r.middle_name + ' ' : ''}${r.last_name || ''}`.trim(),
              stateCode: r.state_code || '',
              email: r.email || '',
              phone: r.phone_number || r.phone || '',
              phoneNumber: r.phone_number || r.phone || '',
              gender: r.gender || 'Male',
              date_of_birth: r.date_of_birth || '',
              dateOfBirth: r.date_of_birth || '',
              state_of_origin: r.state_of_origin || '',
              stateOfOrigin: r.state_of_origin || '',
              course_of_study: r.course_of_study || '',
              courseOfStudy: r.course_of_study || '',
              school_graduated_from: r.school_graduated_from || '',
              schoolGraduatedFrom: r.school_graduated_from || '',
              marital_status: r.marital_status || 'Not Engaged',
              maritalStatus: r.marital_status || 'Not Engaged',
              next_of_kin_name: r.next_of_kin_name || '',
              nextOfKinName: r.next_of_kin_name || '',
              next_of_kin_phone: r.next_of_kin_phone || '',
              nextOfKinPhone: r.next_of_kin_phone || '',
              house_status: r.house_status || 'Member',
              houseStatus: r.house_status || 'Member',
              room_name: r.room_name || '',
              roomName: r.room_name || '',
              service_units: Array.isArray(r.service_units) ? r.service_units : [],
              serviceUnits: Array.isArray(r.service_units) ? r.service_units : [],
              presence: r.presence || 'Present',
              avatar_url: r.avatar_url || '',
              avatarUrl: r.avatar_url || '',
              status: st,
              created_at: r.created_at || new Date().toISOString(),
              createdAt: r.created_at || new Date().toISOString(),
              reviewed_by: r.reviewed_by,
              reviewedBy: r.reviewed_by,
              reviewedAt: r.resolved_at || r.updated_at,
              rejectionReason: r.rejection_reason,
            });
          }
        }
      }

      // Merge cached local registrations if not found in db and still pending
      const localCached = getStoredPendingRegistrations();
      for (const loc of localCached) {
        if (!regList.some((x) => x.id === loc.id || (loc.state_code && x.state_code === loc.state_code) || (loc.stateCode && x.stateCode === loc.stateCode))) {
          if (loc.status === 'pending' || !loc.status) {
            regList.push(loc);
          }
        }
      }

      // Reconcile and synchronize with dues_ledgers entries to guarantee persistent financial records across cache clears
      if (ledgerData && ledgerData.length > 0) {
        // Track the newest processed record per corper + month to ensure latest action (e.g. Reset) takes precedence
        const seenCorperMonths = new Set<string>();

        for (const lRow of ledgerData) {
          const corperId = lRow.corper_id || lRow.user_id;
          const targetMonth = (lRow.target_month || lRow.month_key || '').toUpperCase();
          if (!corperId || !targetMonth) continue;

          const key = `${corperId}_${targetMonth}`;
          if (seenCorperMonths.has(key)) {
            // Skip older records for this same month so they don't override the latest action
            continue;
          }
          seenCorperMonths.add(key);

          const isVerified = lRow.status === 'verified' || lRow.status === 'approved' || lRow.status === 'paid';
          const isRejected = lRow.status === 'rejected' || lRow.status === 'declined' || lRow.status === 'unpaid';
          const amount = Number(lRow.amount) || 0;

          // Check if there is already a matching submission in duesList
          const existingIdx = duesList.findIndex(
            (d) =>
              (lRow.request_id && d.id === lRow.request_id) ||
              (d.userId === corperId && (d.monthKey?.toUpperCase() === targetMonth || d.monthCode?.toUpperCase() === targetMonth.split('-')[0]))
          );

          if (existingIdx >= 0) {
            if (isVerified && amount > 0) {
              duesList[existingIdx] = {
                ...duesList[existingIdx],
                status: 'approved',
                approvedAmount: amount,
                subscriptionType: lRow.subscription_type || duesList[existingIdx].subscriptionType || 'combined',
              };
            } else if (isRejected || amount === 0) {
              duesList[existingIdx] = {
                ...duesList[existingIdx],
                status: 'rejected',
                approvedAmount: 0,
              };
            }
          } else if (isVerified && amount > 0) {
            // Reconstruct verified record if approval_requests was emptied
            const parts = targetMonth.split('-');
            const mCode = parts[0] || 'AUG';
            const yNum = parts[1] ? parseInt(parts[1]) : 2026;
            const monthNames: Record<string, string> = {
              JAN: 'January', FEB: 'February', MAR: 'March', APR: 'April', MAY: 'May', JUN: 'June',
              JUL: 'July', AUG: 'August', SEP: 'September', OCT: 'October', NOV: 'November', DEC: 'December',
            };
            const mName = monthNames[mCode.toUpperCase()] || mCode;

            const synthesizedSub: DuesReceiptSubmission = {
              id: lRow.request_id || lRow.id || generateUUID(),
              userId: corperId,
              userName: lRow.corper_name || 'Corper Member',
              userStateCode: 'RV/26A/0000',
              userHouseStatus: 'Resident',
              userRoom: 'N/A',
              userTier: 1,
              monthKey: targetMonth,
              monthCode: mCode,
              year: yNum,
              monthName: mName,
              subscriptionType: lRow.subscription_type || 'combined',
              amountPaid: amount,
              expectedAmount: amount,
              approvedAmount: amount,
              fileName: lRow.receipt_url || 'verified_ledger_receipt.pdf',
              receiptUrl: lRow.receipt_url || undefined,
              submittedAt: lRow.created_at || new Date().toISOString(),
              status: 'approved',
              reviewedBy: 'Admin Force Clear / Ledger',
              reviewedAt: lRow.updated_at || lRow.created_at || new Date().toISOString(),
            };
            duesList.push(synthesizedSub);
          }
        }
      }

      setDuesSubmissions(duesList);
      setTravelRequests(travelList);
      setProfileRequests(profileList);
      setPendingRegistrations(regList);
      saveStoredPendingRegistrations(regList);
    } catch (err) {
      // Network exception fallback
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoadingRequests(false);
      return;
    }
    fetchInitialRequests();

    // 1. Revalidate on tab focus
    const handleFocus = () => {
      fetchInitialRequests();
    };
    window.addEventListener('focus', handleFocus);

    // 2. Periodic background polling fallback (every 60 seconds)
    const pollInterval = setInterval(() => {
      fetchInitialRequests();
    }, 60000);

    // 3. Establish Realtime channel subscriptions for approval_requests, dues_ledgers, and pending_registrations
    const channel = supabase
      .channel('realtime_requests_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approval_requests' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const row = payload.new;
          const reqType = row.request_type || row.request_category;
          if (reqType === 'dues_waiver' || reqType === 'dues_proof') {
            const item = mapRowToDuesSubmission(row);
            setDuesSubmissions((prev) => [item, ...prev.filter((d) => d.id !== item.id)]);
          } else if (reqType === 'travel_permit' || reqType === 'travel_exeat' || reqType === 'leave' || reqType === 'exemption') {
            const item = mapRowToTravelRequest(row);
            setTravelRequests((prev) => [item, ...prev.filter((t) => t.id !== item.id)]);
          } else if (reqType === 'profile_update' || reqType === 'room_change' || reqType === 'unit_change' || reqType === 'marital_status_change') {
            const item = mapRowToProfileRequest(row);
            setProfileRequests((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
          } else if (reqType === 'user_registration' || reqType === 'new_registration') {
            fetchInitialRequests();
          }
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setDuesSubmissions((prev) => prev.filter((d) => d.id !== deletedId));
          setTravelRequests((prev) => prev.filter((t) => t.id !== deletedId));
          setProfileRequests((prev) => prev.filter((p) => p.id !== deletedId));
          setPendingRegistrations((prev) => prev.filter((r) => r.id !== deletedId));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_registrations' }, () => {
        fetchInitialRequests();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dues_ledgers' }, () => {
        fetchInitialRequests();
      })
      .subscribe();

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollInterval);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  // Save to localStorage safely
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_DUES, JSON.stringify(duesSubmissions));
    } catch (e) {
      // Catch storage error
    }
  }, [duesSubmissions]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_TRAVEL, JSON.stringify(travelRequests));
    } catch (e) {
      // Catch storage error
    }
  }, [travelRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(profileRequests));
    } catch (e) {
      // Catch storage error
    }
  }, [profileRequests]);

  // Helper to sync user ledger when dues receipt is submitted/approved/rejected
  const syncUserLedgerStatus = (
    userId: string,
    monthKey: string,
    status: PaymentStatus,
    amountPaid: number,
    paymentType: PaymentType,
    txnId: string,
    fileName: string
  ) => {
    try {
      const stored = getStoredUserLedger({ id: userId } as any);
      const code = monthKey.split('-')[0].toUpperCase();

      // Find all approved/paid submissions for this user & this specific target month
      const userMonthSubmissions = duesSubmissions.filter((s) => {
        const isUser = s.userId === userId;
        const isMonth = s.monthKey === monthKey || s.monthCode === code;
        const isThisTxn = s.id === txnId;
        const effectiveStatus = isThisTxn
          ? (status === 'paid' ? 'approved' : status === 'unpaid' ? 'rejected' : s.status)
          : s.status;
        return isUser && isMonth && (effectiveStatus === 'approved' || effectiveStatus === 'modified_approved' || effectiveStatus === 'paid');
      });

      // Calculate cumulative sum for THIS month only using approved/modified amounts
      let cumulativePaidThisMonth = userMonthSubmissions.reduce((sum, s) => {
        const amt = s.id === txnId && status === 'paid'
          ? amountPaid
          : (s.approvedAmount !== undefined ? s.approvedAmount : s.amountPaid);
        return sum + (Number(amt) || 0);
      }, 0);

      // Only add amount if status is 'paid' (approved) and not already in userMonthSubmissions
      if (status === 'paid' && !userMonthSubmissions.some((s) => s.id === txnId)) {
        cumulativePaidThisMonth += Number(amountPaid) || 0;
      }

      const updated = stored.map((entry) => {
        if (entry.monthKey !== code) return entry;

        // Waterfall calculation for cumulative month amount
        const waterfall = calculateWaterfallDues(cumulativePaidThisMonth, { id: userId } as any);

        let finalStatus: PaymentStatus = 'unpaid';
        if (waterfall.paymentStatus === 'Fully Paid') {
          finalStatus = 'paid';
        } else if (waterfall.paymentStatus === 'Partially Paid' || waterfall.paymentStatus === 'Maint ONLY') {
          finalStatus = 'paid';
        } else if (status === 'pending' && cumulativePaidThisMonth === 0) {
          finalStatus = 'pending';
        } else {
          finalStatus = cumulativePaidThisMonth > 0 ? 'paid' : 'unpaid';
        }

        return {
          ...entry,
          status: finalStatus,
          maintenancePaid: waterfall.maintPaid,
          feedingPaid: waterfall.feedPaid,
          maintenanceTarget: waterfall.maintTarget,
          feedingTarget: waterfall.feedTarget,
          transactionId: txnId || entry.transactionId,
          receiptFileName: fileName || entry.receiptFileName,
          submittedAt: new Date().toLocaleString(),
          paymentType: (waterfall.paymentStatus === 'Maint ONLY' ? 'maintenance_only' : paymentType) as PaymentType,
        };
      });
      saveUserLedger(userId, updated);
    } catch (e) {
      console.error('Failed to sync user ledger', e);
    }
  };

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const isValidUUID = (str?: string | null): boolean => {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

  const addDuesSubmission = (sub: Omit<DuesReceiptSubmission, 'id' | 'submittedAt' | 'status'>): string => {
    const uuid = generateUUID();
    const humanRef = `TXN-${sub.year}-${sub.monthCode}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSubmission: DuesReceiptSubmission = {
      ...sub,
      id: uuid,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
    };

    setDuesSubmissions((prev) => [newSubmission, ...prev]);

    setTimeout(() => {
      syncUserLedgerStatus(
        sub.userId,
        sub.monthKey,
        'pending',
        sub.amountPaid,
        sub.subscriptionType,
        uuid,
        sub.fileName
      );
    }, 0);

    (async () => {
      try {
        let storageUrl = sub.fileDataUrl || '';
        if (sub.fileDataUrl || sub.fileName) {
          const uploadRes = await uploadFileToStorage(
            sub.fileDataUrl || sub.fileName,
            'receipts',
            `${uuid}_receipt.png`
          );
          if (uploadRes.publicUrl) {
            storageUrl = uploadRes.publicUrl;
          }
        }

        const { error: reqError } = await supabase.from('approval_requests').insert({
          id: uuid,
          corper_id: sub.userId,
          request_category: 'dues_proof',
          title: `Dues Payment Proof - ${sub.monthName} ${sub.year}`,
          status: 'pending',
          request_type: 'dues_waiver',
          payload: { ...newSubmission, transactionRef: humanRef, receiptUrl: storageUrl, attachment_url: storageUrl },
        });

        if (reqError) {
          console.warn('[Supabase RequestsContext] Error inserting dues submission:', reqError.message);
        } else if (isValidUUID(uuid)) {
          const { error: ledgerError } = await supabase.from('dues_ledgers').upsert({
            corper_id: sub.userId,
            request_id: uuid,
            title: `Dues Payment Proof - ${sub.monthName} ${sub.year}`,
            amount: sub.amountPaid,
            subscription_type: sub.subscriptionType,
            target_month: sub.monthKey,
            receipt_url: storageUrl || sub.fileName,
            status: 'unverified',
          });
          if (ledgerError) console.warn('[Supabase RequestsContext] Error upserting dues_ledger:', ledgerError.message);
        }
      } catch (err) {
        console.warn('[Supabase RequestsContext] Exception inserting dues submission:', err);
      }
    })();

    return humanRef;
  };

  const approveDuesSubmission = (id: string, reviewerName: string, overrideAmount?: number) => {
    setDuesSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const finalAmt = overrideAmount !== undefined ? overrideAmount : s.amountPaid;
        const isModified = overrideAmount !== undefined && overrideAmount !== s.amountPaid;

        setTimeout(() => {
          syncUserLedgerStatus(
            s.userId,
            s.monthKey,
            'paid',
            finalAmt,
            s.subscriptionType,
            s.id,
            s.fileName
          );
        }, 0);

        const updated = {
          ...s,
          status: (isModified ? 'modified_approved' : 'approved') as 'modified_approved' | 'approved',
          approvedAmount: finalAmt,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };

        (async () => {
          try {
            const { error } = await supabase
              .from('approval_requests')
              .update({
                status: 'approved',
                payload: {
                  ...updated,
                  modified_by_admin: isModified,
                },
                reviewer_notes: isModified ? `Modified approval by ${reviewerName} with amount ₦${finalAmt.toLocaleString()}` : undefined,
              })
              .eq('id', id);
            if (error) console.warn('[Supabase RequestsContext] Error approving dues submission:', error.message);
          } catch (err) {
            console.warn('[Supabase RequestsContext] Exception approving dues submission:', err);
          }
        })();

        (async () => {
          try {
            const { error } = await supabase.from('dues_ledgers').upsert({
              corper_id: s.userId,
              request_id: isValidUUID(s.id) ? s.id : null,
              title: `Dues Payment Proof - ${s.monthName} ${s.year}`,
              amount: finalAmt,
              subscription_type: s.subscriptionType,
              target_month: s.monthKey,
              receipt_url: s.fileName,
              status: 'verified',
            });
            if (error) console.warn('[Supabase RequestsContext] Error updating dues_ledger:', error.message);
          } catch (err) {
            console.warn('[Supabase RequestsContext] Exception updating dues_ledger:', err);
          }
        })();

        return updated;
      })
    );
  };

  const rejectDuesSubmission = (id: string, reviewerName: string, reason: string) => {
    setDuesSubmissions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;

        setTimeout(() => {
          syncUserLedgerStatus(
            s.userId,
            s.monthKey,
            'unpaid',
            0,
            s.subscriptionType,
            s.id,
            s.fileName
          );
        }, 0);

        const updated = {
          ...s,
          status: 'rejected' as const,
          rejectionReason: reason,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };

        (async () => {
          try {
            const { error } = await supabase
              .from('approval_requests')
              .update({
                status: 'rejected',
                payload: updated,
                reviewer_notes: reason,
              })
              .eq('id', id);
            if (error) console.warn('[Supabase RequestsContext] Error rejecting dues submission:', error.message);
          } catch (err) {
            console.warn('[Supabase RequestsContext] Exception rejecting dues submission:', err);
          }
        })();

        (async () => {
          try {
            const { error } = await supabase.from('dues_ledgers').upsert({
              corper_id: s.userId,
              request_id: isValidUUID(s.id) ? s.id : null,
              title: `Dues Payment Proof - ${s.monthName} ${s.year}`,
              amount: 0,
              subscription_type: s.subscriptionType,
              target_month: s.monthKey,
              receipt_url: s.fileName,
              status: 'rejected',
            });
            if (error) console.warn('[Supabase RequestsContext] Error updating dues_ledger:', error.message);
          } catch (err) {
            console.warn('[Supabase RequestsContext] Exception updating dues_ledger:', err);
          }
        })();

        return updated;
      })
    );
  };

  const addTravelRequest = (req: Omit<TravelRequestSubmission, 'id' | 'submittedAt' | 'status'>): string => {
    const uuid = generateUUID();
    const humanRef = `TR-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newRequest: TravelRequestSubmission = {
      ...req,
      id: uuid,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
    };

    setTravelRequests((prev) => [newRequest, ...prev]);

    (async () => {
      try {
        let storageUrl = req.letterFileDataUrl || '';
        if (req.letterFileDataUrl || req.letterFileName) {
          const uploadRes = await uploadFileToStorage(
            req.letterFileDataUrl || req.letterFileName,
            'letters',
            `${uuid}_letter.png`
          );
          if (uploadRes.publicUrl) {
            storageUrl = uploadRes.publicUrl;
          }
        }

        const { error } = await supabase.from('approval_requests').insert({
          id: uuid,
          corper_id: req.userId,
          request_category: 'travel_exeat',
          title: req.reason || 'Travel Exeat Permit',
          status: 'pending',
          request_type: 'travel_permit',
          payload: { ...newRequest, transactionRef: humanRef, supportingLetterUrl: storageUrl, attachment_url: storageUrl },
        });
        if (error) console.warn('[Supabase RequestsContext] Error inserting travel request:', error.message);
      } catch (err) {
        console.warn('[Supabase RequestsContext] Exception inserting travel request:', err);
      }
    })();

    return humanRef;
  };

  const approveTravelRequest = (
    id: string,
    reviewerName: string,
    overrideDeptDate?: string,
    overrideRetDate?: string,
    updateUserProfile?: (userId: string, updates: any) => void
  ) => {
    setTravelRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const finalDept = overrideDeptDate || r.departureDate;
        const finalRet = overrideRetDate || r.returnDate;
        const isModified =
          (overrideDeptDate && overrideDeptDate !== r.departureDate) ||
          (overrideRetDate && overrideRetDate !== r.returnDate);

        // Presence logic: Check if currentDate >= departureDate. If TRUE -> 'Travelled', otherwise -> 'Present'
        const todayStr = new Date().toISOString().split('T')[0];
        const newPresence = todayStr >= finalDept ? 'Travelled' : 'Present';

        if (updateUserProfile) {
          setTimeout(() => {
            updateUserProfile(r.userId, { presence: newPresence });
          }, 0);
        }

        const updated = {
          ...r,
          status: (isModified ? 'modified_approved' : 'approved') as 'modified_approved' | 'approved',
          approvedDepartureDate: finalDept,
          approvedReturnDate: finalRet,
          departureDate: finalDept,
          returnDate: finalRet,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };

        (async () => {
          try {
            const { error } = await supabase
              .from('approval_requests')
              .update({
                status: 'approved',
                payload: {
                  ...updated,
                  modified_by_admin: isModified,
                },
                reviewer_notes: isModified ? `Modified travel dates by ${reviewerName}: Dept=${finalDept}, Ret=${finalRet}` : undefined,
              })
              .eq('id', id);
            if (error) console.warn('[Supabase RequestsContext] Error approving travel request:', error.message);
          } catch (err) {
            console.warn('[Supabase RequestsContext] Exception approving travel request:', err);
          }
        })();

        (async () => {
          try {
            const { error } = await supabase
              .from('corpers')
              .update({ presence: newPresence })
              .eq('id', r.userId);
            if (error) console.warn('[Supabase RequestsContext] Error updating corper presence on travel approval:', error.message);
          } catch (err) {
            console.warn('[Supabase RequestsContext] Exception updating corper presence on travel approval:', err);
          }
        })();

        return updated;
      })
    );
  };

  const rejectTravelRequest = (id: string, reviewerName: string, reason: string) => {
    setTravelRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        const updated = {
          ...r,
          status: 'rejected' as const,
          rejectionReason: reason,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };

        (async () => {
          try {
            const { error } = await supabase
              .from('approval_requests')
              .update({
                status: 'rejected',
                payload: updated,
                reviewer_notes: reason,
              })
              .eq('id', id);
            if (error) console.warn('[Supabase RequestsContext] Error rejecting travel request:', error.message);
          } catch (err) {
            console.warn('[Supabase RequestsContext] Exception rejecting travel request:', err);
          }
        })();

        return updated;
      })
    );
  };

  const addProfileRequest = (req: Omit<ProfileChangeRequestSubmission, 'id' | 'submittedAt' | 'status'>): string => {
    const uuid = generateUUID();
    const humanRef = `PR-2026-${Math.floor(500 + Math.random() * 500)}`;
    const requestCategory =
      req.changeType === 'room_name'
        ? 'room_change'
        : req.changeType === 'service_units'
        ? 'unit_change'
        : 'marital_status_change';

    const newRequest: ProfileChangeRequestSubmission = {
      ...req,
      id: uuid,
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending',
    };

    setProfileRequests((prev) => [newRequest, ...prev]);

    (async () => {
      try {
        const { error } = await supabase.from('approval_requests').insert({
          id: uuid,
          corper_id: req.userId,
          request_category: requestCategory,
          title: req.deltaPayload || 'Profile Delta Request',
          status: 'pending',
          request_type: 'profile_update',
          payload: { ...newRequest, transactionRef: humanRef },
        });
        if (error) console.warn('[Supabase RequestsContext] Error inserting profile request:', error.message);
      } catch (err) {
        console.warn('[Supabase RequestsContext] Exception inserting profile request:', err);
      }
    })();

    return humanRef;
  };

  const approveProfileRequest = (
    id: string,
    reviewerName: string,
    updateUserProfile: (userId: string, updates: any) => void
  ) => {
    setProfileRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        const updates: any = {};
        if (r.roomChange) {
          updates.roomName = r.roomChange.newVal;
        }
        if (r.unitChange) {
          updates.serviceUnit = r.unitChange.newVal;
        }
        if (r.maritalChange) {
          updates.maritalStatus = r.maritalChange.newVal;
        }

        setTimeout(() => {
          updateUserProfile(r.userId, updates);
        }, 0);

        const updated = {
          ...r,
          status: 'approved' as const,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };

        (async () => {
          try {
            const { error } = await supabase
              .from('approval_requests')
              .update({
                status: 'approved',
                payload: updated,
              })
              .eq('id', id);
            if (error) console.warn('[Supabase RequestsContext] Error approving profile request:', error.message);
          } catch (err) {
            console.warn('[Supabase RequestsContext] Exception approving profile request:', err);
          }
        })();

        return updated;
      })
    );
  };

  const rejectProfileRequest = (id: string, reviewerName: string, reason: string) => {
    setProfileRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;

        const updated = {
          ...r,
          status: 'rejected' as const,
          rejectionReason: reason,
          reviewedBy: reviewerName,
          reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        };

        (async () => {
          try {
            const { error } = await supabase
              .from('approval_requests')
              .update({
                status: 'rejected',
                payload: updated,
                reviewer_notes: reason,
              })
              .eq('id', id);
            if (error) console.warn('[Supabase RequestsContext] Error rejecting profile request:', error.message);
          } catch (err) {
            console.warn('[Supabase RequestsContext] Exception rejecting profile request:', err);
          }
        })();

        return updated;
      })
    );
  };

  const submitTravelPermit = addTravelRequest;

  const approveRequest = (id: string, type: 'dues' | 'travel' | 'profile', reviewerName: string, extra?: any) => {
    if (type === 'dues') approveDuesSubmission(id, reviewerName, extra);
    else if (type === 'travel') approveTravelRequest(id, reviewerName, extra?.deptDate, extra?.retDate, extra?.updateUserProfile);
    else if (type === 'profile') approveProfileRequest(id, reviewerName, extra?.updateUserProfile);
  };

  const rejectRequest = (id: string, type: 'dues' | 'travel' | 'profile', reviewerName: string, reason: string) => {
    if (type === 'dues') rejectDuesSubmission(id, reviewerName, reason);
    else if (type === 'travel') rejectTravelRequest(id, reviewerName, reason);
    else if (type === 'profile') rejectProfileRequest(id, reviewerName, reason);
  };

  const publishNotice = (noticeData: any): string => {
    const randomId = `ANC-2026-${Math.floor(100 + Math.random() * 900)}`;
    (async () => {
      try {
        const { error } = await supabase.from('announcements').insert({
          id: randomId,
          title: noticeData.title || 'Notice',
          description: noticeData.description || '',
          flyer_url: noticeData.flyerUrl || null,
          flyer_image_url: noticeData.flyerUrl || null,
          venue: noticeData.venue || '',
          event_date: noticeData.eventDate || '',
          expires_at: noticeData.expirationDate || '2026-12-31',
          auto_expiration_date: noticeData.expirationDate || '2026-12-31',
          author_tag: noticeData.authorName || 'Tripartite Council',
          author_name: noticeData.authorName || 'Tripartite Council',
        });
        if (error) console.warn('[Supabase RequestsContext] Error publishing notice:', error.message);
      } catch (err) {
        console.warn('[Supabase RequestsContext] Exception publishing notice:', err);
      }
    })();
    return randomId;
  };

  const forceClearUserDues = async (user: CorperProfile, justification: string) => {
    const userId = user.id;
    const maintTarget = user?.targets?.maintenance ?? 15000;
    const feedTarget = getFeedingTarget(user);
    const targetAmount = maintTarget + feedTarget;
    const { monthKey: targetMonthKey, monthCode: targetMonthCode, monthName: activeMonthName, year: activeYear, activeMonthLabel } = getCurrentActiveLedgerMonth();

    const overrideUuid = generateUUID();

    const overrideSub: DuesReceiptSubmission = {
      id: overrideUuid,
      userId,
      userName: user.displayName || `${user.firstName} ${user.lastName}`,
      userStateCode: user.stateCode,
      userAvatar: user.avatarUrl,
      userHouseStatus: user.houseStatus,
      userRoom: user.roomName || 'N/A',
      userTier: user.tier || 1,
      monthKey: targetMonthKey,
      monthCode: targetMonthCode,
      year: activeYear,
      monthName: activeMonthName,
      subscriptionType: 'combined',
      amountPaid: targetAmount,
      expectedAmount: targetAmount,
      approvedAmount: targetAmount,
      fileName: 'admin_force_clear.pdf',
      receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=300',
      submittedAt: new Date().toISOString(),
      status: 'approved',
      reviewedBy: 'Admin Override (Force Clear)',
      reviewedAt: new Date().toISOString(),
    };

    setDuesSubmissions((prev) => [
      overrideSub,
      ...prev.filter(
        (s) => !(s.userId === userId && (s.monthKey?.toUpperCase() === targetMonthKey.toUpperCase() || s.monthCode?.toUpperCase() === targetMonthCode.toUpperCase()))
      ),
    ]);

    const currentEntries = getStoredUserLedger(user);
    const updatedLedger = currentEntries.map((e) => {
      const isActiveMonth = e.year === activeYear && (e.monthKey === targetMonthCode || e.monthName === activeMonthName);
      if (!isActiveMonth) return e;
      return {
        ...e,
        status: 'paid' as PaymentStatus,
        maintenancePaid: e.maintenanceTarget,
        feedingPaid: e.feedingTarget,
        submittedAt: `Overridden on ${new Date().toISOString().split('T')[0]} - Reason: ${justification}`,
        transactionId: overrideSub.id,
      };
    });
    saveUserLedger(userId, updatedLedger);

    if (supabase) {
      try {
        // 1. Delete prior dues_ledgers entries for this user and month to prevent conflict
        await supabase
          .from('dues_ledgers')
          .delete()
          .eq('corper_id', userId)
          .or(`target_month.ilike.${targetMonthKey},target_month.ilike.${targetMonthCode}`);

        // 2. Upsert approved approval request
        await supabase.from('approval_requests').upsert({
          id: overrideUuid,
          corper_id: userId,
          request_category: 'dues_proof',
          title: `Admin Override: Force Clear - ${activeMonthLabel}`,
          request_type: 'dues_waiver',
          status: 'approved',
          payload: overrideSub,
        });

        // 3. Insert verified ledger row
        await supabase.from('dues_ledgers').insert({
          id: generateUUID(),
          corper_id: userId,
          request_id: overrideUuid,
          title: `Admin Override: Force Clear - ${activeMonthLabel}`,
          amount: targetAmount,
          subscription_type: 'combined',
          target_month: targetMonthKey,
          receipt_url: overrideSub.receiptUrl,
          status: 'verified',
        });
      } catch (err) {
        console.warn('[Supabase RequestsContext] Error force clearing dues:', err);
      }
    }
  };

  const resetUserDues = async (user: CorperProfile, justification: string) => {
    const userId = user.id;
    const { monthKey: targetMonthKey, monthCode: targetMonthCode, monthName: activeMonthName, year: activeYear, activeMonthLabel } = getCurrentActiveLedgerMonth();

    // 1. Update dues submissions in local state
    setDuesSubmissions((prev) =>
      prev.map((s) => {
        const isUser = s.userId === userId;
        const isMonth = s.monthKey?.toUpperCase() === targetMonthKey.toUpperCase() || s.monthCode?.toUpperCase() === targetMonthCode.toUpperCase();
        if (isUser && isMonth) {
          return {
            ...s,
            status: 'rejected' as const,
            approvedAmount: 0,
            rejectionReason: justification,
            reviewedBy: 'Admin Override (Reset)',
            reviewedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    // 2. Clear local storage ledger override
    const currentEntries = getStoredUserLedger(user);
    const updatedLedger = currentEntries.map((e) => {
      const isActiveMonth = e.year === activeYear && (e.monthKey === targetMonthCode || e.monthName === activeMonthName);
      if (!isActiveMonth) return e;
      return {
        ...e,
        status: 'unpaid' as PaymentStatus,
        maintenancePaid: 0,
        feedingPaid: 0,
        transactionId: undefined,
        receiptFileName: undefined,
        submittedAt: undefined,
      };
    });
    saveUserLedger(userId, updatedLedger);

    // 3. Clean up backend records in Supabase
    if (supabase) {
      try {
        // Delete all dues_ledgers for this user and month
        await supabase
          .from('dues_ledgers')
          .delete()
          .eq('corper_id', userId)
          .or(`target_month.ilike.${targetMonthKey},target_month.ilike.${targetMonthCode}`);

        // Insert a reset entry in dues_ledgers so background fetch knows status is reset/unpaid
        await supabase.from('dues_ledgers').insert({
          id: generateUUID(),
          corper_id: userId,
          request_id: generateUUID(),
          title: `Admin Override: Reset Standing - ${activeMonthLabel}`,
          amount: 0,
          subscription_type: 'combined',
          target_month: targetMonthKey,
          status: 'rejected',
        });

        // Update any existing approval requests for this corper
        const { data: existingRequests } = await supabase
          .from('approval_requests')
          .select('*')
          .eq('corper_id', userId);

        if (existingRequests && existingRequests.length > 0) {
          for (const req of existingRequests) {
            const p = req.payload || {};
            const pMonthKey = (p.monthKey || '').toUpperCase();
            const pMonthCode = (p.monthCode || '').toUpperCase();
            const isTargetMonth = pMonthKey === targetMonthKey.toUpperCase() || pMonthCode === targetMonthCode.toUpperCase();
            const isDues = req.request_category === 'dues_proof' || req.request_type === 'dues_waiver';

            if (isDues && isTargetMonth) {
              await supabase
                .from('approval_requests')
                .update({
                  status: 'rejected',
                  payload: { ...p, status: 'rejected', approvedAmount: 0, rejectionReason: justification },
                })
                .eq('id', req.id);
            }
          }
        }
      } catch (err) {
        console.warn('[Supabase RequestsContext] Error resetting dues:', err);
      }
    }
  };

  const approveRegistration = async (
    id: string,
    reviewerName: string,
    addCorperUser?: (data: any) => any
  ): Promise<{ success: boolean; error?: string }> => {
    const targetReg = pendingRegistrations.find((r) => r.id === id);
    if (!targetReg) return { success: false, error: 'Registration request not found' };

    const resolvedAt = new Date().toISOString();
    const targetStateCode = (targetReg.stateCode || (targetReg as any).state_code || '').trim();
    const targetEmail = (targetReg.email || '').trim().toLowerCase();

    // 1. Remove from pendingRegistrations state immediately
    setPendingRegistrations((prev) =>
      prev.filter((r) => r.id !== id && (!targetStateCode || (r.stateCode !== targetStateCode && (r as any).state_code !== targetStateCode)))
    );

    // 2. Remove from local storage cache
    const currentLocal = getStoredPendingRegistrations();
    const updatedLocal = currentLocal.filter(
      (p) =>
        p.id !== id &&
        (!targetStateCode || (p.state_code !== targetStateCode && p.stateCode !== targetStateCode)) &&
        (!targetEmail || p.email?.toLowerCase() !== targetEmail)
    );
    saveStoredPendingRegistrations(updatedLocal);

    // 3. Add to active Corper Roster via AuthContext if provided with all 19 fields
    if (addCorperUser) {
      const sUnits = Array.isArray(targetReg.serviceUnits)
        ? targetReg.serviceUnits
        : Array.isArray((targetReg as any).service_units)
        ? (targetReg as any).service_units
        : [];

      await addCorperUser({
        id: targetReg.id,
        userId: targetReg.id,
        firstName: targetReg.firstName || (targetReg as any).first_name || '',
        middleName: targetReg.middleName || (targetReg as any).middle_name || undefined,
        lastName: targetReg.lastName || (targetReg as any).last_name || '',
        name: targetReg.fullName || `${targetReg.firstName || (targetReg as any).first_name || ''} ${targetReg.lastName || (targetReg as any).last_name || ''}`.trim(),
        stateCode: targetStateCode,
        email: targetEmail,
        phone: targetReg.phone || (targetReg as any).phoneNumber || (targetReg as any).phone_number || '',
        gender: targetReg.gender || 'Male',
        dateOfBirth: targetReg.dateOfBirth || (targetReg as any).date_of_birth || '',
        stateOfOrigin: targetReg.stateOfOrigin || (targetReg as any).state_of_origin || '',
        courseOfStudy: targetReg.courseOfStudy || (targetReg as any).course_of_study || '',
        schoolGraduatedFrom: targetReg.schoolGraduatedFrom || (targetReg as any).school_graduated_from || (targetReg as any).institution || '',
        maritalStatus: targetReg.maritalStatus || (targetReg as any).marital_status || 'Not Engaged',
        nextOfKinName: targetReg.nextOfKinName || (targetReg as any).next_of_kin_name || undefined,
        nextOfKinPhone: targetReg.nextOfKinPhone || (targetReg as any).next_of_kin_phone || undefined,
        houseStatus: targetReg.houseStatus || (targetReg as any).house_status || 'Member',
        executivePost: targetReg.executivePost || (targetReg as any).executive_post || undefined,
        roomName: targetReg.roomName || (targetReg as any).room_name || 'Timothy',
        serviceUnit: sUnits.join(', '),
        serviceUnits: sUnits,
        presence: targetReg.presence || 'Present',
        avatarUrl: targetReg.avatarUrl || (targetReg as any).avatar_url || undefined,
      });
    }

    // 4. Sync to Google Sheets Webhook in background
    syncApprovedCorperToGoogleSheet(targetReg);

    // 5. Update pending_registrations status to 'approved' and record reviewer audit metadata
    if (supabase) {
      try {
        if (id) {
          await supabase
            .from('pending_registrations')
            .update({
              status: 'approved',
              reviewed_by: reviewerName,
              resolved_at: resolvedAt,
              updated_at: resolvedAt,
            })
            .eq('id', id);
        }
        if (targetStateCode) {
          await supabase
            .from('pending_registrations')
            .update({
              status: 'approved',
              reviewed_by: reviewerName,
              resolved_at: resolvedAt,
              updated_at: resolvedAt,
            })
            .ilike('state_code', targetStateCode);
        }

        // Update approval_requests log if stored there
        if (id) {
          await supabase
            .from('approval_requests')
            .update({
              status: 'approved',
              reviewed_by: reviewerName,
              resolved_at: resolvedAt,
              updated_at: resolvedAt,
            })
            .eq('id', id);
        }

        if (targetStateCode) {
          await supabase
            .from('approval_requests')
            .update({
              status: 'approved',
              reviewed_by: reviewerName,
              resolved_at: resolvedAt,
              updated_at: resolvedAt,
            })
            .ilike('title', `%${targetStateCode}%`);
        }
      } catch (err) {
        console.warn('[RequestsContext] Backend update for registration approval:', err);
      }
    }

    return { success: true };
  };

  const rejectRegistration = async (
    id: string,
    reviewerName: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> => {
    const targetReg = pendingRegistrations.find((r) => r.id === id);
    if (!targetReg) return { success: false, error: 'Registration request not found' };

    const resolvedAt = new Date().toISOString();
    const targetStateCode = (targetReg.stateCode || (targetReg as any).state_code || '').trim();

    setPendingRegistrations((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'rejected' as const,
              reviewedBy: reviewerName,
              reviewedAt: resolvedAt,
              rejectionReason: reason,
            }
          : r
      )
    );

    if (supabase) {
      try {
        if (id) {
          await supabase
            .from('pending_registrations')
            .update({
              status: 'rejected',
              reviewed_by: reviewerName,
              resolved_at: resolvedAt,
              rejection_reason: reason,
              updated_at: resolvedAt,
            })
            .eq('id', id);
        }

        if (targetStateCode) {
          await supabase
            .from('pending_registrations')
            .update({
              status: 'rejected',
              reviewed_by: reviewerName,
              resolved_at: resolvedAt,
              rejection_reason: reason,
              updated_at: resolvedAt,
            })
            .ilike('state_code', targetStateCode);
        }

        // Delete from pending table or update approval_requests
        if (id) {
          await supabase
            .from('approval_requests')
            .update({
              status: 'rejected',
              reviewed_by: reviewerName,
              resolved_at: resolvedAt,
              reviewer_notes: reason,
              updated_at: resolvedAt,
            })
            .eq('id', id);
        }

        if (targetStateCode) {
          await supabase
            .from('approval_requests')
            .update({
              status: 'rejected',
              reviewed_by: reviewerName,
              resolved_at: resolvedAt,
              reviewer_notes: reason,
              updated_at: resolvedAt,
            })
            .ilike('title', `%${targetStateCode}%`);
        }
      } catch (err) {
        console.warn('[RequestsContext] Backend update for registration rejection:', err);
      }
    }

    return { success: true };
  };

  return (
    <RequestsContext.Provider
      value={{
        duesSubmissions,
        travelRequests,
        profileRequests,
        pendingRegistrations,
        isLoadingRequests,
        addDuesSubmission,
        approveDuesSubmission,
        rejectDuesSubmission,
        addTravelRequest,
        approveTravelRequest,
        rejectTravelRequest,
        addProfileRequest,
        approveProfileRequest,
        rejectProfileRequest,
        approveRegistration,
        rejectRegistration,
        submitTravelPermit,
        approveRequest,
        rejectRequest,
        publishNotice,
        forceClearUserDues,
        resetUserDues,
        refetchRequests: fetchInitialRequests,
      }}
    >
      {children}
    </RequestsContext.Provider>
  );
};

export const useRequests = (): RequestsContextType => {
  const context = useContext(RequestsContext);
  if (!context) {
    throw new Error('useRequests must be used within a RequestsProvider');
  }
  return context;
};

