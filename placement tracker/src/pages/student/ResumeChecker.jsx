import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';

const SAMPLE_RESUME = `Raghav Bhatnagar
B.Tech in Computer Science and Engineering (AI & ML)
ABES Engineering College, Ghaziabad (Code: 032) | Batch 2024–2028
Email: raghav.bhatnagar@abes.ac.in | Phone: +91 98765 43210
GitHub: github.com/raghav-abes | LinkedIn: linkedin.com/in/raghav-bhatnagar

PROFESSIONAL SUMMARY
Proactive Computer Science undergraduate specializing in Artificial Intelligence and Machine Learning with proven experience building distributed web applications, fine-tuning NLP transformer models, and architecting real-time WebSocket systems. Achieved 99.4th percentile in national algorithmic coding challenges.

TECHNICAL SKILLS
- Programming Languages: Python, JavaScript, TypeScript, C++, Java, SQL
- Frameworks & Libraries: React, Node.js, Express, Next.js, FastAPI, PyTorch, TensorFlow
- Databases & Caching: PostgreSQL, MongoDB, Redis, SQLite
- Cloud & DevOps: Docker, AWS (S3, EC2), Git, GitHub Actions, Linux
- Core Competencies: Data Structures & Algorithms, System Design, REST APIs, Microservices

KEY PROJECTS
CampusRecruit AI — Full-Stack Recruitment & Interview Analytics Platform
- Architected high-throughput recruitment portal serving 2,500+ active engineering students, slashing placement coordinator turnaround time by 65%.
- Implemented asynchronous resume parsing and ATS scoring pipeline utilizing deterministic TF-IDF and transformer embeddings, achieving 94% alignment accuracy.
- Engineered WebSocket-based real-time proctored coding sandbox with WebRTC audio streaming, processing over 120 concurrent candidate evaluations.

NeuroAssist — Real-Time Medical Imaging Diagnostic Suite
- Developed deep convolutional neural network (ResNet-50) for chest X-ray anomaly detection, reaching 93.8% validation accuracy across 45,000 public scans.
- Optimized inference latency by 40% utilizing TensorRT quantization and deployed model behind an asynchronous FastAPI microservice.

EXPERIENCE
Software Engineering Intern | TechVentures Labs, Noida (June 2025 – August 2025)
- Spearheaded migration of legacy monolithic payment service to containerized Docker microservices on AWS, reducing p99 latency from 450ms to 85ms.
- Collaborated with 5 senior engineers to implement CI/CD test automation pipelines with Jest and GitHub Actions, boosting code coverage to 88%.

EDUCATION & CERTIFICATIONS
- B.Tech in CSE (AI & ML) — ABES Engineering College, Ghaziabad | CGPA: 8.6 / 10.0 (2024–2028)
- AWS Certified Cloud Practitioner (2025)
- LeetCode Guardian Badge (Knight rating 1940+)`;

