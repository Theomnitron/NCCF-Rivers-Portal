# NCCF Rivers State Web Portal — Frontend Architecture & State Overview

> **Document Version:** 1.0.0  
> **Last Updated:** July 31, 2026  
> **Target Audience:** Engineering Team, System Stewards, and Developers restoring/maintaining codebase state.

---

## 1. Executive Summary & Architecture Overview

The **NCCF Rivers State Web Portal** is a role-governed, full-fledged React application built for the Nigerian Christian Corpers' Fellowship (Rivers State Chapter). The frontend handles member profile management, dues assessment tracking, travel exeat permits, announcement publishing, and administrative roster governance across a 7-tier organizational hierarchy.

### Key Architectural Pillars
* **Framework & Build:** React 18, Vite, TypeScript, and Tailwind CSS.
* **Responsive Layout Shell:** Fixed wallpaper canvas with zero-flash light/dark theme switching, collapsible desktop sidebar, and sticky mobile navigation bar.
* **Role-Based Canvas Routing (`ViewRouter`):** Dynamic rendering based on `systemCategory` (`admin`, `tripartite`, `member`) and delegated privileges (`hasTripartitePrivileges`).
* **Dual Persistence Layer:**
  * **Supabase Client (`@supabase/supabase-js`):** Live database sync for `corpers`, `approval_requests`, `dues_ledgers`, and `announcements` with active Realtime channel subscriptions (`postgres_changes`).
  * **Local Storage & Mock Seed Fallbacks:** Zero-downtime offline fallbacks for local state caching (`nccf_rivers_dues_submissions_v1`, `nccf_rivers_travel_requests_v1`, `nccf_rivers_announcements_v1`, `nccf_user_ledgers_*`).
* **Dev Context Suite:** Floating bottom-right role/profile switcher allowing developers to instantly impersonate any profile across all 7 tiers.

---

## 2. Authorization, Role & Tier Matrix Logic

The system categorizes every registered corper into a strict 7-tier role matrix defined in `src/utils/tierEvaluator.ts`. Tier assignments determine visual badges, privilege inheritance, and component access rights.

### 7-Tier Definition Matrix

| Tier | Tier Name | System Category / House Status | Badge Label | Hex Color | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | System Administrator | `systemCategory === 'admin'` | Admin / Coded Post | `#C0C0C0` | Full portal administration, CRUD operations, CSV batch onboarding, & database overrides. |
| **Tier 2** | Gee (Senior Alumnus) | `houseStatus === 'Gee'` | Gee | `#00F5D4` | Honorary Senior Corper & Alumni Mentor status. |
| **Tier 3** | Tripartite Member | `systemCategory === 'tripartite'` | Tripartite / Papa / Uncle | `#FFD700` | State Executive Governance Council; holds waiver/permit sign-off privileges & dues exemption. |
| **Tier 4** | Executive Officer | `houseStatus === 'Executive'` | Executive Post | `#9D4EDD` | House/Unit Executive Council Officer (e.g. Papa, Mama, Prayo, Bishop, Rugged Man, IMF, CBN). |
| **Tier 5** | House Delegate | `houseStatus === 'Delegate'` | Delegate | `#0077B6` | Zonal and House Representative Delegate. |
| **Tier 6** | Room Governor | `houseStatus === 'Room Gov'` | Room Gov | `#50C878` | Floor governor, room manager, and logistics lead. |
| **Tier 7** | Standard Member | `houseStatus === 'Member'` | Member | `#708090` | General House Resident & Active Member. |

### Coded Post Title Logic (`getCodedPostTitle`)
The system extracts abbreviated traditional NCCF post titles from `executivePost`:
* **President:** `PAPA`
* **General Secretary:** `STATE UNCLE`
* **Assistant General Secretary:** `STATE AUNTY`
* **Welfare Secretary & Sisters' Coord:** `MAMA`
* **Transport & Organizing Sec (TOS):** `TOS MAN`
* **Prayer Secretary:** `PRAYO`
* **Bible Study Secretary:** `BISHOP`
* **Evangelism Secretary:** `RUGGED MAN`
* **Treasurer:** `CBN`
* **Financial Secretary:** `IMF`
* **Music Director:** `MD` | **Drama Director:** `DD`
* **Publicity Secretary:** `PUBGREAT` | **Chief Usher / Landlady:** `LANDLADY`

---

## 3. Core Functional Modules

