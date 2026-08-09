import { Corper } from './corper';

export type PaymentStatus = 'paid' | 'pending' | 'unpaid' | 'upcoming';
export type PaymentType = 'maintenance' | 'feeding' | 'combined';

export interface MonthLedgerEntry {
  monthKey: string; // 'JAN', 'FEB', etc.
  monthName: string; // 'January', 'February', etc.
  monthIndex: number; // 0 to 11
  year: number; // 2026, 2027, etc.
  status: PaymentStatus;
  maintenancePaid: number;
  maintenanceTarget: number;
  feedingPaid: number;
  feedingTarget: number;
  transactionId?: string;
  receiptUrl?: string;
  receiptFileName?: string;
  submittedAt?: string;
  paymentType?: PaymentType;
  reviewNotes?: string;
}

export interface UserLedgerState {
  userId: string;
  entries: MonthLedgerEntry[];
}

export type RequestCategory = 
  | 'dues_proof' 
  | 'travel_exeat' 
  | 'room_change' 
  | 'unit_change' 
  | 'marital_status_change';

export type RequestStatus = 'pending' | 'approved' | 'rejected';

// Structured payload typing for approval requests
export interface DuesProofPayload {
  subscription_type: 'Full Assessment' | 'Maintenance ONLY';
  target_month: string; // e.g. "2026-08"
  amount: number;
  receipt_url: string;
}

export interface TravelExeatPayload {
  departure_date: string;
  return_date: string;
  short_travel_reason: string;
  explanation?: string;
  contact_during_absence: string;
  supporting_letter_url: string;
}

export interface RoomChangePayload {
  requested_room: string;
}

export interface UnitChangePayload {
  requested_units: string[];
}

export interface MaritalStatusChangePayload {
  requested_status: 'Engaged' | 'Not Engaged';
}

export type RequestPayload = 
  | DuesProofPayload 
  | TravelExeatPayload 
  | RoomChangePayload 
  | UnitChangePayload 
  | MaritalStatusChangePayload;

export interface ApprovalRequest {
  id: string;
  corper_id: string;
  request_category: RequestCategory;
  title: string;
  payload: RequestPayload;
  status: RequestStatus;
  reviewer_notes?: string | null;
  reviewed_by?: string | null;
  created_at?: string;
  updated_at?: string;
  corper?: Corper;
}

export interface DuesLedger {
  id: string;
  corper_id: string;
  request_id?: string | null;
  title: string;
  amount: number;
  subscription_type: string;
  target_month: string;
  receipt_url: string;
  status: 'unverified' | 'verified' | 'rejected';
  verified_by?: string | null;
  created_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description?: string | null;
  flyer_url?: string | null;
  venue?: string | null;
  event_date?: string | null;
  expires_at: string;
  author_id?: string | null;
  pin_to_top: boolean;
  created_at?: string;
}