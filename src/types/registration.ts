import React from 'react';
import { supabase } from '../lib/supabase';
import {
  Gender,
  MaritalStatus,
  HouseStatus,
  ExecutivePost,
  RoomName,
  ServiceUnit,
  MALE_ROOMS,
  FEMALE_ROOMS,
  ALL_EXECUTIVE_POSTS,
  NIGERIAN_STATES,
  ALL_SERVICE_UNITS,
} from '../types/corper';

export interface PendingRegistration {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  state_code: string;
  email: string;
  phone_number: string;
  gender: Gender;
  date_of_birth: string; // YYYY-MM-DD
  state_of_origin: string;
  course_of_study: string;
  school_graduated_from: string;
  marital_status: MaritalStatus;
  next_of_kin_name: string;
  next_of_kin_phone: string;
  house_status: HouseStatus;
  executive_post?: ExecutivePost | string | null;
  room_name: RoomName | string;
  service_units: ServiceUnit[] | string[];
  presence: string;
  avatar_url?: string | null;
  password_hash?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  created_at: string;

  // Convenience aliases for frontend UI components
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  fullName?: string;
  stateCode?: string;
  phone?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  stateOfOrigin?: string;
  courseOfStudy?: string;
  schoolGraduatedFrom?: string;
  maritalStatus?: MaritalStatus;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  houseStatus?: HouseStatus;
  executivePost?: string | null;
  roomName?: string;
  serviceUnits?: string[];
  avatarUrl?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
}

export interface RegistrationFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  stateCode: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  gender: Gender;
  dateOfBirth: string; // YYYY-MM-DD
  stateOfOrigin: string;
  courseOfStudy: string;
  schoolGraduatedFrom: string;
  maritalStatus: MaritalStatus;
  nextOfKinName: string;
  nextOfKinPhone: string;
  houseStatus: HouseStatus;
  executivePost: string;
  roomName: string;
  serviceUnits: string[];
  presence: string;
  avatarUrl?: string;
}

export const INITIAL_REGISTRATION_FORM: RegistrationFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  stateCode: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  gender: 'Male',
  dateOfBirth: '',
  stateOfOrigin: 'Rivers',
  courseOfStudy: '',
  schoolGraduatedFrom: '',
  maritalStatus: 'Not Engaged',
  nextOfKinName: '',
  nextOfKinPhone: '',
  houseStatus: 'Member',
  executivePost: '',
  roomName: 'David',
  serviceUnits: [],
  presence: 'Present',
  avatarUrl: '',
};

// Fallback in-memory / local storage key for pending registrations
const LOCAL_STORAGE_PENDING_REGISTRATIONS = 'nccf_rivers_pending_registrations_v1';

export function getStoredPendingRegistrations(): PendingRegistration[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PENDING_REGISTRATIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[RegistrationService] Failed to read local storage pending registrations:', e);
  }
  return [];
}

export function saveStoredPendingRegistrations(items: PendingRegistration[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_PENDING_REGISTRATIONS, JSON.stringify(items));
  } catch (e) {
    console.warn('[RegistrationService] Failed to write local storage pending registrations:', e);
  }
}

/**
 * Sanitize all string fields by stripping leading/trailing whitespaces.
 */
export function sanitizeRegistrationData(data: RegistrationFormData): RegistrationFormData {
  return {
    ...data,
    firstName: data.firstName.trim(),
    middleName: data.middleName.trim(),
    lastName: data.lastName.trim(),
    stateCode: data.stateCode.trim().toUpperCase(),
    email: data.email.trim().toLowerCase(),
    phoneNumber: data.phoneNumber.trim(),
    courseOfStudy: data.courseOfStudy.trim(),
    schoolGraduatedFrom: data.schoolGraduatedFrom.trim(),
    nextOfKinName: data.nextOfKinName.trim(),
    nextOfKinPhone: data.nextOfKinPhone.trim(),
    executivePost: data.executivePost.trim(),
    roomName: data.roomName.trim(),
    serviceUnits: data.serviceUnits.map((u) => u.trim()).filter(Boolean),
  };
}

/**
 * Validates registration data per step
 */
export function validateRegistrationStep(step: number, data: RegistrationFormData): { isValid: boolean; error?: string } {
  if (step === 1) {
    if (!data.firstName.trim()) return { isValid: false, error: 'First Name is required.' };
    if (!data.lastName.trim()) return { isValid: false, error: 'Last Name (Surname) is required.' };
    if (!data.stateCode.trim()) return { isValid: false, error: 'State Code is required.' };
    const sc = data.stateCode.trim().toUpperCase();
    if (!/^[A-Z]{2}\/\d{2}[A-C]\/\d{4}$/.test(sc)) {
      return { isValid: false, error: 'Please enter a valid NYSC State Code format: 2 Letters / 2 Digits + Batch (A–C) / 4 Digits (e.g. RV/26A/1234, LA/25B/0088).' };
    }
    if (!data.email.trim()) return { isValid: false, error: 'Email Address is required.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      return { isValid: false, error: 'Please enter a valid Email Address.' };
    }
    if (!data.phoneNumber.trim()) return { isValid: false, error: 'Phone Number is required.' };
    if (!data.password) return { isValid: false, error: 'Password is required.' };
    if (data.password.length < 6) return { isValid: false, error: 'Password must be at least 6 characters long.' };
    if (data.password !== data.confirmPassword) return { isValid: false, error: 'Passwords do not match.' };
  }

  if (step === 2) {
    if (!data.dateOfBirth || !data.dateOfBirth.trim()) return { isValid: false, error: 'Date of Birth is required.' };
    const birthDate = new Date(data.dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return { isValid: false, error: 'Please enter a valid Date of Birth.' };
    }
    if (!data.stateOfOrigin) return { isValid: false, error: 'State of Origin is required.' };
    if (!data.courseOfStudy.trim()) return { isValid: false, error: 'Course of Study is required.' };
    if (!data.schoolGraduatedFrom.trim()) return { isValid: false, error: 'School Graduated From is required.' };
    if (!data.nextOfKinName.trim()) return { isValid: false, error: 'Next of Kin Name is required.' };
    if (!data.nextOfKinPhone.trim()) return { isValid: false, error: 'Next of Kin Phone is required.' };
  }

  if (step === 3) {
    if (!data.roomName) return { isValid: false, error: 'Room Name is required.' };
    if ((data.houseStatus === 'Executive' || data.houseStatus === 'Gee') && !data.executivePost) {
      return { isValid: false, error: 'Please select the Executive Post (or Post Held).' };
    }
  }

  return { isValid: true };
}
