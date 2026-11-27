import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Briefcase,
  FileCheck,
  Calendar,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Building2,
  ShieldCheck,
  User,
  ExternalLink,
  Sparkles,
  Target,
  Mic,
} from 'lucide-react';

export function StudentDashboard() {
  const { user, studentProfile } = useAuth();
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [drivesRes, appsRes] = await Promise.all([
          api.get('/drives'),
          api.get('/applications'),
        ]);

        if (drivesRes.success) setDrives(drivesRes.drives || []);
        if (appsRes.success) setApplications(appsRes.applications || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute metrics
  const eligibleDrives = drives.filter((d) => d.is_eligible && d.status === 'Open');
  const appliedCount = applications.length;
  const activeInterviews = applications.filter(
    (a) =>
      a.status !== 'Selected' &&
      a.status !== 'Rejected' &&
      (a.current_round.includes('Interview') || a.current_round.includes('Round'))
  ).length;
  const offersReceived = applications.filter((a) => a.status === 'Selected').length;

  const aptitudeScore = parseFloat(studentProfile?.aptitude_score || 0);
  const dsaScore = parseFloat(studentProfile?.dsa_score || 0);
  const readinessAvg = Math.round((aptitudeScore + dsaScore) / 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* College Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              ABES Engineering College (College Code: 032)
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {user?.name || 'Student'}!
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Roll No: <span className="font-semibold text-white">{studentProfile?.roll_no || 'N/A'}</span> •{' '}
              {studentProfile?.branch || 'CSE (AI & ML)'} Section {studentProfile?.section || 'A'} • CGPA:{' '}
              <span className="font-semibold text-emerald-400">{studentProfile?.cgpa || '8.6'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/drives"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Briefcase className="w-3.5 h-3.5" />
              Browse Eligible Drives
            </Link>
            <Link
              to="/profile"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition"
            >
              <User className="w-3.5 h-3.5" />
              Update Profile
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Eligible Drives */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Eligible Drives</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{eligibleDrives.length}</p>
          <span className="text-[11px] font-medium text-emerald-600">Active opportunities</span>
        </div>

        {/* Card 2: Applications */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Applied Drives</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{appliedCount}</p>
          <span className="text-[11px] text-slate-500">In recruitment process</span>
        </div>

        {/* Card 3: Active Interviews */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Rounds</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900">{activeInterviews}</p>
          <span className="text-[11px] text-amber-600 font-medium">In interview pipeline</span>
        </div>

        {/* Card 4: Offers Received */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Offers Received</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{offersReceived}</p>
          <span className="text-[11px] font-medium text-emerald-700">
            {offersReceived > 0 ? 'Selected for Placement' : 'Pending Selection'}
          </span>
        </div>

        {/* Card 5: Training Readiness */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Training Readiness</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{readinessAvg}%</p>
          <span className="text-[11px] text-slate-500">Aptitude & DSA average</span>
        </div>
      </div>

      {/* AI Readiness & Recruiter Tools Quick Launch */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-5 rounded-2xl border border-blue-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>AI Recruitment & Interview Readiness Suite</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              ABES TPO automated diagnostics, speech-based mock interviews, and recruiter ATS alignment tools
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            to="/resume-checker"
            className="p-3.5 bg-white rounded-xl border border-blue-100 hover:border-blue-400 hover:shadow-md transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Resume Auditor & STAR
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              0–100 diagnostic score, section completeness, and STAR bullet rewrites.
            </p>
          </Link>

          <Link
            to="/ats-score-checker"
            className="p-3.5 bg-white rounded-xl border border-indigo-100 hover:border-indigo-400 hover:shadow-md transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Target className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              ATS Score Matcher
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Test your resume against campus drive JDs for circular match & keyword gaps.
            </p>
          </Link>

          <Link
            to="/ai-interview"
            className="p-3.5 bg-white rounded-xl border border-purple-100 hover:border-purple-400 hover:shadow-md transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Mic className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
              AI Interview Simulator
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Voice-interactive AI panels with code scratchpad and 5-axis spider chart.
            </p>
          </Link>

          <Link
            to="/mock-interviews"
            className="p-3.5 bg-white rounded-xl border border-emerald-100 hover:border-emerald-400 hover:shadow-md transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Faculty Mock Panels
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Reserve live slots with ABES TPO evaluators and receive 4-axis scorecards.
            </p>
          </Link>
        </div>
      </div>

      {/* Main Grid: Eligible Drives & Training Readiness Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Hot Placement Drives */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Featured Placement Drives</h2>
              <p className="text-xs text-slate-500">Upcoming on-campus opportunities verified for your profile</p>
            </div>
            <Link
              to="/drives"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View All ({drives.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {drives.slice(0, 4).map((d) => (
              <div
                key={d.drive_id}
                className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 hover:bg-white"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-slate-900">{d.company_name}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        d.hiring_tier === 'Super Dream'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : d.hiring_tier === 'Dream'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {d.hiring_tier}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-700">{d.job_role}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    CTC: <span className="font-semibold text-slate-900">{d.ctc_lpa} LPA</span> • Location:{' '}
                    {d.location} • Min CGPA: {d.min_cgpa}
                  </p>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  {d.has_applied ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Applied: {d.current_round}
                    </span>
                  ) : d.is_eligible ? (
                    <Link
                      to="/drives"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
                    >
                      <span>Eligible — Apply</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertCircle className="w-3 h-3" />
                      Not Eligible
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: TPO Training Readiness & Mock Feedback */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <h2 className="text-base font-bold text-slate-900 mb-1">Training Readiness Scores</h2>
            <p className="text-xs text-slate-500 mb-4">Official assessment scores evaluated by TPO</p>

            <div className="space-y-4">
              {/* Aptitude Score */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Aptitude & Problem Solving</span>
                  <span className="text-blue-600">{aptitudeScore}/100</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, aptitudeScore)}%` }}
                  />
                </div>
              </div>

              {/* DSA Score */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-slate-700">Data Structures & Algorithms</span>
                  <span className="text-indigo-600">{dsaScore}/100</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, dsaScore)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mock Interview Remarks */}
            <div className="mt-5 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                TPO Mock Interview Remarks
              </span>
              <p className="text-xs text-slate-700 italic">
                "{studentProfile?.mock_interview_remarks || 'Orientation and mock interviews in progress.'}"
              </p>
            </div>
          </div>

          {/* Quick Profile Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Verified Profile</h3>
              <Link to="/profile" className="text-xs text-blue-600 hover:underline font-semibold">
                Edit
              </Link>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Roll Number:</span>
                <span className="font-semibold text-slate-800">{studentProfile?.roll_no || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">College:</span>
                <span className="font-semibold text-slate-800">ABES EC (032)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Current CGPA:</span>
                <span className="font-semibold text-emerald-600">{studentProfile?.cgpa || '8.60'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Active Backlogs:</span>
                <span className="font-semibold text-slate-800">{studentProfile?.active_backlogs ?? 0}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Uploaded Resume:</span>
                {studentProfile?.resume_url ? (
                  <a
                    href={studentProfile.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View PDF
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-rose-500 font-medium">Pending Upload</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