### 3.1. Member Portal Canvas (`MemberPortalCanvas.tsx`)
* **Welcome Banner:** Displays user's avatar, colored tier border, tier badge pill, state code badge, room assignment, and service unit details.
* **Subscription Hub (`SubscriptionHub.tsx`):**
  * **Dual Hero Circular Gauges (`CircularGauge.tsx`):** Visual percentage indicators for Maintenance Dues (Target: ₦15,000) and Feeding Dues (Target: ₦10,000).
  * **Rolling Glass Ledger:** Monthly interactive timeline (Jan–Dec) tracking payment statuses (`paid`, `pending`, `unpaid`, `upcoming`).
* **Proof of Dues Upload (`ReceiptUploadModal.tsx`):** Drag-and-drop or file selector for payment receipts with client-side image compression/processing via `fileProcessor.ts`.
* **Month Details Inspector (`MonthDetailsModal.tsx`):** Modal presenting breakdown of dues breakdown and submitted receipt previews.
* **GENCO & House Info Cards:** Structured breakdown of State of Origin, Course of Study, School, Marital Status, House Status, Room, Service Unit, and Presence Status.

### 3.2. Tripartite Governance Canvas (`TripartiteGovernanceCanvas.tsx`)
* **Executive Identity Header:** Displays Gold Tripartite border accent and executive designation (`State President`, `Executive Member`, `Delegated Steward`).
* **HR Operational Overview Dashboard (`HrDashboardOverview.tsx`):** Aggregate telemetry metrics (Total Corpers, Financial Clearance %, Travel Permits Queue, Pending Requests).
* **Statewide Read-Only Corper Roster:** Filterable directory of all state members.
* **Stripped Full Profile Modal:** Read-only inspection of corper details.

### 3.3. Admin Operations Console (`AdminCommandCanvas.tsx`)
* **Executive Command Banner:** Operator identity badge and full CRUD status.
* **High-Density Corper Roster Table (`CorperRosterTable.tsx`):**
  * Search by name, state code, room, or service unit.
  * Filter by house status or presence.
  * Direct actions: **Edit Profile**, **View Full Profile**, **Force Clear Dues**, **Reset Account**, **Delete Record**.
* **CSV Batch Onboarding Dropzone (`CsvOnboardingZone.tsx`):** Upload CSV files for mass corper registration with header mapping and state code validation.
* **Single Corper Creation Modal (`AddSingleCorperModal.tsx`):** Manual registration form with auto-calculated targets and state code sanitization.
* **Saturday Birthday Cron & Celebrations Widget (`SaturdayCronCelebrationsWidget.tsx`):** Automated weekly birthday tracking widget.
* **Override Guardrail Modal (`OverrideGuardrailModal.tsx`):** Confirmation dialog for force-clearing dues or resetting profile state.
* **Intent Allocation Drawer (`IntentAllocationDrawer.tsx`):** Management drawer for room and unit reassignment.

### 3.4. Requests & Approvals Queue (`ApprovalsView.tsx` & `MemberRequestsView.tsx`)
* **Member Requests (`MemberRequestsView.tsx`):**
  * Dues proof submission tab.
  * Travel Exeat permit submission tab (departure/return dates, short travel reason, detailed context, supporting letter).
  * Profile Delta request tab (room change, unit change, marital status change).
* **Approvals Queue (`ApprovalsView.tsx`):**
  * Filterable queue for Admin & Tripartite reviewers.
  * Approve with date/amount overrides or reject with required reviewer notes.
  * Automatic state sync to `dues_ledgers` and `corpers` profile upon approval.

### 3.5. Announcements & Notices (`AnnouncementsTab.tsx`)
* **Published Notices Feed:** Displays pinned notices, event flyers, venues, event dates, and expiration countdowns.
* **Notice Publisher Modal:** Admin/Tripartite modal for posting new announcements with target category/tier scoping and expiration dates.
* **Notice Deletion / Editing:** Real-time sync with Supabase `announcements` table.

### 3.6. Settings & Preferences (`SettingsTab.tsx`)
* Account profile preferences, theme toggle (Light/Dark), notification switches, and session management.

### 3.7. Dev Profile Switcher (`DevSwitcher.tsx` & `RoleSwitcher.tsx`)
* Floating developer drawer providing one-click switching between mock profiles:
  1. **Emmanuel O.** (Admin / Tier 1)
  2. **Adebayo T.** (Tripartite / Tier 3)
  3. **Samuel D.** (Executive / Tier 4)
  4. **David D.** (Delegate / Tier 5)
  5. **Blessing A.** (Standard Member / Tier 7)

---

## 4. Component Hierarchy & File Structure

