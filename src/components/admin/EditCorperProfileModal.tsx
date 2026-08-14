import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  CorperProfile,
  HouseStatus,
  PresenceStatus,
  MaritalStatus,
  SystemCategory,
  ALL_SERVICE_UNITS,
} from '../../types/corper';
import { isValidStateCode } from '../../utils/sanitizers';
import { X, CheckCircle2, GraduationCap, AlertCircle, Save, UserCheck, Home, Shield, User, Building, Phone, HeartPulse } from 'lucide-react';

export interface EditCorperProfileModalProps {
  user: CorperProfile | null;
  onClose: () => void;
}

const AVAILABLE_SERVICE_UNITS = ALL_SERVICE_UNITS;

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

const ROOM_NAMES =[
  '1G (Female)', '1G (Male)', '2G (Female)', '2G (Male)', 'David', 'Delegates (Female)',
  'Delegates (Male)', 'Esther', 'Hephzibah', 'Joseph', 'Judah', 'Lydia', 'Mary', 'Papa\'s',
  'Peace', 'Ruth',  'Shekinah','Tehilah','Timothy', 'Uncle\'s',
]

const EXECUTIVE_POST = [
  '','President (Papa)', 'General Secretary (Uncle)', 'Assistant General Secretary (Aunty)', 'Transport and Organizing Secretary (TOS Man)',
  'Welfare Secretary and Sisters\' Coordinator (Mama)', 'Prayer Secretary (Prayo)', 'Bible Study Secretary (Bishop)',
  'Evangelism Secretary (Rugged Man)', 'Treasurer (CBN)', 'Financial Secretary (IMF)', 'Music Director (MD)', 'Drama Director (DD)',
  'Business Development Officer (BDO)', 'Publicity Secretary (PubGreat)', 'Assistant Transport and Organizing Secretary (ATOS)', 'Chief Usher/Landlady (Landlady)',
  'Assistant Welfare/Brothers\' Coordinator (AC Papa)', 'Assistant Welfare and Sisters\' Coordinator (AC Mama)', 'Assistant Publicity Secretary (A. PubGreat)',
  'Assistant Evangelism Secretary (A. Rugged)', 'Assistant Music Director (A. MD)', 'Librarian'
]


