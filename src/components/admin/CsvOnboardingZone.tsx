import React, { useState, useRef } from 'react';
import { useAuth, mapCorperProfileToDbRow } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';
import { CorperProfile, HouseStatus, SystemCategory } from '../../types/corper';
import { isValidStateCode, calculateTargets, formatTruncatedName } from '../../utils/sanitizers';
import { evaluateTier } from '../../utils/tierEvaluator';
import { Upload, Download, CheckCircle2, AlertCircle, FileSpreadsheet, X, Users, Eye, ArrowRight, Trash2, RefreshCw } from 'lucide-react';

interface CsvOnboardingZoneProps {
  onOpenAddSingleModal?: () => void;
}

interface StagedCsvData {
  fileName: string;
  profiles: CorperProfile[];
  errorDetails: string[];
  totalRows: number;
}

export const CsvOnboardingZone: React.FC<CsvOnboardingZoneProps> = ({ onOpenAddSingleModal }) => {
  const { allUsers, setAllUsers, refetchRoster } = useAuth();
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [ingestionMode, setIngestionMode] = useState<'skip' | 'overwrite' | 'replaceAll'>('skip');
  const [isUploading, setIsUploading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [stagedData, setStagedData] = useState<StagedCsvData | null>(null);

  const [importStatus, setImportStatus] = useState<{
    successCount: number;
    errorCount: number;
    message: string;
    details?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSampleCsv = () => {
    const csvHeader = 'state_code,first_name,middle_name,last_name,gender,email,phone_number,date_of_birth,state_of_origin,course_of_study,school_graduated_from,marital_status,house_status,executive_post,system_category,room_name,service_units,presence,avatar_url,next_of_kin_name,next_of_kin_phone\n';
    const sampleRows = [
      "RV/26A/1102,Chinedu,O.,Okonkwo,M,chinedu@nysc.gov.ng,08031112233,1999-04-12,Enugu,Computer Science,University of Nigeria,Not Engaged,,,admin,NCCF State House,,Present,https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
      "RV/26A/2290,Victor,P,Odili,M,peter@nccf.org.ng,08149998877,2000-08-19,Kano,Microbiology,ABU Zaria,Not Engaged,Executive,President,tripartite,Papa's,Welfare,Present,https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250",
      'RV/26A/3341,David,A.,Adeyemi,M,david@nysc.gov.ng,08023334455,1998-11-05,Osun,Civil Engineering,OAU,Engaged,Member,,member,Judah,"Bible Study, Music",Travelled,https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
    ].join('\n');

    const blob = new Blob([csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'nccf_rivers_onboarding_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvTextForPreview = (text: string, fileName: string) => {
    setIsUploading(true);
    setImportStatus(null);

    const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      setImportStatus({
        successCount: 0,
        errorCount: 1,
        message: 'CSV file must contain a header row and at least one data row.',
      });
      setIsUploading(false);
      return;
    }

    const parseCsvLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = parseCsvLine(lines[0]).map((h) => h.trim());
    const dataRows = lines.slice(1);

    const errorDetails: string[] = [];
    const parsedProfiles: CorperProfile[] = [];

    dataRows.forEach((row, idx) => {
      const values = parseCsvLine(row);
      if (values.length < 2) return; // Skip empty/malformed rows

      const rowObj: Record<string, string> = {};
      headers.forEach((h, i) => {
        rowObj[h] = values[i] || '';
      });

      const stateCode = (rowObj.state_code || rowObj.stateCode || values[0] || '').toUpperCase();
      const firstName = rowObj.first_name || rowObj.firstName || values[1] || 'Corper';
      const middleName = rowObj.middle_name || rowObj.middleName || values[2] || undefined;
      const lastName = rowObj.last_name || rowObj.lastName || values[3] || 'Member';
      const gender = (rowObj.gender || 'M').toUpperCase().startsWith('F') ? 'F' : 'M';
      const email = rowObj.email || `${firstName.toLowerCase()}@nccf-rivers.org`;
      const phone = rowObj.phone_number || rowObj.phone || rowObj.phoneNumber || values[6] || '08000000000';
      const dateOfBirth = rowObj.date_of_birth || rowObj.dateOfBirth || rowObj.dob || values[7] || '1999-05-12';
      const stateOfOrigin = rowObj.state_of_origin || rowObj.stateOfOrigin || values[8] || 'Rivers';
      const courseOfStudy = rowObj.course_of_study || rowObj.courseOfStudy || values[9] || 'General Studies';
      const schoolGraduatedFrom = rowObj.school_graduated_from || rowObj.schoolGraduatedFrom || values[10] || 'University';
      const maritalStatus = (rowObj.marital_status || rowObj.maritalStatus || 'Not Engaged') as 'Engaged' | 'Not Engaged';
      const houseStatusRaw = (rowObj.house_status || rowObj.houseStatus || 'Member').trim();
      const houseStatus: HouseStatus = ['Member', 'Room Gov', 'Executive', 'Delegate', 'Gee'].includes(houseStatusRaw)
        ? (houseStatusRaw as HouseStatus)
        : 'Member';
      const executivePost = rowObj.executive_post || rowObj.executivePost || rowObj.postTitle || undefined;
      const serviceUnitRaw = rowObj.service_units || rowObj.serviceUnits || rowObj.serviceUnit || 'Bible Study';
      const serviceUnits = serviceUnitRaw.split(',').map((s) => s.trim()).filter(Boolean);
      const serviceUnit = serviceUnits.join(', ');
      const roomName = rowObj.room_name || rowObj.roomName || 'Peace';
      const systemCategory = (rowObj.system_category || rowObj.systemCategory || 'member') as SystemCategory;
      const presence = (rowObj.presence || 'Present') as any;
      const isExempted = String(rowObj.is_exempted || rowObj.isExempted || rowObj.exempted || '').toLowerCase() === 'true';
      const nextOfKinName = rowObj.next_of_kin_name || rowObj.nextOfKinName || rowObj.nok_name || rowObj.nokName || undefined;
      const nextOfKinPhone = rowObj.next_of_kin_phone || rowObj.nextOfKinPhone || rowObj.next_of_kin_contact || rowObj.nok_phone || rowObj.nokPhone || undefined;
      const existingUser = allUsers.find((u) => u.stateCode.toUpperCase() === stateCode.toUpperCase());
      const avatarUrl = rowObj.avatar_url || rowObj.avatarUrl || values[18] || existingUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150';

      if (!isValidStateCode(stateCode)) {
        errorDetails.push(`Row ${idx + 2}: Invalid NYSC State Code "${stateCode}"`);
        return;
      }

      const id = existingUser ? existingUser.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `corper-csv-${Date.now()}-${idx}`);
      const displayName = formatTruncatedName(firstName, lastName);

      const baseProfile: Partial<CorperProfile> = {
        id,
        stateCode,
        firstName,
        middleName,
        lastName,
        displayName,
        gender: gender === 'F' ? 'Female' : 'Male',
        email,
        phone,
        dateOfBirth,
        stateOfOrigin,
        courseOfStudy,
        schoolGraduatedFrom,
        maritalStatus,
        houseStatus,
        executivePost,
        serviceUnit,
        serviceUnits,
        roomName,
        systemCategory,
        systemAccessCategory: systemCategory,
        presence,
        avatarUrl,
        isExempted,
        nextOfKinName,
        nextOfKinPhone,
      };

      const targets = calculateTargets(baseProfile as CorperProfile);
      const tierInfo = evaluateTier({ ...baseProfile, targets } as CorperProfile);

      const fullProfile: CorperProfile = {
        ...(baseProfile as CorperProfile),
        targets,
        tier: tierInfo.tier,
      };

      parsedProfiles.push(fullProfile);
    });

    setIsUploading(false);

    if (parsedProfiles.length === 0) {
      setImportStatus({
        successCount: 0,
        errorCount: errorDetails.length,
        message: 'No valid corper records found in CSV file.',
        details: errorDetails,
      });
      return;
    }

    setStagedData({
      fileName,
      profiles: parsedProfiles,
      errorDetails,
      totalRows: dataRows.length,
    });
  };

  const handleExecuteIngestion = async () => {
    if (!stagedData) return;
    setIsExecuting(true);

    let profilesToIngest = [...stagedData.profiles];
    let skippedCount = 0;
    let errorDetails = [...stagedData.errorDetails];

    if (ingestionMode === 'skip') {
      const existingCodes = new Set(allUsers.map((u) => u.stateCode.toUpperCase()));
      const initialCount = profilesToIngest.length;
      profilesToIngest = profilesToIngest.filter((p) => {
        const isExist = existingCodes.has(p.stateCode.toUpperCase());
        if (isExist) {
          errorDetails.push(`State Code "${p.stateCode}" skipped (already exists in roster).`);
        }
        return !isExist;
      });
      skippedCount = initialCount - profilesToIngest.length;
    }

    try {
      if (ingestionMode === 'replaceAll' && supabase) {
        // Wipe existing records in Supabase before insertion
        await supabase.from('corpers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (profilesToIngest.length > 0 && supabase) {
        const dbRows = profilesToIngest.map(mapCorperProfileToDbRow);
        const { error } = await supabase.from('corpers').upsert(dbRows, { onConflict: 'state_code' });
        if (error) {
          console.warn('[Supabase CsvOnboardingZone] Ingestion error:', error.message);
        }
      }

      // Refresh clean roster from Supabase
      if (refetchRoster) {
        await refetchRoster();
      } else {
        // Fallback local update with strict state code deduplication
        setAllUsers((prev) => {
          if (ingestionMode === 'replaceAll') return profilesToIngest;
          const mergedMap = new Map<string, CorperProfile>();
          prev.forEach((u) => mergedMap.set(u.stateCode.toUpperCase(), u));
          profilesToIngest.forEach((p) => mergedMap.set(p.stateCode.toUpperCase(), p));
          return Array.from(mergedMap.values());
        });
      }

      setImportStatus({
        successCount: profilesToIngest.length,
        errorCount: skippedCount + stagedData.errorDetails.length,
        message: `Successfully ingested ${profilesToIngest.length} Corper record${profilesToIngest.length !== 1 ? 's' : ''} into database (${ingestionMode.toUpperCase()} mode).`,
        details: errorDetails.length > 0 ? errorDetails : undefined,
      });
      showToast(`Ingested ${profilesToIngest.length} Corper record(s) into database!`, 'success');

      // Reset staging preview
      setStagedData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setImportStatus({
        successCount: 0,
        errorCount: 1,
        message: `Failed to complete ingestion: ${err?.message || 'Unknown error'}`,
      });
      showToast(`Failed to complete CSV ingestion: ${err?.message || 'Error'}`, 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancelPreview = () => {
    setStagedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content) parseCsvTextForPreview(content, file.name);
        };
        reader.readAsText(file);
      } else {
        setImportStatus({
          successCount: 0,
          errorCount: 1,
          message: 'Please upload a valid .csv file.',
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) parseCsvTextForPreview(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.08),inset_0_1px_0_0_rgba(255,255,255,0.9)] dark:bg-zinc-950/60 dark:backdrop-blur-xl dark:border-white/10 dark:shadow-[0_12px_32px_0_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] rounded-2xl p-5 sm:p-6 space-y-4 transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900/10 dark:border-white/10 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white flex items-center space-x-2">
            <Upload className="w-5 h-5 text-zinc-900 dark:text-white flex-shrink-0" />
            <span>CSV Bulk Onboarding Dropzone</span>
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
            Drag and drop your CSV responses to preview and onboard new Corpers
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {onOpenAddSingleModal && (
            <button
              onClick={onOpenAddSingleModal}
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white shadow-md transition-all cursor-pointer w-full sm:w-auto"
            >
              <Users className="w-4 h-4" />
              <span>+ Add 1 Corper</span>
            </button>
          )}

          <button
            onClick={downloadSampleCsv}
            className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-bold bg-slate-900/5 dark:bg-black/50 text-zinc-900 dark:text-zinc-100 hover:bg-slate-900/10 dark:hover:bg-white/10 border border-slate-900/10 dark:border-white/10 transition-all cursor-pointer w-full sm:w-auto"
          >
            <Download className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span>Download CSV Template</span>
          </button>
        </div>
      </div>

      {/* STAGED CSV PREVIEW CONTAINER */}
      {stagedData ? (
        <div className="bg-emerald-500/5 dark:bg-emerald-950/20 border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white font-bold shadow-md">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                    CSV Pre-Ingestion Preview
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-mono text-[10px] font-bold">
                    UNSAVED STAGING
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  File: <span className="font-semibold text-zinc-900 dark:text-zinc-200">{stagedData.fileName}</span> ({stagedData.profiles.length} valid records from {stagedData.totalRows} rows)
                </p>
              </div>
            </div>

            <button
              onClick={handleCancelPreview}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors self-start sm:self-auto"
              title="Cancel & Discard Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Validation Errors warning if any */}
          {stagedData.errorDetails.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Validation Warnings ({stagedData.errorDetails.length} row issues skipped)</span>
              </div>
              <div className="max-h-20 overflow-y-auto font-mono text-[11px] opacity-90 space-y-0.5">
                {stagedData.errorDetails.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            </div>
          )}

          {/* TABLE PREVIEW (FIRST 10 ROWS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
              <span>Previewing First {Math.min(10, stagedData.profiles.length)} Records:</span>
              <span className="text-[11px] font-normal text-zinc-500">
                (Records will NOT be added to backend until an action is executed)
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-900/10 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 shadow-inner">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/5 dark:bg-black/40 text-zinc-600 dark:text-zinc-400 border-b border-slate-900/10 dark:border-white/10 font-mono">
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">State Code</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Gender</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Service Unit</th>
                    <th className="px-3 py-2">House Status</th>
                    <th className="px-3 py-2">Roster Match</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/5 dark:divide-white/5">
                  {stagedData.profiles.slice(0, 10).map((p, idx) => {
                    const isExistingMatch = allUsers.some(
                      (u) => u.stateCode.toUpperCase() === p.stateCode.toUpperCase()
                    );
                    return (
                      <tr key={p.id || idx} className="hover:bg-slate-900/5 dark:hover:bg-white/5 font-sans">
                        <td className="px-3 py-2 text-zinc-400 font-mono">{idx + 1}</td>
                        <td className="px-3 py-2 font-mono font-bold text-zinc-900 dark:text-white">
                          {p.stateCode}
                        </td>
                        <td className="px-3 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                          {p.firstName} {p.lastName}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{p.gender}</td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 truncate max-w-[140px]">
                          {p.email}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400 max-w-[120px] truncate">
                          {p.serviceUnit}
                        </td>
                        <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{p.houseStatus}</td>
                        <td className="px-3 py-2">
                          {isExistingMatch ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              Exists
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              New Record
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {stagedData.profiles.length > 10 && (
              <p className="text-[11px] text-zinc-500 text-center italic">
                ...and {stagedData.profiles.length - 10} more records ready for processing.
              </p>
            )}
          </div>

          {/* INGESTION ACTION OPTIONS */}
          <div className="space-y-2 pt-2 border-t border-emerald-500/20">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 font-mono block">
              Select Ingestion Action Mode:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIngestionMode('skip')}
                className={`p-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer ${
                  ingestionMode === 'skip'
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-md ring-2 ring-zinc-900 dark:ring-white border border-zinc-900 dark:border-white'
                    : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-slate-900/10 dark:border-white/10'
                }`}
              >
                <span className="font-bold flex items-center justify-between">
                  <span>1. Append / Skip Existing</span>
                  {ingestionMode === 'skip' && <CheckCircle2 className="w-4 h-4" />}
                </span>
                <span className="text-[10px] opacity-80 font-normal mt-1">
                  Add new rows only; ignore state codes already in roster
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIngestionMode('overwrite')}
                className={`p-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer ${
                  ingestionMode === 'overwrite'
                    ? 'bg-amber-500 text-zinc-950 font-black shadow-md ring-2 ring-amber-400 border border-amber-500'
                    : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-slate-900/10 dark:border-white/10'
                }`}
              >
                <span className="font-bold flex items-center justify-between">
                  <span>2. Overwrite Existing</span>
                  {ingestionMode === 'overwrite' && <CheckCircle2 className="w-4 h-4" />}
                </span>
                <span className="text-[10px] opacity-80 font-normal mt-1">
                  Update existing state codes; insert new records
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIngestionMode('replaceAll')}
                className={`p-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col justify-between cursor-pointer ${
                  ingestionMode === 'replaceAll'
                    ? 'border-red-500 bg-red-500/10 text-red-600 dark:text-red-400 ring-2 ring-red-500 font-bold shadow-md'
                    : 'bg-white/60 dark:bg-zinc-900/60 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-slate-900/10 dark:border-white/10'
                }`}
              >
                <span className="font-bold text-red-600 dark:text-red-400 flex items-center justify-between">
                  <span>3. Delete All & Replace</span>
                  {ingestionMode === 'replaceAll' && <Trash2 className="w-4 h-4" />}
                </span>
                <span className="text-[10px] opacity-80 font-normal mt-1">
                  Wipe entire active database roster and insert CSV only
                </span>
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS: CANCEL / EXECUTE */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-emerald-500/20">
            <button
              type="button"
              onClick={handleCancelPreview}
              disabled={isExecuting}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-slate-900/10 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 hover:bg-slate-900/20 dark:hover:bg-white/20 transition-all cursor-pointer w-full sm:w-auto"
            >
              Cancel & Discard
            </button>

            <button
              type="button"
              onClick={handleExecuteIngestion}
              disabled={isExecuting}
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer w-full sm:w-auto disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Ingesting to Database...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Confirm & Execute Ingestion ({stagedData.profiles.length} Records)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD DROPZONE WHEN NO PREVIEW IS STAGED */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-zinc-900 bg-zinc-900/5 dark:border-white dark:bg-white/10 scale-[1.01]'
              : 'border-slate-900/20 dark:border-white/20 hover:border-zinc-900 dark:hover:border-zinc-100 bg-slate-900/5 dark:bg-black/30'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv"
            className="hidden"
          />

          <div className="mx-auto w-12 h-12 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center mb-3 shadow-md">
            <FileSpreadsheet className="w-6 h-6" />
          </div>

          <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
            Drop your CSV file here!
          </h4>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 max-w-md mx-auto">
            Upload CSV to open the Pre-Ingestion Previewer and choose your preferred Onboarding Modal.
          </p>

          <div className="mt-3 inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-900/10 dark:bg-white/10 text-zinc-900 dark:text-zinc-100">
            <span>Click to browse files</span>
          </div>
        </div>
      )}

      {/* Import Status Alert */}
      {importStatus && (
        <div className="p-4 rounded-xl border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-black/50 space-y-2 relative animate-fadeIn">
          <button
            onClick={() => setImportStatus(null)}
            className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start space-x-2.5">
            {importStatus.successCount > 0 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">
                {importStatus.message}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 font-mono">
                Ingested: {importStatus.successCount} | Errors/Skipped: {importStatus.errorCount}
              </div>
            </div>
          </div>

          {importStatus.details && importStatus.details.length > 0 && (
            <div className="mt-2 text-xs font-mono bg-black/5 dark:bg-black/60 p-2.5 rounded-lg max-h-32 overflow-y-auto space-y-1 text-amber-700 dark:text-amber-300">
              {importStatus.details.map((d, i) => (
                <div key={i}>• {d}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