```
src/
├── App.tsx                        # Provider wrapper & MainPortalApp root
├── main.tsx                       # Entry point mounting App
├── index.css                      # Tailwind CSS entry (@import "tailwindcss")
├── vite-env.d.ts                  # Vite client type definitions
│
├── components/
│   ├── Header.tsx                 # Pinned top header with Theme toggle & user badge
│   ├── NccfLogo.tsx               # SVG Logo component
│   ├── RoleSwitcher.tsx           # Multi-profile switching grid for development
│   ├── RoleTierMatrix.tsx         # Matrix reference modal for tier definitions
│   ├── CorperProfileCard.tsx      # Standard profile card renderer
│   ├── StateCodeValidator.tsx     # Live NYSC state code regex input validator
│   │
│   ├── admin/                     # Administrative components
│   │   ├── AddSingleCorperModal.tsx
│   │   ├── CorperFullProfileModal.tsx
│   │   ├── CorperRosterTable.tsx
│   │   ├── CsvOnboardingZone.tsx
│   │   ├── EditCorperProfileModal.tsx
│   │   ├── IntentAllocationDrawer.tsx
│   │   ├── OverrideGuardrailModal.tsx
│   │   ├── SaturdayCronCelebrationsWidget.tsx
│   │   └── UserEditModal.tsx
│   │
│   ├── announcements/
│   │   └── AnnouncementsTab.tsx   # Announcements feed & creator modal
│   │
│   ├── approvals/
│   │   └── ApprovalsView.tsx      # Unified approvals queue for permits, dues & profile updates
│   │
│   ├── dashboard/
│   │   └── HrDashboardOverview.tsx # Telemetry metrics overview card
│   │
│   ├── dev/
│   │   └── DevSwitcher.tsx        # Floating bottom-right dev drawer trigger
│   │
│   ├── financial/
│   │   ├── CircularGauge.tsx      # SVG ring gauge for dues visualization
│   │   ├── MonthDetailsModal.tsx  # Breakdown modal for monthly dues
│   │   ├── ReceiptUploadModal.tsx # Proof of payment upload modal
│   │   └── SubscriptionHub.tsx    # Dual gauges & rolling glass ledger timeline
│   │
│   ├── layout/
│   │   └── Shell.tsx              # Outer layout shell with responsive sidebar & ambient wallpaper
│   │
│   ├── requests/
│   │   ├── DuesReceiptSection.tsx
│   │   ├── MemberRequestsView.tsx # Member submission view for dues & travel
│   │   └── TravelRequestSection.tsx
│   │
│   ├── router/
│   │   └── ViewRouter.tsx         # Strict role router directing to canvas views
│   │
│   ├── settings/
│   │   └── SettingsTab.tsx        # Settings & preferences tab
│   │
│   └── views/                     # Primary Canvas Views
│       ├── AdminCommandCanvas.tsx
│       ├── MemberPortalCanvas.tsx
│       └── TripartiteGovernanceCanvas.tsx
│
├── context/
│   ├── AuthContext.tsx            # Supabase Auth, active user, roster state & profile CRUD
│   ├── RequestsContext.tsx        # Dues receipts, travel permits, profile requests & real-time sync
│   ├── AnnouncementsContext.tsx   # Announcements state & filtering
│   └── ThemeContext.tsx           # Dark/Light theme mode state
│
├── data/
│   ├── initialLedger.ts           # Monthly ledger defaults & local storage persistence helpers
│   └── seedMockUsers.ts           # Initial seed profile records across all 7 tiers
│
├── lib/
│   └── supabase.ts                # Supabase client instance with realtime config
│
├── types/
│   ├── corper.ts                  # Profile types, gender, house status, executive posts, rooms
│   └── ledger.ts                  # Ledger entries, payment statuses, request payloads
│
└── utils/
    ├── fileProcessor.ts           # Image compression & base64 conversion
    ├── sanitizers.ts              # NYSC State code regex validation & target fee calculator
    ├── tierEvaluator.ts           # Tier evaluation engine (Tiers 1–7) & badge text mapping
    └── unitHelpers.ts             # Service unit display formatters
```

---

## 5. Data Models & TypeScript Contracts

