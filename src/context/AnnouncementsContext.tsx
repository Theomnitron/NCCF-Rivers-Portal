import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { hasTripartiteAccess, CorperPrivileges } from '../types/corper';
import { formatAnnouncementDisplayDate } from '../utils/dateFormatter';

export interface Announcement {
  id: string; // e.g. "ANC-2026-001"
  title: string;
  description?: string;
  flyerUrl?: string;
  flyerFileName?: string;
  venue?: string;
  eventDate?: string;
  eventEndDate?: string;
  dateMode?: 'single' | 'range';
  timeRange?: string;
  expirationDate: string; // YYYY-MM-DD
  authorName: string;
  authorRole: string;
  createdAt: string;
  targetCategories?: string[];
  targetTiers?: number[];
  isPublished?: boolean;
  pinToTop?: boolean;
  createdBy?: string;
  authorId?: string;
}

interface AnnouncementsContextType {
  announcements: Announcement[];
  isLoadingAnnouncements?: boolean;
  addAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt'>) => string;
  updateAnnouncement: (id: string, announcement: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => void;
  deleteAnnouncement: (id: string) => void;
  filterAnnouncementsForUser: (user: { systemCategory?: string; tier?: number; hasTripartitePrivileges?: boolean; privileges?: CorperPrivileges | null } | null) => Announcement[];
  refetchAnnouncements: () => Promise<void>;
}

const LOCAL_STORAGE_KEY_ANNOUNCEMENTS = 'nccf_rivers_announcements_v1';

const isUUID = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

/**
 * Safely parse a date input (YYYY-MM-DD or ISO string) into an ISO string suitable for Supabase's timestamptz column.
 * Returns null if the string is not a valid date.
 */
function safeIsoDate(val?: string | null): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    try {
      const parsed = new Date(`${trimmed}T00:00:00.000Z`);
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    } catch {
      return null;
    }
  }

  // Handle ISO or standard date formats
  try {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) return parsed.toISOString();
  } catch {
    return null;
  }

  return null;
}

export function mapRowToAnnouncement(row: any): Announcement {
  // Check if we have structured date range or single date
  let computedDisplayDate: string | undefined = undefined;

  if (row.event_date) {
    if (row.event_end_date && row.event_end_date !== row.event_date) {
      const startStr = typeof row.event_date === 'string' ? row.event_date.substring(0, 10) : '';
      const endStr = typeof row.event_end_date === 'string' ? row.event_end_date.substring(0, 10) : '';
      computedDisplayDate = formatAnnouncementDisplayDate(startStr) + ' – ' + formatAnnouncementDisplayDate(endStr);
    } else {
      computedDisplayDate = formatAnnouncementDisplayDate(row.event_date) || undefined;
    }
  }

  return {
    id: row.id,
    title: row.title || 'Notice',
    description: row.description || undefined,
    flyerUrl: row.flyer_url || undefined,
    venue: row.venue || undefined,
    eventDate: computedDisplayDate || (typeof row.event_date === 'string' && !row.event_date.includes('T') ? row.event_date : undefined),
    eventEndDate: row.event_end_date ? String(row.event_end_date).substring(0, 10) : undefined,
    dateMode: row.date_mode || (row.event_end_date ? 'range' : 'single'),
    timeRange: row.time_range || undefined,
    expirationDate: row.expires_at ? new Date(row.expires_at).toISOString().substring(0, 10) : '2026-12-31',
    authorName: 'Tripartite Council',
    authorRole: 'Governance Officer',
    createdAt: row.created_at ? new Date(row.created_at).toISOString().replace('T', ' ').substring(0, 16) : '',
    pinToTop: row.pin_to_top !== undefined && row.pin_to_top !== null ? Boolean(row.pin_to_top) : false,
    authorId: row.author_id || undefined,
  };
}

export function isAnnouncementVisibleToUser(
  announcement: Announcement,
  _user?: any
): boolean {
  if (announcement.isPublished === false) return false;
  return true;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);