export default function ResumeChecker() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [resumeText, setResumeText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [history, setHistory] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [expandedSection, setExpandedSection] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/resume-checker/history');
      if (res.success && res.history) {
        setHistory(res.history);
        if (!auditData && res.history.length > 0) {
          setAuditData(res.history[0]);
        }
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    setActiveTab('paste');
    setResumeText(SAMPLE_RESUME);
    setSelectedFile(null);
  };

  const handleAnalyze = async () => {
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (activeTab === 'upload' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (resumeText.trim()) {
        formData.append('resume_text', resumeText);
      } else {
        throw new Error('Please select a file or paste your resume text');
      }

      const res = await api.post('/resume-checker/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success && res.audit) {
        setAuditData(res.audit);
        fetchHistory();
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'Interview-Ready':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Competitive':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Needs Polish':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-400/30">
                ABES TPO AI Readiness
              </span>
              <span className="text-xs text-slate-300">0–100 Diagnostic</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">AI Resume Auditor & STAR Optimizer</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Inspect your technical resume against tier-1 recruitment filters. Evaluate section completeness, action verbs, quantified metrics, and auto-generate high-impact STAR rewrites.
            </p>
          </div>
          <button
            onClick={handleLoadSample}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold backdrop-blur transition-colors shrink-0 text-white"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Load Sample ABES Resume</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Input Form & Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload / Paste Input (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Resume Input</span>
            </h2>

            {/* Input Mode Toggle */}
            <div className="flex rounded-lg bg-slate-100 p-1 mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  activeTab === 'upload' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File (PDF / DOCX / TXT)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex-1 py-1.5 rounded-md transition-colors ${
                  activeTab === 'paste' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Paste Text
              </button>
            </div>

            {/* Tab: Upload File */}
            {activeTab === 'upload' && (
              <div className="space-y-3">
                <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
                  <Upload className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-slate-700 text-center">
                    {selectedFile ? selectedFile.name : 'Choose or drag & drop resume file'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">Accepts PDF, DOCX, or TXT (Max 10MB)</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {selectedFile && (
                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-100 p-2 rounded-lg">
                    <span className="truncate">{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-rose-600 hover:underline shrink-0 ml-2"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Paste Text */}
            {activeTab === 'paste' && (
              <div>
                <textarea
                  rows={14}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your raw resume text here (including contact info, technical skills, project bullets, and experience)..."
                  className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                  <span>{resumeText ? `${resumeText.split(/\s+/).filter(Boolean).length} words` : '0 words'}</span>
                  {resumeText && (
                    <button
                      onClick={() => setResumeText('')}
                      className="text-rose-600 hover:underline"
                    >
                      Clear text
                    </button>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'paste' && !resumeText.trim())}
              className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Auditing Resume Structure & Metrics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Comprehensive Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Past Scan History Card */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Recent Audits ({history.length})</span>
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {history.map((item) => (
                  <button
                    key={item.audit_id}
                    onClick={() => setAuditData(item)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                      auditData?.audit_id === item.audit_id
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-100 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="font-semibold text-slate-800">
                        Score: {item.overall_score}/100
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {new Date(item.created_at).toLocaleDateString()} at{' '}
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeColor(
                        item.grade_badge
                      )}`}
                    >
                      {item.grade_badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Diagnostic Report (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {auditData ? (
            <>
              {/* Score Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-bold shadow-inner ${getScoreColor(
                        auditData.overall_score
                      )}`}
                    >
                      <span className="text-2xl leading-none">{Math.round(auditData.overall_score)}</span>
                      <span className="text-[10px] font-medium opacity-80">/ 100</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-900">Resume Quality Score</span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getBadgeColor(
                            auditData.grade_badge
                          )}`}
                        >
                          {auditData.grade_badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Readability Grade: <strong className="text-slate-700">{auditData.formatting_checks?.readability_grade || 'B+'}</strong> • Word Count: <strong className="text-slate-700">{auditData.formatting_checks?.word_count || 0}</strong> words
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-medium">
                      Est. {auditData.formatting_checks?.page_count || 1} Page(s)
                    </span>
                  </div>
                </div>

                {/* Section Completeness Breakdown Bars */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Section Completeness Diagnostic
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(auditData.section_scores || {}).map(([sec, val]) => (
                      <div key={sec} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="capitalize font-semibold text-slate-700">{sec}</span>
                          <span className="font-bold text-slate-900">{val}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              val >= 80 ? 'bg-emerald-500' : val >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Metrics & Verbs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Action Verbs</span>
                    <p className="text-xl font-bold text-blue-900 mt-1">
                      {auditData.impact_analysis?.action_verbs_count || 0}
                    </p>
                    <span className="text-[10px] text-blue-600">Architected, engineered, deployed</span>
                  </div>

                  <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-indigo-700 uppercase tracking-wider">Quantified Metrics</span>
                    <p className="text-xl font-bold text-indigo-900 mt-1">
                      {auditData.impact_analysis?.metrics_count || 0}
                    </p>
                    <span className="text-[10px] text-indigo-600">%, ms latency, users, scale numbers</span>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
                    <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Weak Phrases Flagged</span>
                    <p className="text-xl font-bold text-amber-900 mt-1">
                      {auditData.impact_analysis?.weak_phrases_found?.length || 0}
                    </p>
                    <span className="text-[10px] text-amber-600">
                      {auditData.impact_analysis?.weak_phrases_found?.length > 0
                        ? auditData.impact_analysis.weak_phrases_found.slice(0, 2).join(', ')
                        : 'None detected! Excellent'}
                    </span>
                  </div>
                </div>

                {/* Issues Detected */}
                {auditData.formatting_checks?.issues?.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <h5 className="text-xs font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Formatting Recommendations</span>
                    </h5>
                    <ul className="list-disc list-inside text-xs text-amber-800 space-y-1">
                      {auditData.formatting_checks.issues.map((iss, i) => (
                        <li key={i}>{iss}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* STAR-Style Bullet Rewrites Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-900">STAR-Method Bullet Rewriter</h3>
                  </div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200">
                    High Impact
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  Transform passive task descriptions into quantified achievements following the{' '}
                  <strong className="text-slate-700">Situation • Task • Action • Result</strong> methodology favored by tech recruiters.
                </p>

                <div className="space-y-4">
                  {(auditData.bullet_rewrites && auditData.bullet_rewrites.length > 0
                    ? auditData.bullet_rewrites
                    : [
                        {
                          original: 'Worked on student placement portal with React and Node.js.',
                          improved:
                            'Architected high-throughput campus placement portal with React 18 and Node.js microservices, cutting coordinator manual processing time by 65% for 2,500+ students.',
                          metrics_added: '65% reduction in manual effort, 2,500+ student volume',
                        },
                        {
                          original: 'Created machine learning model for detecting anomalies.',
                          improved:
                            'Engineered deep convolutional neural network achieving 93.8% validation accuracy; optimized inference latency by 40% using TensorRT quantization.',
                          metrics_added: '93.8% accuracy, 40% latency reduction',
                        },
                      ]
                  ).map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                          Original Bullet
                        </span>
                        <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 line-through decoration-rose-400">
                          {item.original}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Recommended STAR Rewrite</span>
                          </span>
                          <button
                            onClick={() => copyToClipboard(item.improved, idx)}
                            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Bullet</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-slate-900 font-medium bg-emerald-50/80 p-3 rounded-lg border border-emerald-200/80 leading-relaxed">
                          {item.improved}
                        </p>
                      </div>

                      {item.metrics_added && (
                        <div className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                          <span>
                            <strong>Key Impact Metrics Added:</strong> {item.metrics_added}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Ready to audit your resume</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-5">
                Upload your PDF/DOCX resume or click <strong>“Load Sample ABES Resume”</strong> to run the automated diagnostic and view your ATS score and STAR rewrites.
              </p>
              <button
                onClick={handleLoadSample}
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
