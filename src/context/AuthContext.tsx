import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { CorperProfile } from '../types/corper';
import { seedMockUsers } from '../data/seedMockUsers';
import { calculateTargets, formatTruncatedName } from '../utils/sanitizers';
import { evaluateTier } from '../utils/tierEvaluator';
import { supabase } from '../lib/supabase';
import { getStoredPendingRegistrations } from '../types/registration';

export interface AuthContextType {
  // Real Supabase Auth State
  user: User | null;
  corperProfile: CorperProfile | null;
  loading: boolean;

  // Supabase Auth Actions
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  claimAccount: (email: string, stateCode: string, password: string) => Promise<{ data: any; error: any }>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
  updateUserPassword: (newPassword: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;

  // Roster & Fallback Compatibility for App Views
  activeUser: CorperProfile;
  setActiveUser: (user: CorperProfile) => void;
  switchUserById: (id: string) => void;
  allUsers: CorperProfile[];
  setAllUsers: React.Dispatch<React.SetStateAction<CorperProfile[]>>;
  updateUserProfile: (id: string, updates: Partial<CorperProfile>) => void;
  addSingleCorper: (newCorper: Partial<CorperProfile>) => Promise<CorperProfile>;
  deleteCorperUser: (id: string) => void;
  resetToSeedData: () => void;
  isLoadingRoster: boolean;
  refetchRoster: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function mapDbRowToCorperProfile(row: any): CorperProfile {
  const firstName = row.first_name || row.firstName || 'Corper';
  const middleName = row.middle_name || row.middleName || undefined;
  const lastName = row.last_name || row.lastName || 'Member';
  const displayName = `${firstName} ${lastName}`;
  const houseStatus = row.house_status || row.houseStatus || 'Member';
  const systemCategory = row.system_category || row.systemCategory || 'member';

  const serviceUnitsList: string[] = Array.isArray(row.service_units)
    ? row.service_units
    : Array.isArray(row.serviceUnits)
    ? row.serviceUnits
    : (row.service_unit || row.serviceUnit || '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

  const serviceUnitStr = row.service_unit || row.serviceUnit || serviceUnitsList.join(', ') || '';

  const rawTier = row.tier !== undefined && row.tier !== null ? Number(row.tier) : 7;

  let privileges: any = row.privileges || null;
  if (typeof privileges === 'string') {
    try {
      privileges = JSON.parse(privileges);
    } catch (e) {
      privileges = null;
    }
  }

  const hasTripartitePrivileges =
    systemCategory === 'tripartite' ||
    systemCategory === 'admin' ||
    Boolean(privileges?.tripartite_access);

  const isExempted = Boolean(row.is_exempted || row.isExempted || privileges?.is_exempted);

  const profile: CorperProfile = {
    id: row.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-a000-000000000000'),
    userId: row.user_id || row.userId || undefined,
    firstName,
    middleName,
    lastName,
    displayName,
    gender: row.gender || 'M',
    stateCode: (row.state_code || row.stateCode || 'RV/26A/0000').toUpperCase(),
    email: row.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@nccf-rivers.org`,
    phone: row.phone_number || row.phone || '08030000000',
    dateOfBirth: row.date_of_birth || row.dateOfBirth || '1999-05-12',
    stateOfOrigin: row.state_of_origin || row.stateOfOrigin || '',
    courseOfStudy: row.course_of_study || row.courseOfStudy || '',
    schoolGraduatedFrom: row.school_graduated_from || row.schoolGraduatedFrom || row.institution || '',
    maritalStatus: row.marital_status || row.maritalStatus || 'Not Engaged',
    houseStatus,
    executivePost: row.executive_post || row.executivePost || undefined,
    systemCategory,
    systemAccessCategory: systemCategory,
    roomName: row.room_name || row.roomName || 'Joseph',
    serviceUnit: serviceUnitStr,
    serviceUnits: serviceUnitsList,
    presence: row.presence || 'Present',
    nextOfKinName: row.next_of_kin_name || row.nextOfKinName || undefined,
    nextOfKinPhone: row.next_of_kin_phone || row.nextOfKinPhone || undefined,
    tier: rawTier,
    targets: { maintenance: 15000, feeding: 10000 },
    avatarUrl:
      row.avatar_url ||
      row.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    hasTripartitePrivileges,
    isExempted,
    privileges,
  };

  profile.targets = calculateTargets(profile);
  const tierInfo = evaluateTier(profile);
  profile.tier = tierInfo.tier;

  return profile;
}

export function mapCorperProfileToDbRow(profile: Partial<CorperProfile>): Record<string, any> {
  const row: Record<string, any> = {};

  // 1. Primary Keys & Foreign Keys
  if (profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id)) {
    row.id = profile.id;
  }
  const uId = (profile as any).userId || (profile as any).user_id || profile.id;
  if (uId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uId)) {
    row.user_id = uId;
  }

  // 2. Personal Identification
  if (profile.firstName !== undefined) row.first_name = profile.firstName.trim();
  if (profile.middleName !== undefined) row.middle_name = profile.middleName?.trim() || null;
  if (profile.lastName !== undefined) row.last_name = profile.lastName.trim();
  if (profile.stateCode !== undefined) row.state_code = profile.stateCode.trim().toUpperCase();
  if (profile.email !== undefined) row.email = profile.email.trim().toLowerCase();
  if (profile.phone !== undefined || (profile as any).phoneNumber !== undefined || (profile as any).phone_number !== undefined) {
    row.phone_number = (profile.phone || (profile as any).phoneNumber || (profile as any).phone_number)?.trim() || null;
  }
  if (profile.nextOfKinName !== undefined || (profile as any).next_of_kin_name !== undefined) {
    row.next_of_kin_name = (profile.nextOfKinName || (profile as any).next_of_kin_name)?.trim() || null;
  }
  if (profile.nextOfKinPhone !== undefined || (profile as any).next_of_kin_phone !== undefined) {
    row.next_of_kin_phone = (profile.nextOfKinPhone || (profile as any).next_of_kin_phone)?.trim() || null;
  }
  if (profile.gender !== undefined) row.gender = profile.gender;
  if (profile.avatarUrl !== undefined || (profile as any).avatar_url !== undefined) {
    row.avatar_url = (profile.avatarUrl || (profile as any).avatar_url)?.trim() || null;
  }

  // 3. Academic & Background
  if (profile.dateOfBirth !== undefined || (profile as any).date_of_birth !== undefined) {
    row.date_of_birth = (profile.dateOfBirth || (profile as any).date_of_birth)?.trim() || null;
  }
  if (profile.stateOfOrigin !== undefined || (profile as any).state_of_origin !== undefined) {
    row.state_of_origin = (profile.stateOfOrigin || (profile as any).state_of_origin)?.trim() || null;
  }
  if (profile.courseOfStudy !== undefined || (profile as any).course_of_study !== undefined) {
    row.course_of_study = (profile.courseOfStudy || (profile as any).course_of_study)?.trim() || null;
  }
  const schoolVal = profile.schoolGraduatedFrom || (profile as any).school_graduated_from || (profile as any).institution;
  if (schoolVal !== undefined) {
    row.school_graduated_from = schoolVal?.trim() || null;
  }

  // 4. House & Governance Status
  if (profile.maritalStatus !== undefined || (profile as any).marital_status !== undefined) {
    row.marital_status = profile.maritalStatus || (profile as any).marital_status;
  }
  if (profile.houseStatus !== undefined || (profile as any).house_status !== undefined) {
    row.house_status = profile.houseStatus || (profile as any).house_status;
  }
  if (profile.executivePost !== undefined || (profile as any).executive_post !== undefined) {
    row.executive_post = (profile.executivePost || (profile as any).executive_post)?.trim() || null;
  }

  // 5. System Category (Check Constraint: 'member' | 'admin' | 'tripartite')
  if (profile.systemCategory !== undefined) {
    const sysCat = String(profile.systemCategory).toLowerCase();
    row.system_category = ['member', 'admin', 'tripartite'].includes(sysCat) ? sysCat : 'member';
  }

  if (profile.roomName !== undefined) row.room_name = profile.roomName?.trim() || null;

  // 6. Service Units Array (PostgreSQL text[])
  if (profile.serviceUnits !== undefined) {
    row.service_units = Array.isArray(profile.serviceUnits) ? profile.serviceUnits : [];
  } else if (profile.serviceUnit !== undefined) {
    row.service_units = profile.serviceUnit.split(',').map((s) => s.trim()).filter(Boolean);
  }

  // 7. Presence (Check Constraint: 'Present' | 'Travelled' | 'Moved On')
  if (profile.presence !== undefined) {
    const validPresences = ['Present', 'Travelled', 'Moved On'];
    row.presence = validPresences.includes(profile.presence) ? profile.presence : 'Present';
  }

  if (profile.isExempted !== undefined) {
    row.is_exempted = Boolean(profile.isExempted);
  }

  // 8. Privileges JSONB
  if (profile.privileges !== undefined && profile.privileges !== null) {
    row.privileges = typeof profile.privileges === 'object'
      ? { ...profile.privileges, is_exempted: profile.isExempted ?? profile.privileges.is_exempted }
      : { tripartite_access: false, is_exempted: Boolean(profile.isExempted) };
  } else if (profile.hasTripartitePrivileges !== undefined || profile.isExempted !== undefined) {
    row.privileges = {
      tripartite_access: Boolean(profile.hasTripartitePrivileges),
      is_exempted: Boolean(profile.isExempted),
    };
  }

  return row;
}

async function fetchCorperProfileForUser(authUser: User): Promise<CorperProfile | null> {
  if (!supabase) return null;
  try {
    // 1. Query by user_id = authUser.id
    const { data: byUserId } = await supabase
      .from('corpers')
      .select('*')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (byUserId) {
      return mapDbRowToCorperProfile(byUserId);
    }

    // 2. Query by id = authUser.id
    const { data: byId } = await supabase
      .from('corpers')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (byId) {
      return mapDbRowToCorperProfile(byId);
    }

    // 3. Fallback: Query by email = authUser.email
    if (authUser.email) {
      const { data: byEmail } = await supabase
        .from('corpers')
        .select('*')
        .eq('email', authUser.email)
        .maybeSingle();

      if (byEmail) {
        return mapDbRowToCorperProfile(byEmail);
      }
    }
  } catch (err) {
    // Silent catch
  }
  return null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [corperProfile, setCorperProfile] = useState<CorperProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Roster state for administrative and directory views
  const [allUsers, setAllUsers] = useState<CorperProfile[]>(seedMockUsers);
  const [isLoadingRoster, setIsLoadingRoster] = useState<boolean>(false);
  const [activeUserState, setActiveUserState] = useState<CorperProfile | null>(null);

  // Hydrate Supabase Session and attach Auth State Change listener
  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      setLoading(false);
      return;
    }

    async function initAuth() {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase!.auth.getSession();
        if (error) {
          // Silent
        }

        if (session?.user && isMounted) {
          setUser(session.user);
          setActiveUserState(null);
          const localMatch = allUsers.find(
            (u) => (session.user.id && u.userId === session.user.id) || (session.user.email && u.email?.toLowerCase() === session.user.email.toLowerCase())
          );
          if (localMatch) setCorperProfile(localMatch);
          const profile = await fetchCorperProfileForUser(session.user);
          if (isMounted && profile) {
            setCorperProfile(profile);
          }
        } else if (isMounted) {
          setUser(null);
          setCorperProfile(null);
          setActiveUserState(null);
        }
      } catch (err) {
        // Silent
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setActiveUserState(null);

      if (currentUser) {
        const localMatch = allUsers.find(
          (u) => (currentUser.id && u.userId === currentUser.id) || (currentUser.email && u.email?.toLowerCase() === currentUser.email.toLowerCase())
        );
        if (localMatch) setCorperProfile(localMatch);
        const profile = await fetchCorperProfileForUser(currentUser);
        if (isMounted && profile) {
          setCorperProfile(profile);
        }
      } else {
        if (isMounted) {
          setCorperProfile(null);
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Fetch full corpers roster from Supabase with Realtime sync + Window Focus & Polling Revalidation
  const fetchRoster = async () => {
    if (!supabase) {
      setIsLoadingRoster(false);
      return;
    }
    setIsLoadingRoster(true);
    try {
      const { data, error } = await supabase
        .from('corpers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Graceful fallback
      } else if (data && data.length > 0) {
        const mappedUsers = data.map(mapDbRowToCorperProfile);
        setAllUsers(mappedUsers);
      }
    } catch (err) {
      // Exception fallback
    } finally {
      setIsLoadingRoster(false);
    }
  };

  useEffect(() => {
    if (!supabase) return;
    fetchRoster();

    // 1. Revalidate on tab focus for instant sync upon returning to application tab
    const handleFocus = () => {
      fetchRoster();
    };
    window.addEventListener('focus', handleFocus);

    // 2. Periodic background polling fallback (every 60 seconds)
    const pollInterval = setInterval(() => {
      fetchRoster();
    }, 60000);

    // 3. Realtime WebSocket Channel
    const channel = supabase
      .channel('realtime_corpers_auth')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'corpers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newCorper = mapDbRowToCorperProfile(payload.new);
          setAllUsers((prev) => [newCorper, ...prev.filter((u) => u.id !== newCorper.id)]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedCorper = mapDbRowToCorperProfile(payload.new);
          setAllUsers((prev) => prev.map((u) => (u.id === updatedCorper.id ? updatedCorper : u)));
          setCorperProfile((prev) => (prev?.id === updatedCorper.id ? updatedCorper : prev));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setAllUsers((prev) => prev.filter((u) => u.id !== deletedId));
        }
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

  // Supabase Auth Action Handlers
  const signIn = async (email: string, password: string) => {
    try {
      setActiveUserState(null);
      const cleanEmail = email.trim().toLowerCase();

      // PRIOR-CHECK GUARD: Check if the user is in pending_registrations BEFORE hitting Supabase Auth!
      // If the user's registration is still pending or rejected, stop immediately without attempting auth.
      let pendingRecord: any = null;

      if (supabase) {
        try {
          const { data: dbPending } = await supabase
            .from('pending_registrations')
            .select('id, email, state_code, first_name, last_name, status, rejection_reason, created_at')
            .ilike('email', cleanEmail)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (dbPending) {
            pendingRecord = dbPending;
          }
        } catch (e) {
          // fallback
        }

        if (!pendingRecord) {
          try {
            const { data: appReq } = await supabase
              .from('approval_requests')
              .select('id, corper_id, request_type, request_category, status, reviewer_notes, payload, created_at')
              .or('request_type.eq.member_registration,request_category.eq.member_registration')
              .order('created_at', { ascending: false });

            if (appReq && appReq.length > 0) {
              const matched = appReq.find((r: any) => {
                const pEmail = (r.payload?.email || '').toLowerCase();
                return pEmail === cleanEmail;
              });
              if (matched) {
                pendingRecord = {
                  status: matched.status || 'pending',
                  rejection_reason: matched.reviewer_notes || matched.payload?.rejectionReason || null,
                };
              }
            }
          } catch (e) {
            // ignore
          }
        }
      }

      if (!pendingRecord) {
        const localPendingList = getStoredPendingRegistrations();
        const matched = localPendingList.find((r) => r.email?.toLowerCase() === cleanEmail);
        if (matched) {
          pendingRecord = matched;
        }
      }

      // If pending or rejected in pending_registrations, immediately return without contacting Supabase Auth
      if (pendingRecord) {
        const regStatus = (pendingRecord.status || 'pending').toLowerCase();
        if (regStatus === 'pending') {
          return {
            data: null,
            error: {
              name: 'PendingRegistrationError',
              isPendingReview: true,
              message: 'Your registration application has been submitted and is currently under review by the NCCF Rivers State Management. You will be able to log in once your admission is approved.',
            },
          };
        } else if (regStatus === 'rejected') {
          const reason = pendingRecord.rejection_reason || pendingRecord.rejectionReason;
          return {
            data: null,
            error: {
              name: 'RejectedRegistrationError',
              isRejected: true,
              message: `Your registration application was declined. ${reason ? `Reason: ${reason}` : 'Please contact the NCCF Secretariat for more information.'}`,
            },
          };
        }
      }

      // Proceed with Supabase Auth verification
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!error && data?.user) {
        setUser(data.user);

        // Auto-link user_id in corpers table if it was null
        try {
          await supabase
            .from('corpers')
            .update({ user_id: data.user.id })
            .ilike('email', cleanEmail)
            .is('user_id', null);
        } catch (linkErr) {
          // non-blocking
        }

        const localMatch = allUsers.find(
          (u) => (data.user.id && u.userId === data.user.id) || (data.user.email && u.email?.toLowerCase() === data.user.email.toLowerCase())
        );
        if (localMatch) setCorperProfile(localMatch);
        const profile = await fetchCorperProfileForUser(data.user);
        if (profile) {
          setCorperProfile(profile);
        }
        return { data, error: null };
      }

      // If sign-in failed, check if this is an unclaimed Google Form roster import (user_id is null)
      if (supabase && error) {
        try {
          const { data: unclaimedCorper } = await supabase
            .from('corpers')
            .select('id, user_id, email, state_code')
            .ilike('email', cleanEmail)
            .maybeSingle();

          if (unclaimedCorper && !unclaimedCorper.user_id) {
            return {
              data: null,
              error: {
                name: 'UnclaimedAccountError',
                isUnclaimed: true,
                message: 'Your profile has been registered from the Google Form roster! Please switch to the "Claim Account" tab above to choose your password and activate your access.',
              },
            };
          }
        } catch (e) {
          // ignore
        }
      }

      return { data, error };
    } catch (err) {
      console.error('[Supabase AuthContext] Exception in signIn:', err);
      return { data: null, error: err };
    }
  };

  const claimAccount = async (email: string, stateCode: string, password: string) => {
    try {
      const formattedEmail = email.trim().toLowerCase();
      const formattedStateCode = stateCode.trim().toUpperCase();

      // 1. Verify that the corper exists in the corpers table with matching email AND state_code
      const { data: existingCorper, error: verifyError } = await supabase
        .from('corpers')
        .select('id, user_id, email, state_code')
        .ilike('email', formattedEmail)
        .ilike('state_code', formattedStateCode)
        .maybeSingle();

      if (verifyError) {
        console.warn('[Supabase AuthContext] Verify corper query error:', verifyError.message);
      }

      if (!existingCorper) {
        return {
          data: null,
          error: new Error(`No matching corps member record found for Email (${formattedEmail}) and State Code (${formattedStateCode}). Please confirm your credentials with the NCCF Secretariat.`),
        };
      }

      // If already claimed, attempt sign-in or advise sign-in
      if (existingCorper.user_id) {
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: formattedEmail,
          password,
        });

        if (!signInErr && signInData?.user) {
          setUser(signInData.user);
          const profile = await fetchCorperProfileForUser(signInData.user);
          if (profile) setCorperProfile(profile);
          return { data: { user: signInData.user, corper: profile || existingCorper }, error: null };
        }

        return {
          data: null,
          error: new Error('This corps member account has already been claimed and activated. Please sign in with your email and password, or use Forgot Password if needed.'),
        };
      }

      // 2. Perform Supabase Auth SignUp
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formattedEmail,
        password,
      });

      // If user already exists in auth.users (e.g. from registration wizard), attempt sign-in and link user_id
      if (signUpError) {
        const msg = (signUpError.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('user already exists') || (signUpError as any).status === 422) {
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: formattedEmail,
            password,
          });

          if (!signInErr && signInData?.user) {
            setUser(signInData.user);
            await supabase
              .from('corpers')
              .update({ user_id: signInData.user.id })
              .eq('id', existingCorper.id);

            const profile = await fetchCorperProfileForUser(signInData.user);
            if (profile) setCorperProfile(profile);
            return { data: { user: signInData.user, corper: profile || existingCorper }, error: null };
          } else {
            return {
              data: null,
              error: new Error('An account with this email already exists. If this is your account, please sign in or use the Forgot Password link to reset your password.'),
            };
          }
        }

        return { data: null, error: signUpError };
      }

      if (authData?.user) {
        // 3. Link user_id in corpers table
        const { error: updateError } = await supabase
          .from('corpers')
          .update({ user_id: authData.user.id })
          .eq('id', existingCorper.id);

        if (updateError) {
          console.warn('[Supabase AuthContext] Failed to link corper user_id directly:', updateError.message);
          // Try RPC fallback
          const { error: rpcError } = await supabase.rpc('claim_corper_account', {
            p_email: formattedEmail,
            p_state_code: formattedStateCode,
            p_auth_uid: authData.user.id,
          });
          if (rpcError) {
            console.warn('[Supabase AuthContext] RPC claim_corper_account fallback notice:', rpcError.message);
          }
        }

        const profile = await fetchCorperProfileForUser(authData.user);
        if (profile) {
          setCorperProfile(profile);
        }

        return { data: { user: authData.user, corper: profile || existingCorper }, error: null };
      }

      return { data: authData, error: null };
    } catch (err: any) {
      console.error('[Supabase AuthContext] Exception in claimAccount:', err);
      return { data: null, error: err };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Dynamic origin detection ensures link redirects back to current app domain (Preview URL, Vercel app URL, or custom domain)
      const redirectUrl = `${window.location.origin}/?mode=resetPassword`;
      const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });
      return { data, error };
    } catch (err) {
      console.error('[Supabase AuthContext] Exception in resetPassword:', err);
      return { data: null, error: err };
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      return { data, error };
    } catch (err) {
      console.error('[Supabase AuthContext] Exception in updateUserPassword:', err);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      setUser(null);
      setCorperProfile(null);
      setActiveUserState(null);
      return { error };
    } catch (err) {
      console.error('[Supabase AuthContext] Exception in signOut:', err);
      return { error: err };
    }
  };

  // Primary active user resolution:
  // When logged in via Supabase, user/corperProfile takes absolute precedence for privacy & session safety.
  // It will NEVER fall back to another user's profile in allUsers if an authenticated session exists.
  const activeUser = React.useMemo(() => {
    if (corperProfile) return corperProfile;

    if (user) {
      // 1. Search in allUsers roster by userId or email
      const matchedInRoster = allUsers.find(
        (u) =>
          (user.id && u.userId === user.id) ||
          (user.email && u.email?.toLowerCase() === user.email.toLowerCase())
      );
      if (matchedInRoster) return matchedInRoster;

      // 2. Synthesize a temporary profile for the authenticated user so we NEVER display another user's data
      const userEmail = user.email || 'corper@nccf-rivers.org';
      const emailPrefix = userEmail.split('@')[0];
      const nameParts = emailPrefix.split(/[\._\-]/).filter(Boolean);
      const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Corps';
      const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'Member';

      const tempProfile: CorperProfile = {
        id: user.id || 'temp-user-id',
        userId: user.id,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        gender: 'M',
        stateCode: 'RV/26A/0000',
        email: userEmail,
        phone: '08000000000',
        dateOfBirth: '2000-01-01',
        stateOfOrigin: 'Rivers',
        courseOfStudy: 'General',
        schoolGraduatedFrom: 'Higher Institution',
        maritalStatus: 'Not Engaged',
        houseStatus: 'Member',
        systemCategory: 'member',
        systemAccessCategory: 'member',
        roomName: 'Joseph',
        serviceUnit: 'General',
        serviceUnits: ['General'],
        presence: 'Present',
        nextOfKinName: undefined,
        nextOfKinPhone: undefined,
        tier: 7,
        targets: { maintenance: 15000, feeding: 10000 },
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
        hasTripartitePrivileges: false,
        isExempted: false,
      };
      return tempProfile;
    }

    return activeUserState || allUsers[0] || seedMockUsers[0];
  }, [corperProfile, user, allUsers, activeUserState]);

  const setActiveUser = (userProfile: CorperProfile) => {
    setTimeout(() => setActiveUserState(userProfile), 0);
  };

  const switchUserById = (id: string) => {
    const found = allUsers.find((u) => u.id === id);
    if (found) {
      setTimeout(() => setActiveUserState(found), 0);
    }
  };

  const updateUserProfile = (id: string, updates: Partial<CorperProfile>) => {
    let finalUpdatedProfile: CorperProfile | undefined;

    setAllUsers((prevUsers) => {
      return prevUsers.map((u) => {
        if (u.id !== id) return u;

        let currentPrivs = updates.privileges ?? u.privileges;
        if ((updates.hasTripartitePrivileges !== undefined || updates.isExempted !== undefined) && !updates.privileges) {
          currentPrivs = {
            ...(currentPrivs || {}),
            tripartite_access: updates.hasTripartitePrivileges !== undefined ? Boolean(updates.hasTripartitePrivileges) : Boolean(currentPrivs?.tripartite_access),
            is_exempted: updates.isExempted !== undefined ? Boolean(updates.isExempted) : Boolean(currentPrivs?.is_exempted),
          };
        }

        const updatedRaw: CorperProfile = {
          ...u,
          ...updates,
          privileges: currentPrivs,
        };

        if (updates.firstName !== undefined || updates.lastName !== undefined) {
          updatedRaw.displayName = formatTruncatedName(
            updatedRaw.firstName,
            updatedRaw.lastName
          );
        }

        if (updates.serviceUnits !== undefined && updates.serviceUnit === undefined) {
          updatedRaw.serviceUnit = updates.serviceUnits.join(', ');
        } else if (updates.serviceUnit !== undefined && updates.serviceUnits === undefined) {
          updatedRaw.serviceUnits = updates.serviceUnit.split(',').map((s) => s.trim()).filter(Boolean);
        }

        updatedRaw.targets = calculateTargets(updatedRaw);
        const tierInfo = evaluateTier(updatedRaw);
        updatedRaw.tier = tierInfo.tier;

        updatedRaw.hasTripartitePrivileges =
          updatedRaw.systemCategory === 'admin' ||
          updatedRaw.systemCategory === 'tripartite' ||
          Boolean(currentPrivs?.tripartite_access);

        finalUpdatedProfile = updatedRaw;
        return updatedRaw;
      });
    });

    if (finalUpdatedProfile) {
      const updatedProfileRef = finalUpdatedProfile;
      if (corperProfile?.id === id) {
        setTimeout(() => setCorperProfile(updatedProfileRef), 0);
      }
      if (activeUserState?.id === id) {
        setTimeout(() => setActiveUserState(updatedProfileRef), 0);
      }
    }

    if (finalUpdatedProfile) {
      const dbRow = mapCorperProfileToDbRow(finalUpdatedProfile);
      (async () => {
        try {
          const { error } = await supabase.from('corpers').upsert({
            id,
            ...dbRow,
            updated_at: new Date().toISOString(),
          });
          if (error) {
            console.warn('[Supabase AuthContext] Error upserting corper profile:', error.message);
          } else {
            // console.log('[Supabase AuthContext] Successfully saved profile & avatar_url to Supabase corpers table');
          }
        } catch (err) {
          console.warn('[Supabase AuthContext] Exception upserting corper profile:', err);
        }
      })();
    }
  };

  const addSingleCorper = async (newCorper: Partial<CorperProfile>): Promise<CorperProfile> => {
    const firstName = newCorper.firstName || (newCorper as any).first_name || 'Corper';
    const middleName = newCorper.middleName || (newCorper as any).middle_name;
    const lastName = newCorper.lastName || (newCorper as any).last_name || 'Member';
    const displayName = formatTruncatedName(firstName, lastName);
    const id = (newCorper.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newCorper.id))
      ? newCorper.id
      : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-a000-000000000000');
    const userId = (newCorper as any).userId || (newCorper as any).user_id || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id : undefined);

    const serviceUnitsList: string[] = newCorper.serviceUnits || (newCorper as any).service_units ||
      (newCorper.serviceUnit ? newCorper.serviceUnit.split(',').map(s => s.trim()).filter(Boolean) : []);
    const serviceUnitStr = newCorper.serviceUnit || (Array.isArray(serviceUnitsList) && serviceUnitsList.length > 0 ? serviceUnitsList.join(', ') : '');

    const systemCategory = newCorper.systemCategory || 'member';
    const isTripartite = newCorper.hasTripartitePrivileges ?? (systemCategory === 'admin' || systemCategory === 'tripartite');
    const isExempted = Boolean(newCorper.isExempted);
    const privileges = newCorper.privileges || { tripartite_access: isTripartite, is_exempted: isExempted };

    const schoolGraduatedFrom =
      newCorper.schoolGraduatedFrom ||
      (newCorper as any).school_graduated_from ||
      (newCorper as any).institution ||
      '';

    const rawProfile: CorperProfile = {
      id,
      userId: (newCorper as any).userId || (newCorper as any).user_id,
      firstName,
      middleName,
      lastName,
      displayName,
      gender: newCorper.gender || (newCorper as any).gender || 'M',
      stateCode: (newCorper.stateCode || (newCorper as any).state_code || 'RV/26A/0000').toUpperCase(),
      email: newCorper.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@nccf-rivers.org`,
      phone: newCorper.phone || (newCorper as any).phoneNumber || (newCorper as any).phone_number || '08030000000',
      dateOfBirth: newCorper.dateOfBirth || (newCorper as any).date_of_birth || '1999-05-12',
      stateOfOrigin: newCorper.stateOfOrigin || (newCorper as any).state_of_origin || '',
      courseOfStudy: newCorper.courseOfStudy || (newCorper as any).course_of_study || '',
      schoolGraduatedFrom,
      maritalStatus: newCorper.maritalStatus || (newCorper as any).marital_status || 'Not Engaged',
      houseStatus: newCorper.houseStatus || (newCorper as any).house_status || 'Member',
      executivePost: newCorper.executivePost || (newCorper as any).executive_post,
      roomName: newCorper.roomName || (newCorper as any).room_name || 'Timothy',
      serviceUnit: serviceUnitStr,
      serviceUnits: serviceUnitsList,
      systemCategory,
      systemAccessCategory: systemCategory,
      presence: newCorper.presence || (newCorper as any).presence || 'Present',
      nextOfKinName: (newCorper.nextOfKinName || (newCorper as any).next_of_kin_name)?.trim() || undefined,
      nextOfKinPhone: (newCorper.nextOfKinPhone || (newCorper as any).next_of_kin_phone)?.trim() || undefined,
      privileges,
      hasTripartitePrivileges: isTripartite,
      isExempted,
      tier: 7,
      targets: { maintenance: 15000, feeding: 10000 },
      avatarUrl:
        newCorper.avatarUrl ||
        (newCorper as any).avatar_url ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    };

    rawProfile.targets = calculateTargets(rawProfile);
    const tierInfo = evaluateTier(rawProfile);
    rawProfile.tier = tierInfo.tier;

    setAllUsers((prev) => [rawProfile, ...prev.filter(u => u.stateCode.toUpperCase() !== rawProfile.stateCode.toUpperCase())]);

    const dbRow = mapCorperProfileToDbRow(rawProfile);
    if (supabase) {
      try {
        const payloadToInsert: Record<string, any> = {
          ...dbRow,
          id,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('corpers').upsert(payloadToInsert, { onConflict: 'state_code' });
        if (error) {
          console.warn('[Supabase AuthContext] Upsert attempt notice:', error.message);
          // If foreign key constraint failed on user_id, strip user_id and retry
          if (payloadToInsert.user_id) {
            delete payloadToInsert.user_id;
            const { error: retryErr } = await supabase.from('corpers').upsert(payloadToInsert, { onConflict: 'state_code' });
            if (retryErr) {
              console.warn('[Supabase AuthContext] Retry upsert notice:', retryErr.message);
            }
          }
        }
      } catch (err) {
        console.warn('[Supabase AuthContext] Exception inserting corper profile:', err);
      }
    }

    return rawProfile;
  };

  const deleteCorperUser = (id: string) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== id));

    (async () => {
      try {
        const { error } = await supabase.from('corpers').delete().eq('id', id);
        if (error) {
          console.warn('[Supabase AuthContext] Error deleting corper profile:', error.message);
        }
      } catch (err) {
        console.warn('[Supabase AuthContext] Exception deleting corper profile:', err);
      }
    })();
  };

  const resetToSeedData = () => {
    setAllUsers(seedMockUsers);
    const blessing = seedMockUsers.find((u) => u.id === '00000000-0000-4000-a000-000000000004' || u.id === 'corp-004') || seedMockUsers[0];
    setTimeout(() => setActiveUserState(blessing), 0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        corperProfile,
        loading,
        signIn,
        claimAccount,
        resetPassword,
        updateUserPassword,
        signOut,
        activeUser,
        setActiveUser,
        switchUserById,
        allUsers,
        setAllUsers,
        updateUserProfile,
        addSingleCorper,
        deleteCorperUser,
        resetToSeedData,
        isLoadingRoster,
        refetchRoster: fetchRoster,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
