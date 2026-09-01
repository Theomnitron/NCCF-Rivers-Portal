import { supabase } from '../lib/supabase';
import { PendingRegistration, RegistrationFormData, sanitizeRegistrationData, getStoredPendingRegistrations, saveStoredPendingRegistrations } from '../types/registration';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Submits a new member registration to the `pending_registrations` table in Supabase.
 * Pre-provisions the user in Supabase Auth (with salted/hashed password), immediately clears
 * any client session, and places the profile in pending_registrations awaiting Management review.
 */
export async function submitMemberRegistration(formData: RegistrationFormData): Promise<{ success: boolean; id?: string; error?: string }> {
  const sanitized = sanitizeRegistrationData(formData);
  let id = generateUUID();

  // 1. Pre-check if state_code or email is already registered in active corpers table
  if (supabase) {
    try {
      const { data: existingActive } = await supabase
        .from('corpers')
        .select('id, state_code, email')
        .or(`state_code.ilike.${sanitized.stateCode},email.ilike.${sanitized.email}`)
        .maybeSingle();

      if (existingActive) {
        return {
          success: false,
          error: 'An active account with this State Code or Email Address already exists in the portal. Please sign in instead.',
        };
      }

      // Check if already in pending_registrations
      const { data: existingPending } = await supabase
        .from('pending_registrations')
        .select('id, state_code, email, status')
        .or(`state_code.ilike.${sanitized.stateCode},email.ilike.${sanitized.email}`)
        .maybeSingle();

      if (existingPending && existingPending.status === 'pending') {
        return {
          success: false,
          error: 'A registration application with this State Code or Email Address has already been submitted and is currently awaiting review by Management.',
        };
      }
    } catch (checkErr) {
      console.warn('[RegistrationService] Pre-check notice:', checkErr);
    }
  }

  // Check local storage cache for existing pending registrations
  const localList = getStoredPendingRegistrations();
  const existingLocalPending = localList.find(
    (p) =>
      (p.status === 'pending') &&
      ((p.state_code && p.state_code.toUpperCase() === sanitized.stateCode.toUpperCase()) ||
       (p.stateCode && p.stateCode.toUpperCase() === sanitized.stateCode.toUpperCase()) ||
       (p.email && p.email.toLowerCase() === sanitized.email.toLowerCase()))
  );
  if (existingLocalPending) {
    return {
      success: false,
      error: 'A registration application with this State Code or Email Address has already been submitted and is currently awaiting review by Management.',
    };
  }

  // 2. Pre-create account in Supabase Auth using native Bcrypt hashing (zero plaintext password storage)
  if (supabase && sanitized.password) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: sanitized.email,
        password: sanitized.password,
        options: {
          data: {
            first_name: sanitized.firstName,
            middle_name: sanitized.middleName || '',
            last_name: sanitized.lastName,
            state_code: sanitized.stateCode,
            phone_number: sanitized.phoneNumber,
          },
        },
      });

      // Handle duplicate user in Supabase Auth
      if (authError) {
        const msg = (authError.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('user already exists') || msg.includes('email address has already been registered') || (authError as any).status === 422) {
          return {
            success: false,
            error: 'An account with this email address already exists in the system. Please sign in or use the Claim Account option.',
          };
        }
        console.warn('[RegistrationService] Supabase signUp notice:', authError);
      }

      // Supabase returns identities: [] if the user already exists in auth.users
      if (authData?.user && Array.isArray(authData.user.identities) && authData.user.identities.length === 0) {
        return {
          success: false,
          error: 'An account with this email address is already registered in the system. Please sign in with your email and password.',
        };
      }

      if (authData?.user?.id) {
        id = authData.user.id;
      }

      // CRITICAL: Immediately clear client session if Supabase auto-logged in the new signup.
      // This ensures the applicant stays logged out on the landing page until admission approval!
      try {
        await supabase.auth.signOut();
      } catch (signOutErr) {
        // ignore
      }
    } catch (authException) {
      console.warn('[RegistrationService] Auth pre-creation error:', authException);
    }
  }

  const payload: PendingRegistration = {
    id,
    first_name: sanitized.firstName,
    middle_name: sanitized.middleName || null,
    last_name: sanitized.lastName,
    state_code: sanitized.stateCode,
    email: sanitized.email,
    phone_number: sanitized.phoneNumber,
    gender: sanitized.gender,
    date_of_birth: sanitized.dateOfBirth,
    state_of_origin: sanitized.stateOfOrigin,
    course_of_study: sanitized.courseOfStudy,
    school_graduated_from: sanitized.schoolGraduatedFrom,
    marital_status: sanitized.maritalStatus,
    next_of_kin_name: sanitized.nextOfKinName,
    next_of_kin_phone: sanitized.nextOfKinPhone,
    house_status: sanitized.houseStatus,
    executive_post: (sanitized.houseStatus === 'Executive' || sanitized.houseStatus === 'Gee') ? sanitized.executivePost : null,
    room_name: sanitized.roomName,
    service_units: sanitized.serviceUnits || [],
    presence: sanitized.presence || 'Present',
    avatar_url: sanitized.avatarUrl || null,
    password_hash: null, // Password is fully encapsulated within Supabase Auth
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  // 3. Insert into Supabase `pending_registrations` table and `approval_requests`
  if (supabase) {
    let dbSuccess = false;
    let lastDbError = '';

    // Attempt 1: Standard Insert with all fields
    const dbRow: Record<string, any> = {
      id,
      first_name: payload.first_name,
      middle_name: payload.middle_name || '',
      last_name: payload.last_name,
      state_code: payload.state_code,
      email: payload.email,
      phone_number: payload.phone_number,
      gender: payload.gender,
      date_of_birth: payload.date_of_birth,
      state_of_origin: payload.state_of_origin,
      course_of_study: payload.course_of_study,
      school_graduated_from: payload.school_graduated_from,
      marital_status: payload.marital_status || 'Not Engaged',
      next_of_kin_name: payload.next_of_kin_name,
      next_of_kin_phone: payload.next_of_kin_phone,
      house_status: payload.house_status || 'Member',
      executive_post: payload.executive_post || null,
      room_name: payload.room_name,
      service_units: Array.isArray(payload.service_units) ? payload.service_units : [],
      presence: payload.presence || 'Present',
      avatar_url: payload.avatar_url || null,
      status: 'pending',
    };

    try {
      const { error: insertError } = await supabase.from('pending_registrations').insert(dbRow);

      if (!insertError) {
        dbSuccess = true;
      } else {
        lastDbError = insertError.message || String(insertError);
        console.warn('[RegistrationService] Initial pending_registrations insert notice:', insertError);

        if (insertError.code === '23505' || insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
          return {
            success: false,
            error: 'A registration with this State Code or Email is already pending review.',
          };
        }

        // Attempt 2: If failed due to a missing column or user_id constraint, strip non-core fields and retry
        const strippedRow: Record<string, any> = {
          id,
          first_name: payload.first_name,
          middle_name: payload.middle_name || '',
          last_name: payload.last_name,
          state_code: payload.state_code,
          email: payload.email,
          phone_number: payload.phone_number,
          gender: payload.gender,
          room_name: payload.room_name,
          status: 'pending',
        };

        const { error: retryError } = await supabase.from('pending_registrations').insert(strippedRow);
        if (!retryError) {
          dbSuccess = true;
        } else {
          lastDbError = retryError.message || String(retryError);
          console.warn('[RegistrationService] Fallback pending_registrations insert notice:', retryError);
        }
      }
    } catch (dbEx: any) {
      lastDbError = dbEx?.message || String(dbEx);
      console.warn('[RegistrationService] Exception during pending_registrations insert:', dbEx);
    }

    // Attempt 3: Also insert into approval_requests for dual persistence
    try {
      const { error: approvalErr } = await supabase.from('approval_requests').insert({
        id,
        corper_id: id,
        request_type: 'member_registration',
        request_category: 'member_registration',
        title: `New Registration: ${payload.first_name} ${payload.last_name} (${payload.state_code})`,
        reason: `Self-Service Registration from Web Portal`,
        status: 'pending',
        attachment_url: payload.avatar_url,
        payload: {
          ...payload,
          firstName: payload.first_name,
          lastName: payload.last_name,
          middleName: payload.middle_name,
          stateCode: payload.state_code,
          phone: payload.phone_number,
          phoneNumber: payload.phone_number,
          dateOfBirth: payload.date_of_birth,
          stateOfOrigin: payload.state_of_origin,
          courseOfStudy: payload.course_of_study,
          schoolGraduatedFrom: payload.school_graduated_from,
          maritalStatus: payload.marital_status,
          nextOfKinName: payload.next_of_kin_name,
          nextOfKinPhone: payload.next_of_kin_phone,
          houseStatus: payload.house_status,
          executivePost: payload.executive_post,
          roomName: payload.room_name,
          serviceUnits: payload.service_units,
        },
      });

      if (!approvalErr) {
        dbSuccess = true;
      }
    } catch (approvalEx) {
      console.warn('[RegistrationService] approval_requests shadow insert notice:', approvalEx);
    }

    // If both database writes failed, DO NOT falsely report success!
    if (!dbSuccess && lastDbError) {
      // Check for common Supabase RLS issue
      if (lastDbError.includes('row-level security') || lastDbError.includes('policy') || lastDbError.includes('permission denied')) {
        return {
          success: false,
          error: 'Database permission error: Supabase Row Level Security (RLS) is blocking public registrations. Please ensure RLS INSERT policy is active on pending_registrations.',
        };
      }
      return {
        success: false,
        error: `Failed to save registration to database: ${lastDbError}. Please try again or contact the administrator.`,
      };
    }
  }

  // 4. Save to local storage cache only when verified
  const cachedList = getStoredPendingRegistrations();
  const updatedList = [payload, ...cachedList.filter((p) => p.state_code !== sanitized.stateCode && p.email !== sanitized.email)];
  saveStoredPendingRegistrations(updatedList);

  return { success: true, id };
}

