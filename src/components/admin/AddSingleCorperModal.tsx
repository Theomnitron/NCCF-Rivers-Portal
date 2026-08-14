import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HouseStatus, SystemCategory, PresenceStatus } from '../../types/corper';
import { isValidStateCode } from '../../utils/sanitizers';
import { X, UserPlus, CheckCircle2, AlertCircle, Save, HeartPulse } from 'lucide-react';

interface AddSingleCorperModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddSingleCorperModal: React.FC<AddSingleCorperModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const { addSingleCorper } = useAuth();
  const { showToast } = useToast();

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1999-05-12');
  const [stateOfOrigin, setStateOfOrigin] = useState('Rivers');
  const [courseOfStudy, setCourseOfStudy] = useState('Computer Science');
  const [schoolGraduatedFrom, setSchoolGraduatedFrom] = useState('University of Port Harcourt');
  const [maritalStatus, setMaritalStatus] = useState<'Engaged' | 'Not Engaged'>('Not Engaged');
  const [houseStatus, setHouseStatus] = useState<HouseStatus>('Member');
  const [postTitle, setPostTitle] = useState('');
  const [roomName, setRoomName] = useState('1G (Female)');
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['Bible Study']);
  const [systemCategory, setSystemCategory] = useState<SystemCategory>('member');
  const [presence, setPresence] = useState<PresenceStatus>('Present');
  const [hasTripartitePrivileges, setHasTripartitePrivileges] = useState(false);
  const [isExempted, setIsExempted] = useState(false);

  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const availableRoomsList = [
    '1G (Female)',
    '1G (Male)',
    '2G (Female)',
    '2G (Male)',
    'David',
    'Delegates (Female)',
    'Delegates (Male)',
    'Esther',
    'Hephzibah',
    'Joseph',
    'Judah',
    'Lydia',
    'Mary',
    'Papa\'s',
    'Peace',
    'Ruth',
    'Shekinah',
    'Tehilah',
    'Timothy',
    'Uncle\'s',
  ];

  const availableStateOfOrigin = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', // FCT
    'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
    'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
    'Taraba', 'Yobe', 'Zamfara'
  ]

  const availableServiceUnits = [
    'Bible Study',
    'Choir',
    'Evangelism',
    'Welfare',
    'Prayer',
    'Publicity',
    'Ushering',
  ];

  const toggleUnit = (unit: string) => {
    if (selectedUnits.includes(unit)) {
      if (selectedUnits.length > 1) {
        setSelectedUnits(selectedUnits.filter((u) => u !== unit));
      }
    } else {
      setSelectedUnits([...selectedUnits, unit]);
    }
  };

  const isCodeValid = isValidStateCode(stateCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !stateCode.trim()) return;

    const fullServiceUnitString = selectedUnits.join(', ');

    addSingleCorper({
      firstName,
      middleName: middleName.trim() || undefined,
      lastName,
      stateCode,
      gender,
      email,
      phone,
      nextOfKinName: nextOfKinName.trim() || undefined,
      nextOfKinPhone: nextOfKinPhone.trim() || undefined,
      dateOfBirth,
      stateOfOrigin,
      courseOfStudy,
      schoolGraduatedFrom,
      maritalStatus,
      houseStatus,
      executivePost: houseStatus === 'Executive' ? postTitle : undefined,
      roomName,
      serviceUnit: fullServiceUnitString,
      systemCategory,
      presence,
      hasTripartitePrivileges,
      isExempted,
    });

    setShowSuccessToast(true);
    showToast(`Added single Corper record (${firstName} ${lastName})`, 'success');
    setTimeout(() => {
      setShowSuccessToast(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-slate-900/10 dark:border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto relative">
        
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-900/10 dark:border-white/10 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
                Add Single Corper Record
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Register individual Corpers into the  House database
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {showSuccessToast && (
          <div className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>New Corper registered! Roster & targets automatically computed.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
          
          {/* PERSONAL & IDENTIFICATION */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Personal Identification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Blessing"
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Middle Name <span className="text-zinc-400 font-normal">(Opt)</span>
                </label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="e.g. O."
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Amadi"
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'M' | 'F')}
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  NYSC State Code <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value.toUpperCase())}
                    placeholder="RV/26A/1234"
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-mono font-bold uppercase"
                    required
                  />
                  <div className="absolute right-3 top-2.5">
                    {isCodeValid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. blessing@nysc.gov.ng"
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 08031234567"
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Emergency Info (Next of Kin) */}
            <div className="pt-2 border-t border-slate-900/10 dark:border-white/10 space-y-2">
              <div className="flex items-center space-x-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-mono">
                  Emergency Info (Next of Kin)
                </h4>
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
                    placeholder="e.g. Mrs. Mary Adeleke"
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
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-rose-500/20 dark:border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/20 text-zinc-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GENCO Info */}
          <div className="space-y-3 pt-2 border-t border-slate-900/10 dark:border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              GENCO Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  State of Origin
                </label>
                <select
                  value={stateOfOrigin}
                  onChange={(e) => setStateOfOrigin(e.target.value)}
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium cursor-pointer"
                >
                  {availableStateOfOrigin.map((so) => (
                    <option key={so} value={so}>
                      {so}
                    </option>
                  ))}
                </select>
              </div>
              {/* <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  State of Origin
                </label>
                <input
                  type="text"
                  value={stateOfOrigin}
                  onChange={(e) => setStateOfOrigin(e.target.value)}
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                />
              </div> */}

              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Marital Status
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value as 'Engaged' | 'Not Engaged')}
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                >
                  <option value="Not Engaged">Not Engaged</option>
                  <option value="Engaged">Engaged</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Course of Study
                </label>
                <input
                  type="text"
                  value={courseOfStudy}
                  onChange={(e) => setCourseOfStudy(e.target.value)}
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
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Family House Info */}
          <div className="space-y-3 pt-2 border-t border-slate-900/10 dark:border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Family House Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  House Status
                </label>
                <select
                  value={houseStatus}
                  onChange={(e) => setHouseStatus(e.target.value as HouseStatus)}
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value="Member">Member</option>
                  <option value="Room Gov">Room Gov</option>
                  <option value="Executive">Executive</option>
                  <option value="Delegate">Delegate</option>
                  <option value="Gee">Gee</option>
                </select>
              </div>

              {/* CONDITIONAL POST TITLE INPUT IF EXECUTIVE */}
              {houseStatus === 'Executive' && (
                <div>
                  <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                    Executive Post Title
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g. State President"
                    className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Room Name
                </label>
                <select
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium cursor-pointer"
                >
                  {availableRoomsList.map((rm) => (
                    <option key={rm} value={rm}>
                      {rm}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SERVICE UNITS MULTI-SELECT CHECKBOXES */}
            <div>
              <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1.5">
                Service Unit(s) <span className="text-zinc-400 font-normal">(Select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2 bg-slate-900/5 dark:bg-black/40 p-2.5 rounded-xl border border-slate-900/10 dark:border-white/10">
                {availableServiceUnits.map((unit) => {
                  const isChecked = selectedUnits.includes(unit);
                  return (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => toggleUnit(unit)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                          : 'bg-white/60 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {isChecked ? '✓ ' : ''}{unit}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  System Access Category
                </label>
                <select
                  value={systemCategory}
                  onChange={(e) => setSystemCategory(e.target.value as SystemCategory)}
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-bold font-mono cursor-pointer"
                >
                  <option value="member">member</option>
                  <option value="tripartite">tripartite</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-800 dark:text-zinc-300 font-semibold mb-1">
                  Presence Status
                </label>
                <select
                  value={presence}
                  onChange={(e) => setPresence(e.target.value as PresenceStatus)}
                  className="w-full min-h-[40px] py-2 px-3 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-white font-medium cursor-pointer"
                >
                  <option value="Present">Present</option>
                  <option value="Travelled">Travelled</option>
                  <option value="Moved On">Moved On</option>
                </select>
              </div>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="hasTripartitePrivileges"
                  checked={hasTripartitePrivileges}
                  onChange={(e) => setHasTripartitePrivileges(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-900/20 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <label htmlFor="hasTripartitePrivileges" className="text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer">
                  Grant Tripartite-Level Privileges (`hasTripartitePrivileges`)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isExempted"
                  checked={isExempted}
                  onChange={(e) => setIsExempted(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-900/20 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isExempted" className="text-xs font-bold text-emerald-800 dark:text-emerald-300 cursor-pointer">
                  Exempt from Dues (`isExempted`)
                </label>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-900/10 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-900/10 dark:border-white/10 font-bold hover:bg-slate-900/5 dark:hover:bg-white/10 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold hover:bg-zinc-800 dark:hover:bg-white inline-flex items-center space-x-2 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Create Corper Record</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
