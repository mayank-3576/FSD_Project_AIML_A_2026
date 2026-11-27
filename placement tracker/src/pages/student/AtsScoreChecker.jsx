import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Target,
  FileText,
  Briefcase,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  TrendingUp,
  RefreshCw,
  Clock,
  ArrowRight,
  Upload,
  Copy,
  ChevronRight,
} from 'lucide-react';

const SAMPLE_RESUME = `Raghav Bhatnagar
B.Tech CSE (AI & ML) | ABES Engineering College (032)
Email: raghav.bhatnagar@abes.ac.in | Phone: +91 98765 43210
GitHub: github.com/raghav-abes | LinkedIn: linkedin.com/in/raghav-bhatnagar

SUMMARY: Computer Science undergraduate specializing in Artificial Intelligence and Machine Learning with proven experience building distributed web applications, fine-tuning NLP transformer models, and architecting real-time WebSocket systems.

SKILLS:
- Languages: Python, JavaScript, TypeScript, C++, Java, SQL
- Frameworks: React, Node.js, Express, Next.js, FastAPI, PyTorch, TensorFlow
- Databases: PostgreSQL, MongoDB, Redis, SQLite
- Cloud & DevOps: Docker, AWS (S3, EC2), Git, Linux
- Core: Data Structures & Algorithms, System Design, REST APIs, Microservices

PROJECTS:
CampusRecruit AI: High-throughput recruitment portal for 2,500+ students, cutting coordinator time by 65%. Implemented resume parsing and ATS scoring with 94% alignment.
NeuroAssist: Deep convolutional neural network (ResNet-50) for medical scan anomaly detection with 93.8% validation accuracy.`;

