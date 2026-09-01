import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Calendar,
  Building,
  GraduationCap,
  Heart,
  Users,
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Camera,
  Eye,
  EyeOff,
  Image as ImageIcon
} from 'lucide-react';
import { NccfLogo } from '../NccfLogo';
import {
  RegistrationFormData,
  INITIAL_REGISTRATION_FORM,
  validateRegistrationStep,
} from '../../types/registration';
import { STATE_CODE_REGEX, isValidStateCode } from '../../utils/sanitizers';
import {
  MALE_ROOMS,
  FEMALE_ROOMS,
  ALL_EXECUTIVE_POSTS,
  NIGERIAN_STATES,
  ALL_SERVICE_UNITS,
  Gender,
  MaritalStatus,
  HouseStatus,
} from '../../types/corper';
import { submitMemberRegistration } from '../../services/registrationService';
import { uploadFileToStorage } from '../../utils/storage';
import { useToast } from '../../context/ToastContext';

interface RegistrationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const RegistrationWizardModal: React.FC<RegistrationWizardModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<RegistrationFormData>(INITIAL_REGISTRATION_FORM);
  const [stateCodeTouched, setStateCodeTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);

  // Avatar Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Container refs for scroll resets
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Always scroll form view to top whenever step changes
  useEffect(() => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      contentContainerRef.current.scrollTop = 0;
    }
    if (modalContainerRef.current) {
      modalContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
      modalContainerRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof RegistrationFormData, value: any) => {
    setStepError(null);
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      // Gender change auto-reselects default matching room
      if (field === 'gender') {
        const matchingRooms = value === 'Female' ? FEMALE_ROOMS : MALE_ROOMS;
        if (!matchingRooms.includes(updated.roomName as any)) {
          updated.roomName = matchingRooms[0];
        }
      }
      return updated;
    });
  };

  const handleToggleServiceUnit = (unit: string) => {
    setStepError(null);
    setFormData((prev) => {
      const current = prev.serviceUnits || [];
      const exists = current.includes(unit);
      let updated: string[];
      if (exists) {
        updated = current.filter((u) => u !== unit);
      } else {
        updated = [...current, unit];
      }
      return { ...prev, serviceUnits: updated };
    });
  };

  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Hard check: Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setStepError('Selected image exceeds 5MB limit. Please choose a smaller photo.');
      showToast('Image size exceeds 5MB maximum limit', 'error');
      return;
    }

    // Generate local preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase staged path
    setIsUploadingAvatar(true);
    try {
      const uploadRes = await uploadFileToStorage(file, 'avatars');
      if (uploadRes.success && uploadRes.publicUrl) {
        handleInputChange('avatarUrl', uploadRes.publicUrl);
        showToast('Profile photo ready!', 'success');
      }
    } catch (err) {
      console.warn('[AvatarUpload] Error uploading:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleNextStep = () => {
    const validation = validateRegistrationStep(currentStep, formData);
    if (!validation.isValid) {
      setStepError(validation.error || 'Please fill in all required fields.');
      return;
    }
    setStepError(null);
    setIsTransitioning(true);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    setTimeout(() => {
      setIsTransitioning(false);
    }, 350);
  };

  const handlePrevStep = () => {
    setStepError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitRegistration = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting || isTransitioning) return;

    const validation = validateRegistrationStep(currentStep, formData);
    if (!validation.isValid) {
      setStepError(validation.error || 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setStepError(null);

    try {
      const result = await submitMemberRegistration(formData);
      if (result.success) {
        setIsSuccessSubmitted(true);
        showToast('Registration submitted for Management review!', 'success');
      } else {
        setStepError(result.error || 'Failed to submit registration. Please try again.');
        showToast(result.error || 'Submission failed.', 'error');
      }
    } catch (err: any) {
      setStepError(err?.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter rooms based on selected gender
  const availableRooms = formData.gender === 'Female' ? FEMALE_ROOMS : MALE_ROOMS;

  return (
    <div ref={modalContainerRef} className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden my-auto text-zinc-900 dark:text-zinc-100"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <NccfLogo size={36} />
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Family House Registration
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Join the NCCF Rivers State Portal (Step {currentStep} of 4)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        {!isSuccessSubmitted && (
          <div className="px-5 pt-3 pb-1 bg-slate-100/50 dark:bg-zinc-900/30 border-b border-slate-200/60 dark:border-white/5">
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, title: 'Credentials' },
                { step: 2, title: 'Bio & Academics' },
                { step: 3, title: 'House Life' },
                { step: 4, title: 'Photo & Review' },
              ].map((item) => (
                <div key={item.step} className="flex flex-col space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      item.step <= currentStep
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : 'bg-slate-300 dark:bg-zinc-800'
                    }`}
                  />
                  <span
                    className={`text-[10px] truncate font-medium ${
                      item.step === currentStep
                        ? 'text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-zinc-400'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step Error Notice */}
        {stepError && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{stepError}</span>
          </div>
        )}

        {/* Modal Form Content */}
        <div ref={contentContainerRef} className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto">
          {isSuccessSubmitted ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white">
                  Application Submitted!
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                  ⏳ Application Submitted! Your registration is awaiting review by the Management. You will be able to log in once approved.
                </p>
                <p className="text-xs text-zinc-500">
                  State Code: <strong className="font-mono text-zinc-900 dark:text-white">{formData.stateCode.toUpperCase()}</strong>
                </p>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSuccess?.();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg transition-colors cursor-pointer"
                >
                  Return to Portal Login
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (currentStep === 4) {
                  handleSubmitRegistration(e);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && currentStep < 4) {
                  e.preventDefault();
                  handleNextStep();
                }
              }}
              className="space-y-4"
            >
              <AnimatePresence mode="wait">
                {/* ================= STEP 1: CREDENTIALS & IDENTITY ================= */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-slate-200 dark:border-white/10 pb-2 mb-3">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span>1. Personal Info & Account Set-Up</span>
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Enter your official NYSC credentials and create your portal password.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          First Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          placeholder="e.g. Tolu"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Middle Name (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.middleName}
                          onChange={(e) => handleInputChange('middleName', e.target.value)}
                          placeholder="e.g. Michael"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Last Name (Surname) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          placeholder="e.g. Adeleke"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            NYSC State Code <span className="text-rose-500">*</span>
                          </label>
                          <span className="text-[10px] text-zinc-400 font-mono">2 Letters / 2 Digits + [A-C] / 4 Digits</span>
                        </div>
                        <input
                          type="text"
                          required
                          value={formData.stateCode}
                          onChange={(e) => handleInputChange('stateCode', e.target.value.toUpperCase())}
                          onBlur={() => setStateCodeTouched(true)}
                          placeholder="e.g. RV/26A/1234"
                          className={`w-full px-3 py-2 text-xs font-mono uppercase rounded-xl bg-slate-50 dark:bg-zinc-900 border ${
                            stateCodeTouched && formData.stateCode.trim() && !isValidStateCode(formData.stateCode)
                              ? 'border-amber-500 ring-1 ring-amber-500/50 dark:border-amber-500'
                              : stateCodeTouched && isValidStateCode(formData.stateCode)
                              ? 'border-emerald-500 dark:border-emerald-500'
                              : 'border-slate-200 dark:border-white/10'
                          } focus:ring-2 focus:ring-blue-500 outline-none transition-colors`}
                        />

                        {stateCodeTouched && formData.stateCode.trim() && !isValidStateCode(formData.stateCode) && (
                          <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] leading-tight animate-in fade-in duration-200">
                            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                            <span>
                              Invalid format. Must be <strong>2 Letters / 2 Digits + Batch [A, B, or C] / 4 Digits</strong> (e.g. <strong>RV/26A/1234</strong>, <strong>LA/25B/0088</strong>, <strong>FC/24C/0102</strong>).
                            </span>
                          </div>
                        )}

                        {stateCodeTouched && isValidStateCode(formData.stateCode) && (
                          <div className="flex items-center gap-1 mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>Valid State Code format</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="e.g. name@example.com"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phoneNumber}
                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        placeholder="e.g. 09012345678"
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Create Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            placeholder="Min. 6 characters"
                            className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            title={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            placeholder="Repeat password"
                            className="w-full pl-3 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                            title={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 2: BIO & ACADEMICS ================= */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-slate-200 dark:border-white/10 pb-2 mb-3">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4 text-emerald-500" />
                        <span>2. GENCO Info</span>
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Information regarding your gender, origin, discipline, and emergency contact.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Gender <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value as Gender)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          State of Origin <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.stateOfOrigin}
                          onChange={(e) => handleInputChange('stateOfOrigin', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {NIGERIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Standard Date of Birth Picker */}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>Date of Birth</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none text-zinc-900 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Course of Study <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.courseOfStudy}
                          onChange={(e) => handleInputChange('courseOfStudy', e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          School Graduated From <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.schoolGraduatedFrom}
                          onChange={(e) => handleInputChange('schoolGraduatedFrom', e.target.value)}
                          placeholder="e.g. University of Port Harcourt"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Marital Status
                        </label>
                        <select
                          value={formData.maritalStatus}
                          onChange={(e) => handleInputChange('maritalStatus', e.target.value as MaritalStatus)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Not Engaged">Not Engaged</option>
                          <option value="Engaged">Engaged</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Next of Kin Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nextOfKinName}
                          onChange={(e) => handleInputChange('nextOfKinName', e.target.value)}
                          placeholder="e.g. Mr. John Adeleke"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Next of Kin Contact <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.nextOfKinPhone}
                          onChange={(e) => handleInputChange('nextOfKinPhone', e.target.value)}
                          placeholder="e.g. 08031234567"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 3: HOUSE LIFE & PLACEMENT ================= */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-slate-200 dark:border-white/10 pb-2 mb-3">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                        <Building className="w-4 h-4 text-purple-500" />
                        <span>3. Family House Info</span>
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Specify your room assignment, status, and service unit engagements.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          House Status <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.houseStatus}
                          onChange={(e) => handleInputChange('houseStatus', e.target.value as HouseStatus)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="Member">Member</option>
                          <option value="Room Gov">Room Gov</option>
                          <option value="Executive">Executive</option>
                          <option value="Gee">Gee</option>
                          <option value="Delegate">Delegate</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">
                          Room Name ({formData.gender === 'Female' ? "Sisters' Wing" : "Brothers' Wing"}) <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.roomName}
                          onChange={(e) => handleInputChange('roomName', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          {availableRooms.map((room) => (
                            <option key={room} value={room}>{room}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Conditional Executive Post for Executive & Gee */}
                    {(formData.houseStatus === 'Executive' || formData.houseStatus === 'Gee') && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-1.5"
                      >
                        <label className="block text-xs font-bold text-purple-700 dark:text-purple-300">
                          {formData.houseStatus === 'Gee' ? 'Executive Post Held (Honorary Portfolio)' : 'Executive Post Portfolio'} <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.executivePost}
                          onChange={(e) => handleInputChange('executivePost', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-purple-300 dark:border-purple-800 focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                          <option value="">-- Select Executive Post --</option>
                          {ALL_EXECUTIVE_POSTS.map((post) => (
                            <option key={post} value={post}>{post}</option>
                          ))}
                        </select>
                        <p className="text-[10px] text-zinc-500">
                          {formData.houseStatus === 'Gee'
                            ? 'Your badge will display as "Gee [Slogan]" (e.g. Gee Prayo, Gee TOS man) on the portal.'
                            : 'Executives are assigned standard Tier 4 assessment and oversight responsibilities.'}
                        </p>
                      </motion.div>
                    )}

                    {/* Service Units Multi-select Checkboxes - OPTIONAL */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Service Unit Engagements <span className="text-zinc-400 font-normal">(Optional - Select those that apply)</span>
                        </label>
                        {formData.serviceUnits.length === 0 && (
                          <span className="text-[10px] text-zinc-400">None selected</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ALL_SERVICE_UNITS.map((unit) => {
                          const isSelected = formData.serviceUnits.includes(unit);
                          return (
                            <button
                              key={unit}
                              type="button"
                              onClick={() => handleToggleServiceUnit(unit)}
                              className={`p-2 rounded-xl text-xs font-medium flex items-center space-x-2 text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                                  : 'bg-slate-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-slate-200 dark:border-white/10 hover:border-blue-400'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border ${
                                  isSelected ? 'border-white bg-blue-700' : 'border-zinc-400 dark:border-zinc-600'
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <span className="truncate">{unit}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ================= STEP 4: PHOTO & FINAL REVIEW ================= */}
                {currentStep === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-slate-200 dark:border-white/10 pb-2 mb-3">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
                        <Camera className="w-4 h-4 text-amber-500" />
                        <span>4. Profile Picture & Final Review</span>
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Upload your passport photograph (Max 5MB) and review your registration details before submitting.
                      </p>
                    </div>

                    {/* Avatar Upload Dropzone */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-white/10">
                      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-200 dark:bg-zinc-800 border-2 border-blue-500/50 shrink-0 flex items-center justify-center">
                        {avatarPreview || formData.avatarUrl ? (
                          <img
                            src={avatarPreview || formData.avatarUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-10 h-10 text-zinc-400" />
                        )}
                        {isUploadingAvatar && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <label className="cursor-pointer inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-colors">
                          <UploadCloud className="w-4 h-4" />
                          <span>{avatarPreview || formData.avatarUrl ? 'Change Passport Photo' : 'Upload Passport Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarFileSelect}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[11px] text-zinc-500">
                          Clear passport photo (PNG, JPG, or WebP). Maximum size: <strong>5MB</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Summary Overview Card */}
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 space-y-2 text-xs">
                      <div className="flex justify-between border-b border-slate-200 dark:border-white/10 pb-1.5 font-bold">
                        <span>Applicant:</span>
                        <span className="text-blue-600 dark:text-blue-400">
                          {formData.firstName} {formData.middleName} {formData.lastName}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-300">
                        <div>State Code: <strong className="font-mono text-zinc-900 dark:text-white">{formData.stateCode.toUpperCase()}</strong></div>
                        <div>Phone: <strong className="text-zinc-900 dark:text-white">{formData.phoneNumber}</strong></div>
                        <div>Email: <strong className="text-zinc-900 dark:text-white">{formData.email}</strong></div>
                        <div>Gender: <strong className="text-zinc-900 dark:text-white">{formData.gender}</strong></div>
                        <div>Date of Birth: <strong className="text-zinc-900 dark:text-white">{formData.dateOfBirth || 'Not specified'}</strong></div>
                        <div>Room: <strong className="text-zinc-900 dark:text-white">{formData.roomName}</strong></div>
                        <div>Status: <strong className="text-zinc-900 dark:text-white">{formData.houseStatus}</strong></div>
                        <div>Origin: <strong className="text-zinc-900 dark:text-white">{formData.stateOfOrigin}</strong></div>
                      </div>
                      <div className="pt-1 text-[11px] text-zinc-500 border-t border-slate-200 dark:border-white/10">
                        Service Units: <strong className="text-zinc-800 dark:text-zinc-200">{formData.serviceUnits.length > 0 ? formData.serviceUnits.join(', ') : 'None (No Unit)'}</strong>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Wizard Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/10">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                ) : <div />}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-colors flex items-center space-x-1.5 cursor-pointer ml-auto"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmitRegistration()}
                    disabled={isSubmitting || isTransitioning}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-colors flex items-center space-x-2 cursor-pointer ml-auto disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Submit Registration</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