### 5.1. Corper Profile (`src/types/corper.ts`)
```typescript
export type Gender = 'Male' | 'Female' | 'M' | 'F';
export type MaritalStatus = 'Not Engaged' | 'Engaged';
export type HouseStatus = 'Member' | 'Room Gov' | 'Delegate' | 'Executive' | 'Tripartite' | 'Gee' | 'Admin';
export type SystemCategory = 'member' | 'tripartite' | 'admin';
export type PresenceStatus = 'Present' | 'Travelled' | 'Moved On';

export interface TargetFees {
  maintenance: number;
  feeding: number;
}

export interface CorperProfile {
  id: string;
  userId?: string | null;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  stateCode: string;          // e.g., "RV/24C/0102"
  email: string;
  phone: string;
  dateOfBirth: string;        // YYYY-MM-DD
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
  displayName: string;
  tier: number;               // 1 through 7
  targets: TargetFees;
  avatarUrl?: string;
  hasTripartitePrivileges?: boolean;
}
```

### 5.2. Monthly Ledger Entry (`src/types/ledger.ts`)
```typescript
export type PaymentStatus = 'paid' | 'pending' | 'unpaid' | 'upcoming';
export type PaymentType = 'maintenance' | 'feeding' | 'combined';

export interface MonthLedgerEntry {
  monthKey: string;           // 'JAN', 'FEB', 'AUG', etc.
  monthName: string;          // 'January', 'August', etc.
  monthIndex: number;         // 0 to 11
  year: number;               // e.g. 2026
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
```

### 5.3. Submissions & Requests (`src/context/RequestsContext.tsx`)
* **DuesReceiptSubmission:** Tracks transaction IDs (`TXN-2026-AUG-XXXX`), submitted files, subscription type, amounts, review status, and reviewer timestamps.
* **TravelRequestSubmission:** Tracks permit IDs (`TR-2026-XXX`), departure/return dates, approved date overrides, travel reasons, and attached exeat letters.
* **ProfileChangeRequestSubmission:** Tracks room, unit, or marital status change requests.

---

## 6. Logic & Utility Engines

### 6.1. NYSC State Code Validation (`src/utils/sanitizers.ts`)
* **Regex Pattern:** `/^RV\/\d{2}[A-C]\/\d{4}$/i`
* **Format:** `RV/YY[Batch]/XXXX` (e.g., `RV/24A/0150`, `RV/24B/0200`, `RV/24C/0102`).
* Auto-formats input to uppercase and validates batch letters (A, B, C).

### 6.2. Target Fee Calculation (`calculateTargets`)
* **Default Assessment:** Maintenance Dues = **₦15,000**, Feeding Dues = **₦10,000** (Total = ₦25,000/month).
* **Tripartite & Admin Exemption:** Maintenance = **₦0**, Feeding = **₦0** for `systemCategory === 'admin'`, `systemCategory === 'tripartite'`, or `tier <= 3`.

### 6.3. Service Unit Display Formatter (`src/utils/unitHelpers.ts`)
* Automatically formats single or multiple service units (e.g. `Choir, Welfare`).
* Hides service unit rows for pure executive roles where `serviceUnit` equals `General Member` or is empty.

### 6.4. File Processing (`src/utils/fileProcessor.ts`)
* Handles image preview generation, canvas-based image resizing/compression (converting large camera captures into ~300KB web-friendly payloads), and PDF file metadata parsing.

---

## 7. Realtime & Persistence Flow Chart

```
                        +----------------------------+
                        |   User / Component Event   |
                        +--------------+-------------+
                                       |
                                       v
                        +----------------------------+
                        |  React Context Handler     |
                        | (Auth, Requests, Notice)   |
                        +--------------+-------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
    +------------------------------+        +------------------------------+
    | LocalStorage Direct Backup   |        | Supabase Async Mutation      |
    | (Immediate UI Re-render)     |        | (insert/update/upsert)       |
    +------------------------------+        +--------------+---------------+
                                                           |
                                                           v
                                            +------------------------------+
                                            | Supabase Realtime Channel    |
                                            | (postgres_changes broadcast) |
                                            +--------------+---------------+
                                                           |
                                                           v
                                            +------------------------------+
                                            | App-wide Context Listeners   |
                                            | (Syncs across all tabs)      |
                                            +------------------------------+
```

---

## 8. Development & Restoration Instructions

1. **Verify Dependencies:** Ensure `@supabase/supabase-js`, `lucide-react`, and standard React 18 packages are installed in `package.json`.
2. **Environment Configuration:** Confirm `.env.example` contains:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. **Running the App:**
   ```bash
   npm run dev
   ```
   *The dev server binds to `http://0.0.0.0:3000`.*
4. **Testing Role Perspectives:** Use the floating bottom-right **Dev Switcher** to toggle between Admin, Tripartite President, Executive, Delegate, and Member profiles.