export default function AtsScoreChecker() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState('');
  const [jdMode, setJdMode] = useState('drive'); // 'drive' | 'custom'
  const [customJdText, setCustomJdText] = useState('');
  const [customJobTitle, setCustomJobTitle] = useState('Target Technical Role');

  const [resumeMode, setResumeMode] = useState('saved'); // 'saved' | 'upload' | 'paste'
  const [resumeText, setResumeText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingDrives, setLoadingDrives] = useState(false);
  const [error, setError] = useState(null);

  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchDrives();
    fetchHistory();

    // Check if drive_id was passed via navigation query params
    const params = new URLSearchParams(location.search);
    const driveIdParam = params.get('drive_id');
    if (driveIdParam) {
      setSelectedDriveId(driveIdParam);
      setJdMode('drive');
    }
  }, [location.search]);

  const fetchDrives = async () => {
    try {
      setLoadingDrives(true);
      const res = await api.get('/drives?status=Open');
      if (res.success && res.drives) {
        setDrives(res.drives);
        if (!selectedDriveId && res.drives.length > 0) {
          const params = new URLSearchParams(location.search);
          const passedId = params.get('drive_id');
          setSelectedDriveId(passedId || String(res.drives[0].drive_id));
        }
      }
    } catch (e) {
      console.error('Failed to load drives:', e);
    } finally {
      setLoadingDrives(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ats-checker/history');
      if (res.success && res.history) {
        setHistory(res.history);
        if (!scanResult && res.history.length > 0) {
          setScanResult(res.history[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const handleLoadSampleResume = () => {
    setResumeMode('paste');
    setResumeText(SAMPLE_RESUME);
    setSelectedFile(null);
  };

  const handleScoreAts = async () => {
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();

      // JD setup
      if (jdMode === 'drive') {
        if (!selectedDriveId) throw new Error('Please select an active placement drive');
        formData.append('drive_id', selectedDriveId);
      } else {
        if (!customJdText.trim()) throw new Error('Please enter the target Job Description');
        formData.append('jd_text', customJdText);
        formData.append('job_title', customJobTitle);
      }

      // Resume setup
      if (resumeMode === 'upload' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (resumeMode === 'paste' && resumeText.trim()) {
        formData.append('resume_text', resumeText);
      } else if (resumeMode === 'saved') {
        // backend automatically falls back to student's saved profile resume_text
        formData.append('resume_text', '');
      } else {
        throw new Error('Please select or provide a resume');
      }

      const res = await api.post('/ats-checker/score', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success && res.scan) {
        setScanResult(res.scan);
        fetchHistory();
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate ATS match score');
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityBadge = (prob) => {
    switch (prob) {
      case 'High':
      case 'High Shortlist Chance':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Moderate':
      case 'Moderate Shortlist Chance':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const selectedDrive = drives.find((d) => String(d.drive_id) === String(selectedDriveId));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded border border-blue-400/30">
                ABES TPO Recruiter Filters
              </span>
              <span className="text-xs text-slate-300">Semantic Keyword Matching</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">ATS Resume & Job Description Matcher</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Benchmark your resume against specific company placement drives or custom job descriptions to diagnose keyword gaps, match percentage, and shortlist probability.
            </p>
          </div>

          <button
            onClick={handleLoadSampleResume}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold backdrop-blur transition-colors shrink-0 text-white"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Load Sample ABES Resume</span>
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drive/JD Selector + Resume Source (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Job Description Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Step 1: Select Target Role / JD</span>
            </h2>

            <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setJdMode('drive')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  jdMode === 'drive' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Campus Drive ({drives.length})
              </button>
              <button
                type="button"
                onClick={() => setJdMode('custom')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  jdMode === 'custom' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Custom JD Paste
              </button>
            </div>

            {jdMode === 'drive' ? (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-700">
                  Select ABES Placement Drive
                </label>
                <select
                  value={selectedDriveId}
                  onChange={(e) => setSelectedDriveId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {drives.map((d) => (
                    <option key={d.drive_id} value={d.drive_id}>
                      {d.company_name} — {d.job_role} ({d.ctc_lpa} LPA)
                    </option>
                  ))}
                </select>

                {selectedDrive && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Company:</span>
                      <strong className="text-slate-900">{selectedDrive.company_name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Package / Location:</span>
                      <span className="text-slate-700">
                        {selectedDrive.ctc_lpa} LPA • {selectedDrive.location}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Eligibility:</span>
                      <span className="text-slate-700">
                        CGPA {selectedDrive.min_cgpa}+ • Max {selectedDrive.max_backlogs} Backlogs
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Target Job Title</label>
                  <input
                    type="text"
                    value={customJobTitle}
                    onChange={(e) => setCustomJobTitle(e.target.value)}
                    placeholder="e.g. SDE-1 (Backend)"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Paste Full Job Description Text
                  </label>
                  <textarea
                    rows={6}
                    value={customJdText}
                    onChange={(e) => setCustomJdText(e.target.value)}
                    placeholder="Paste job overview, requirements, must-have skills, and qualifications..."
                    className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Resume Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Step 2: Provide Your Resume</span>
            </h2>

            <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setResumeMode('saved')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  resumeMode === 'saved' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Profile Resume
              </button>
              <button
                type="button"
                onClick={() => setResumeMode('upload')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  resumeMode === 'upload' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setResumeMode('paste')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  resumeMode === 'paste' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste Text
              </button>
            </div>

            {resumeMode === 'saved' && (
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Using your verified ABES student profile resume on file (
                  <strong>{user?.name || 'Raghav Bhatnagar'}</strong>).
                </span>
              </div>
            )}

            {resumeMode === 'upload' && (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
                <Upload className="w-6 h-6 text-blue-600 mb-1" />
                <span className="text-xs font-medium text-slate-700 text-center">
                  {selectedFile ? selectedFile.name : 'Upload PDF, DOCX, or TXT'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            )}

            {resumeMode === 'paste' && (
              <textarea
                rows={6}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste raw resume content here..."
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            )}

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleScoreAts}
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Comparing Semantic Keywords...</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  <span>Run ATS Comparison Scan</span>
                </>
              )}
            </button>
          </div>

          {/* Past Scan History Card */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Previous Scans ({history.length})</span>
              </h3>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {history.map((scan) => (
                  <button
                    key={scan.scan_id}
                    onClick={() => setScanResult(scan)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                      scanResult?.scan_id === scan.scan_id
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <span className="font-semibold text-slate-800 block truncate">
                        {scan.job_title}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(scan.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-900 block">{Math.round(scan.match_score)}%</span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${getProbabilityBadge(
                          scan.shortlist_probability
                        )}`}
                      >
                        {scan.shortlist_probability}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scan Results Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {scanResult ? (
            <>
              {/* Score Indicator & Shortlist Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-5">
                    {/* Circular Score Gauge */}
                    <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-slate-100"
                          strokeWidth="3.5"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={
                            scanResult.match_score >= 80
                              ? 'text-emerald-500'
                              : scanResult.match_score >= 60
                              ? 'text-blue-500'
                              : 'text-amber-500'
                          }
                          strokeDasharray={`${scanResult.match_score}, 100`}
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-2xl font-black text-slate-900 leading-none">
                          {Math.round(scanResult.match_score)}%
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Match</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">{scanResult.job_title}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getProbabilityBadge(
                            scanResult.shortlist_probability
                          )}`}
                        >
                          {scanResult.shortlist_probability}
                        </span>
                        <span className="text-xs text-slate-500">
                          Scanned on {new Date(scanResult.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedDrive && (
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => navigate('/drives')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>View Drive Details</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          navigate(`/ai-interview?role=${encodeURIComponent(selectedDrive.job_role)}&drive_id=${selectedDrive.drive_id}`)
                        }
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Practice AI Interview</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Sub-scores Grid */}
                {scanResult.keyword_breakdown && (
                  <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Must-Have Match</span>
                      <span className="text-base font-bold text-slate-900">
                        {scanResult.keyword_breakdown.must_have_match_pct || Math.round(scanResult.match_score)}%
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Good-To-Have</span>
                      <span className="text-base font-bold text-slate-900">
                        {scanResult.keyword_breakdown.good_to_have_match_pct || Math.round(scanResult.match_score * 0.9)}%
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Cosine Similarity</span>
                      <span className="text-base font-bold text-slate-900">
                        {scanResult.keyword_breakdown.cosine_similarity || '0.86'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Matched Keywords (Green Chips) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Matched Keywords ({scanResult.matched_keywords?.length || 0})</span>
                  </h4>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    Present in your resume
                  </span>
                </div>

                {scanResult.matched_keywords && scanResult.matched_keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {scanResult.matched_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No direct keyword overlap found.</p>
                )}
              </div>

              {/* Missing Must-Have Skills (Red Chips) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Missing Must-Have Skills ({scanResult.missing_must_have?.length || 0})</span>
                  </h4>
                  <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full font-medium">
                    Critical for shortlist
                  </span>
                </div>

                {scanResult.missing_must_have && scanResult.missing_must_have.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {scanResult.missing_must_have.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs font-semibold"
                      >
                        <XCircle className="w-3 h-3 text-rose-600" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-medium">
                    🎉 Excellent! No critical must-have skills are missing.
                  </p>
                )}
              </div>

              {/* Missing Good-to-Have Skills (Amber Chips) */}
              {scanResult.missing_good_to_have && scanResult.missing_good_to_have.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Missing Good-to-Have Skills ({scanResult.missing_good_to_have.length})</span>
                    </h4>
                    <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                      Bonus differentiator
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {scanResult.missing_good_to_have.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold"
                      >
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Recommendations */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Actionable Keyword Placement Suggestions</span>
                </h4>

                <div className="space-y-2">
                  {(scanResult.recommendations && scanResult.recommendations.length > 0
                    ? scanResult.recommendations
                    : [
                        'Incorporate missing must-have keywords naturally into your technical skills section.',
                        'Demonstrate application of target tools in your project bullets with quantified metrics.',
                        'Align terminology (e.g., RESTful APIs, Microservices, CI/CD) with the exact phrasing in the Job Description.',
                      ]
                  ).map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Compare Resume with Drive JD</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-5">
                Select an active drive on the left or paste a job description to see your circular match percentage, matched keywords, and missing must-haves.
              </p>
              <button
                onClick={handleLoadSampleResume}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition-colors"
              >
                Load Sample Raghav Bhatnagar Resume
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