export const AnnouncementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState<boolean>(true);

  const fetchAnnouncements = async () => {
    if (!supabase) {
      setIsLoadingAnnouncements(false);
      return;
    }
    setIsLoadingAnnouncements(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements from Supabase:', error);
      } else if (data) {
        const mapped = data.map(mapRowToAnnouncement);
        setAnnouncements(mapped);
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setIsLoadingAnnouncements(false);
      return;
    }
    fetchAnnouncements();

    // 1. Revalidate on tab focus
    const handleFocus = () => {
      fetchAnnouncements();
    };
    window.addEventListener('focus', handleFocus);

    // 2. Periodic background polling fallback (every 60 seconds)
    const pollInterval = setInterval(() => {
      fetchAnnouncements();
    }, 60000);

    // 3. Realtime WebSocket Channel
    const channel = supabase
      .channel('realtime_announcements_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const item = mapRowToAnnouncement(payload.new);
          setAnnouncements((prev) => [item, ...prev.filter((a) => a.id !== item.id)]);
        } else if (payload.eventType === 'UPDATE') {
          const item = mapRowToAnnouncement(payload.new);
          setAnnouncements((prev) => prev.map((a) => (a.id === item.id ? item : a)));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setAnnouncements((prev) => prev.filter((a) => a.id !== deletedId));
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

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(announcements));
    } catch (e) {
      // Catch storage error
    }
  }, [announcements]);

  const addAnnouncement = (data: Omit<Announcement, 'id' | 'createdAt'>): string => {
    const newUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-a000-000000000000';
    const newAnnouncement: Announcement = {
      ...data,
      id: newUuid,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      isPublished: data.isPublished ?? true,
      pinToTop: data.pinToTop ?? false,
    };

    setAnnouncements((prev) => [newAnnouncement, ...prev]);

    (async () => {
      try {
        const dbPayload: Record<string, any> = {
          id: newUuid,
          title: data.title,
          description: data.description || null,
          flyer_url: data.flyerUrl || null,
          venue: data.venue || null,
          expires_at: data.expirationDate ? (safeIsoDate(data.expirationDate) || new Date('2026-12-31').toISOString()) : new Date('2026-12-31').toISOString(),
          pin_to_top: data.pinToTop ?? false,
          date_mode: data.dateMode || (data.eventEndDate ? 'range' : 'single'),
        };

        if (data.eventDate) {
          const isoStart = safeIsoDate(data.eventDate);
          if (isoStart) {
            dbPayload.event_date = isoStart;
          }
        }

        if (data.eventEndDate) {
          const isoEnd = safeIsoDate(data.eventEndDate);
          if (isoEnd) {
            dbPayload.event_end_date = isoEnd;
          }
        }

        if (data.timeRange) {
          dbPayload.time_range = data.timeRange;
        }

        const authIdCandidate = data.authorId || data.createdBy;
        if (isUUID(authIdCandidate)) {
          dbPayload.author_id = authIdCandidate;
        }

        const { error } = await supabase.from('announcements').insert(dbPayload);
        if (error) console.warn('[Supabase AnnouncementsContext] Error inserting announcement:', error.message);
      } catch (err) {
        console.warn('[Supabase AnnouncementsContext] Exception inserting announcement:', err);
      }
    })();

    return newUuid;
  };

  const updateAnnouncement = (id: string, data: Partial<Omit<Announcement, 'id' | 'createdAt'>>) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...data } : a))
    );

    const dbRow: Record<string, any> = {};
    if (data.title !== undefined) dbRow.title = data.title;
    if (data.description !== undefined) dbRow.description = data.description || null;
    if (data.flyerUrl !== undefined) dbRow.flyer_url = data.flyerUrl || null;
    if (data.venue !== undefined) dbRow.venue = data.venue || null;
    if (data.eventDate !== undefined) {
      dbRow.event_date = safeIsoDate(data.eventDate);
    }
    if (data.eventEndDate !== undefined) {
      dbRow.event_end_date = safeIsoDate(data.eventEndDate);
    }
    if (data.dateMode !== undefined) {
      dbRow.date_mode = data.dateMode;
    }
    if (data.timeRange !== undefined) {
      dbRow.time_range = data.timeRange || null;
    }
    if (data.expirationDate !== undefined) {
      dbRow.expires_at = safeIsoDate(data.expirationDate) || new Date('2026-12-31').toISOString();
    }
    if (data.pinToTop !== undefined) dbRow.pin_to_top = data.pinToTop;
    const authIdCandidate = data.authorId || data.createdBy;
    if (authIdCandidate !== undefined && isUUID(authIdCandidate)) {
      dbRow.author_id = authIdCandidate;
    }

    if (Object.keys(dbRow).length > 0) {
      (async () => {
        try {
          const { error } = await supabase.from('announcements').update(dbRow).eq('id', id);
          if (error) console.warn('[Supabase AnnouncementsContext] Error updating announcement:', error.message);
        } catch (err) {
          console.warn('[Supabase AnnouncementsContext] Exception updating announcement:', err);
        }
      })();
    }
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));

    (async () => {
      try {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) console.warn('[Supabase AnnouncementsContext] Error deleting announcement:', error.message);
      } catch (err) {
        console.warn('[Supabase AnnouncementsContext] Exception deleting announcement:', err);
      }
    })();
  };

  const filterAnnouncementsForUser = (user: { systemCategory?: string; tier?: number; hasTripartitePrivileges?: boolean; privileges?: CorperPrivileges | null } | null) => {
    return announcements.filter((a) => isAnnouncementVisibleToUser(a, user));
  };

  return (
    <AnnouncementsContext.Provider
      value={{
        announcements,
        isLoadingAnnouncements,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        filterAnnouncementsForUser,
        refetchAnnouncements: fetchAnnouncements,
      }}
    >
      {children}
    </AnnouncementsContext.Provider>
  );
};

export const useAnnouncements = (): AnnouncementsContextType => {
  const context = useContext(AnnouncementsContext);
  if (!context) {
    throw new Error('useAnnouncements must be used within an AnnouncementsProvider');
  }
  return context;
};