export const EditCorperProfileModal: React.FC<EditCorperProfileModalProps> = ({ user, onClose }) => {
  const { updateUserProfile } = useAuth();
  const { showToast: triggerToast } = useToast();
  const [activeTab, setActiveTab] = useState<'personal' | 'genco' | 'house'>('personal');

  // 18 fields state
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('Not Engaged');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [stateOfOrigin, setStateOfOrigin] = useState('');
  const [courseOfStudy, setCourseOfStudy] = useState('');
  const [schoolGraduatedFrom, setSchoolGraduatedFrom] = useState('');

  const [stateCode, setStateCode] = useState('');
  const [houseStatus, setHouseStatus] = useState<HouseStatus>('Member');
  const [executivePost, setExecutivePost] = useState('');
  const [systemCategory, setSystemCategory] = useState<SystemCategory>('member');
  const [roomName, setRoomName] = useState('');
  const [serviceUnits, setServiceUnits] = useState<string[]>([]);
  const [presence, setPresence] = useState<PresenceStatus>('Present');
  const [isExempted, setIsExempted] = useState(false);

  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setMiddleName(user.middleName || '');
      setLastName(user.lastName || '');
      setGender(user.gender === 'Female' ? 'Female' : 'Male');
      setDateOfBirth(user.dateOfBirth || '1999-01-01');
      setMaritalStatus(user.maritalStatus || 'Not Engaged');

      setEmail(user.email || '');
      setPhone(user.phone || '');
      setNextOfKinName(user.nextOfKinName || '');
      setNextOfKinPhone(user.nextOfKinPhone || '');
      setStateOfOrigin(user.stateOfOrigin || 'Rivers');
      setCourseOfStudy(user.courseOfStudy || '');
      setSchoolGraduatedFrom(user.schoolGraduatedFrom || '');

      setStateCode(user.stateCode || '');
      setHouseStatus(user.houseStatus || 'Member');
      setExecutivePost(user.executivePost || '');
      setSystemCategory(user.systemCategory || 'member');
      setRoomName(user.roomName || 'Peace');
      setIsExempted(Boolean(user.isExempted));
      
      const units = user.serviceUnits && user.serviceUnits.length > 0
        ? user.serviceUnits
        : user.serviceUnit
        ? user.serviceUnit.split(',').map((s) => s.trim()).filter(Boolean)
        : ['Bible Study'];
      setServiceUnits(units);
      
      setPresence(user.presence || 'Present');
    }
  }, [user]);

  if (!user) return null;

  const isCodeValid = isValidStateCode(stateCode);

  const toggleServiceUnit = (unit: string) => {
    setServiceUnits((prev) =>
      prev.includes(unit) ? prev.filter((u) => u !== unit) : [...prev, unit]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !stateCode.trim()) {
      alert('Please fill out all required fields: First Name, Last Name, and NYSC State Code.');
      return;
    }

    const updatedUnits = serviceUnits.length > 0 ? serviceUnits : ['Bible Study'];

    updateUserProfile(user.id, {
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      gender,
      dateOfBirth,
      maritalStatus,

      email: email.trim(),
      phone: phone.trim(),
      nextOfKinName: nextOfKinName.trim() || undefined,
      nextOfKinPhone: nextOfKinPhone.trim() || undefined,
      stateOfOrigin,
      courseOfStudy: courseOfStudy.trim(),
      schoolGraduatedFrom: schoolGraduatedFrom.trim(),

      stateCode: stateCode.toUpperCase().trim(),
      houseStatus,
      executivePost: executivePost.trim() || undefined,
      systemCategory,
      systemAccessCategory: systemCategory,
      roomName: roomName.trim(),
      serviceUnits: updatedUnits,
      serviceUnit: updatedUnits.join(', '),
      presence,
      isExempted,
    });

    setShowToast(true);
    triggerToast(`Updated profile for ${firstName} ${lastName}`, 'success');
    setTimeout(() => {
      setShowToast(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                <span>Edit Corper Profile</span>
                {/* <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900/5 dark:bg-black/50 text-zinc-800 dark:text-zinc-200 border border-slate-900/10 dark:border-white/10 font-bold">
                  18-FIELD SCHEMA
                </span> */}
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Edit {user.firstName} {user.lastName} ({user.stateCode})'s Profile
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {showToast && (
          <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center space-x-2.5 shadow-lg animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Profile successfully updated! System targets & hous status recalculated instantly.</span>
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex items-center overflow-x-also space-x-2 border-b border-slate-900/10 dark:border-white/10 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center whitespace-nowrap shrink-0 space-x-2 ${
              activeTab === 'personal'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-slate-900/5 dark:hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('genco')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center whitespace-nowrap shrink-0 space-x-2 ${
              activeTab === 'genco'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-slate-900/5 dark:hover:bg-white/5'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            <span>GENCO Info</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('house')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center whitespace-nowrap shrink-0 space-x-2 ${
              activeTab === 'house'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-slate-900/5 dark:hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>House Info</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-4 text-xs sm:text-sm">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    NYSC State Code *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={stateCode}
                      onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                      placeholder="RV/26A/1234"
                      className="w-full min-h-[40px] py-2 px-3 pr-9 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-mono font-bold"
                      required
                    />
                    <div className="absolute right-3 top-2.5">
                      {isCodeValid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" title="Valid NYSC Regex" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" title="Invalid Format" />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="corper@nysc.gov.ng"
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08031234567"
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Emergency Information / Next of Kin */}
              <div className="pt-3 border-t border-slate-900/10 dark:border-white/10 space-y-3">
                <div className="flex items-center space-x-2">
                  <HeartPulse className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Emergency Information (Next of Kin)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                      Name of Next of Kin
                    </label>
                    <input
                      type="text"
                      value={nextOfKinName}
                      onChange={(e) => setNextOfKinName(e.target.value)}
                      placeholder="e.g. Mr. John Doe (Father)"
                      className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 text-zinc-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                      Contact of Next of Kin
                    </label>
                    <input
                      type="tel"
                      value={nextOfKinPhone}
                      onChange={(e) => setNextOfKinPhone(e.target.value)}
                      placeholder="e.g. 08031234567"
                      className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 text-zinc-900 dark:text-white font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENCO Info */}
          {activeTab === 'genco' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    State of Origin
                  </label>
                  <select
                    value={stateOfOrigin}
                    onChange={(e) => setStateOfOrigin(e.target.value)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  >
                    {NIGERIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Marital Status
                  </label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  >
                    <option value="Not Engaged">Not Engaged</option>
                    <option value="Engaged">Engaged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Course of Study
                  </label>
                  <input
                    type="text"
                    value={courseOfStudy}
                    onChange={(e) => setCourseOfStudy(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    School Graduated From
                  </label>
                  <input
                    type="text"
                    value={schoolGraduatedFrom}
                    onChange={(e) => setSchoolGraduatedFrom(e.target.value)}
                    placeholder="e.g. UNIPORT"
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HOUSE Info */}
          {activeTab === 'house' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    House Status
                  </label>
                  <select
                    value={houseStatus}
                    onChange={(e) => setHouseStatus(e.target.value as HouseStatus)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  >
                    <option value="Member">Member</option>
                    <option value="Room Gov">Room Gov</option>
                    <option value="Executive">Executive</option>
                    <option value="Delegate">Delegate</option>
                    <option value="Gee">Gee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Executive Post (If applicable)
                  </label>
                  <select
                    value={executivePost}
                    onChange={(e) => setExecutivePost(e.target.value)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  >
                    {EXECUTIVE_POST.map((ep) => (
                      <option key={ep} value={ep}>
                        {ep || 'None'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    System Access Category
                  </label>
                  <select
                    value={systemCategory}
                    onChange={(e) => setSystemCategory(e.target.value as SystemCategory)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-mono font-bold"
                  >
                    <option value="member">member</option>
                    <option value="tripartite">tripartite</option>
                    <option value="admin">admin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Room Assigned
                  </label>
                  <select
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  >
                    {ROOM_NAMES.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Presence Status
                  </label>
                  <select
                    value={presence}
                    onChange={(e) => setPresence(e.target.value as PresenceStatus)}
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  >
                    <option value="Present">Present</option>
                    <option value="Travelled">Travelled</option>
                    <option value="Moved On">Moved On</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Service Units (Multi-select)
                </label>
                <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 max-h-36 overflow-y-auto">
                  {AVAILABLE_SERVICE_UNITS.map((unit) => {
                    const isSelected = serviceUnits.includes(unit);
                    return (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => toggleServiceUnit(unit)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                            : 'bg-white/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {unit}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center space-x-2.5 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                <input
                  type="checkbox"
                  id="isExempted"
                  checked={isExempted}
                  onChange={(e) => setIsExempted(e.target.checked)}
                  className="w-4 h-4 rounded border-emerald-500/30 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isExempted" className="text-xs font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer select-none">
                  Exempt Corper from Dues Payment & Ledger Calculations (`isExempted`)
                </label>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-900/10 dark:border-white/10">
            <div className="flex items-center space-x-2">
              {activeTab !== 'personal' && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'house' ? 'genco' : 'personal')
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-900/10 dark:border-white/10 hover:bg-slate-900/5 dark:hover:bg-white/10"
                >
                  ← Previous
                </button>
              )}
              {activeTab !== 'house' && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(activeTab === 'personal' ? 'genco' : 'house')
                  }
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900/10 dark:bg-white/10 text-zinc-900 dark:text-white hover:bg-zinc-900/20"
                >
                  Next →
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-900/10 dark:border-white/10 font-bold hover:bg-slate-900/5 dark:hover:bg-white/10 text-xs sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-white inline-flex items-center space-x-2 text-xs sm:text-sm shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