/**
 * Securely Dispatches the Approved 19 fields to Google Sheets via Webhook.
 * Formats all 19 standardized columns, includes secret key validation,
 * and handles dispatch gracefully.
 */
export async function syncApprovedCorperToGoogleSheet(corperData: any): Promise<boolean> {
  const webhookUrl =
    (import.meta as any).env?.VITE_GOOGLE_SHEET_WEBHOOK_URL ||
    (window as any).__NCCF_SHEET_WEBHOOK__ ||
    localStorage.getItem('nccf_google_sheet_webhook_url');

  const secretKey = (import.meta as any).env?.VITE_SHEET_SYNC_SECRET || 'NCCF_SECURE_SYNC_RIVERS_2026';

  if (!webhookUrl) {
    console.info('[GoogleSheetsSync] Webhook URL not configured. Corper safely recorded in Supabase.');
    return false;
  }

  try {
    const payload = {
      action: 'admit_corper',
      secret: secretKey,
      timestamp: new Date().toISOString(),
      first_name: corperData.first_name || corperData.firstName || '',
      middle_name: corperData.middle_name || corperData.middleName || '',
      last_name: corperData.last_name || corperData.lastName || '',
      state_code: corperData.state_code || corperData.stateCode || '',
      email: corperData.email || '',
      phone_number: corperData.phone_number || corperData.phoneNumber || corperData.phone || '',
      gender: corperData.gender || 'Male',
      date_of_birth: corperData.date_of_birth || corperData.dateOfBirth || '',
      state_of_origin: corperData.state_of_origin || corperData.stateOfOrigin || '',
      course_of_study: corperData.course_of_study || corperData.courseOfStudy || '',
      school_graduated_from: corperData.school_graduated_from || corperData.schoolGraduatedFrom || corperData.institution || '',
      marital_status: corperData.marital_status || corperData.maritalStatus || 'Not Engaged',
      next_of_kin_name: corperData.next_of_kin_name || corperData.nextOfKinName || '',
      next_of_kin_phone: corperData.next_of_kin_phone || corperData.nextOfKinPhone || '',
      house_status: corperData.house_status || corperData.houseStatus || 'Member',
      executive_post: corperData.executive_post || corperData.executivePost || '',
      room_name: corperData.room_name || corperData.roomName || '',
      service_units: Array.isArray(corperData.service_units)
        ? corperData.service_units.join(', ')
        : corperData.serviceUnits
        ? Array.isArray(corperData.serviceUnits) ? corperData.serviceUnits.join(', ') : corperData.serviceUnits
        : corperData.serviceUnit || '',
      presence: corperData.presence || 'Present',
      avatar_url: corperData.avatar_url || corperData.avatarUrl || '',
    };

    // Non-blocking fire & forget HTTP POST to Google Apps Script Webhook
    fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script Webhooks require no-cors in browser
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then(() => {
        console.info('[GoogleSheetsSync] Successfully dispatched 19 fields to Google Sheets Webhook.');
      })
      .catch((err) => {
        console.warn('[GoogleSheetsSync] Webhook dispatch notice:', err);
      });

    return true;
  } catch (err) {
    console.warn('[GoogleSheetsSync] Error executing sheet sync:', err);
    return false;
  }
}
