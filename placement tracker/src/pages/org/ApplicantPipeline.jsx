import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Briefcase,
  Search,
  Filter,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  FileText,
  RotateCcw,
  Download,
  Building2,
  Award,
} from 'lucide-react';

const RECRUITMENT_ROUNDS = [
  'All',
  'Applied',
  'Shortlisted',
  'Online Assessment',
  'Technical Interview',
  'HR Round',
  'Selected',
  'Rejected',
];

const STATUS_OPTIONS = ['In Review', 'In Progress', 'Shortlisted', 'Selected', 'Rejected'];

export default function ApplicantPipeline() {
  const [applications, setApplications] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrive, setSelectedDrive] = useState('All');
  const [selectedRound, setSelectedRound] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, drivesRes] = await Promise.all([
        api.get('/applications'),
        api.get('/drives'),
      ]);

      if (appsRes.success) setApplications(appsRes.applications || []);
      if (drivesRes.success) setDrives(drivesRes.drives || []);
    } catch (err) {
      console.error('Failed to load applicant pipeline:', err);
      setFeedback({ type: 'error', text: 'Failed to load applicants' });
    } finally {
      setLoading(false);
    }
  };

  const handleStageUpdate = async (appId, newRound, newStatus) => {
    try {
      setUpdatingId(appId);
      await api.patch(`/applications/${appId}/status`, {
        current_round: newRound,
        status: newStatus,
      });

      setApplications((prev) =>
        prev.map((app) =>
          app.application_id === appId
            ? { ...app, current_round: newRound || app.current_round, status: newStatus || app.status }
            : app
        )
      );

      setFeedback({
        type: 'success',
        text: 'Candidate recruitment stage updated successfully!',
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update candidate status',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    if (filteredApplications.length === 0) return;

    const headers = [
      'Roll Number',
      'Student Name',
      'Email',
      'Branch',
      'Section',
      'CGPA',
      'Company',
      'Job Role',
      'Package (LPA)',
      'Current Round',
      'Status',
      'ATS Match %',
      'Applied Date',
    ];

    const rows = filteredApplications.map((a) => [
      a.roll_no,
      `"${a.student_name}"`,
      a.student_email,
      a.branch,
      a.section,
      a.cgpa,
      `"${a.company_name}"`,
      `"${a.job_role}"`,
      a.ctc_lpa,
      `"${a.current_round}"`,
      `"${a.status}"`,
      a.ats_score ? `${Math.round(a.ats_score)}%` : 'N/A',
      new Date(a.applied_at).toLocaleDateString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ABES_EC_Applicant_Pipeline_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter calculations
  const filteredApplications = applications.filter((app) => {
    const matchesDrive =
      selectedDrive === 'All' || String(app.drive_id) === String(selectedDrive);
    const matchesRound =
      selectedRound === 'All' || app.current_round === selectedRound;
    const matchesStatus =
      selectedStatus === 'All' || app.status === selectedStatus;
    const matchesQuery =
      searchQuery === '' ||
      app.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.roll_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job_role?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesDrive && matchesRound && matchesStatus && matchesQuery;
  });

  // KPI Metrics
  const totalApps = applications.length;
  const shortlistedCount = applications.filter(
    (a) => a.current_round !== 'Applied' && a.status !== 'Rejected'
  ).length;
  const inInterviewCount = applications.filter(
    (a) => a.current_round.includes('Interview') || a.current_round.includes('Round')
  ).length;
  const selectedCount = applications.filter((a) => a.status === 'Selected').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded border border-blue-400/30">
                ABES TPO Central Recruitment Funnel
              </span>
              <span className="text-xs text-slate-300">College Code: 032</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Consolidated Applicant Pipeline</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Track and advance all student applications across all active campus placement drives through the 6-stage recruitment funnel.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredApplications.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-semibold shadow transition-colors shrink-0 text-white disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export Pipeline CSV</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Total Applications</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalApps}</p>
          <span className="text-[11px] text-blue-600 font-medium">Across all campus drives</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Shortlisted / OA Cleared</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">{shortlistedCount}</p>
          <span className="text-[11px] text-indigo-500 font-medium">Past initial screening</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">In Interview Pipeline</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{inInterviewCount}</p>
          <span className="text-[11px] text-amber-500 font-medium">Technical or HR rounds</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-medium text-slate-500 block">Offers / Selected</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{selectedCount}</p>
          <span className="text-[11px] text-emerald-600 font-medium">Final placement offers</span>
        </div>
      </div>

      {/* Recruitment Funnel Stage Stepper Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Funnel Stage:
          </span>
          {RECRUITMENT_ROUNDS.map((round) => {
            const count =
              round === 'All'
                ? applications.length
                : applications.filter((a) => a.current_round === round).length;
            const isSelected = selectedRound === round;

            return (
              <button
                key={round}
                onClick={() => setSelectedRound(round)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{round}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name, roll number, company, or job role..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Drive Filter */}
          <select
            value={selectedDrive}
            onChange={(e) => setSelectedDrive(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Placement Drives ({drives.length})</option>
            {drives.map((d) => (
              <option key={d.drive_id} value={d.drive_id}>
                {d.company_name} — {d.job_role}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            title="Refresh pipeline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Candidate Pipeline Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Student & Roll No</th>
                <th className="py-3.5 px-4">Company & Target Role</th>
                <th className="py-3.5 px-4">Academic Specs</th>
                <th className="py-3.5 px-4">ATS Match</th>
                <th className="py-3.5 px-4">Resume</th>
                <th className="py-3.5 px-4">Current Round Stage</th>
                <th className="py-3.5 px-4">Recruitment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading consolidated applicant pipeline...
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No applications found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <tr key={app.application_id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Student Info */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{app.student_name}</span>
                      <span className="font-mono text-slate-500 text-[11px] block">{app.roll_no}</span>
                      <span className="text-[10px] text-slate-400">{app.student_email}</span>
                    </td>

                    {/* Company & Role */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{app.company_name}</span>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                          {app.hiring_tier}
                        </span>
                      </div>
                      <span className="text-slate-600 block mt-0.5">{app.job_role}</span>
                      <span className="text-[11px] font-bold text-emerald-600">{app.ctc_lpa} LPA</span>
                    </td>

                    {/* Academics */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {app.branch} (Sec {app.section})
                      </span>
                      <span className="text-emerald-700 font-bold block">CGPA {app.cgpa}</span>
                      <span className="text-[10px] text-slate-400">
                        {app.active_backlogs} backlogs • Batch {app.batch_year}
                      </span>
                    </td>

                    {/* ATS Score */}
                    <td className="py-3.5 px-4">
                      {app.ats_score ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${
                            app.ats_score >= 80
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : app.ats_score >= 60
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {Math.round(app.ats_score)}% Match
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Resume */}
                    <td className="py-3.5 px-4">
                      {app.resume_url ? (
                        <a
                          href={app.resume_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>

                    {/* Round Selector (Promote candidate) */}
                    <td className="py-3.5 px-4">
                      <select
                        disabled={updatingId === app.application_id}
                        value={app.current_round}
                        onChange={(e) => {
                          const newRound = e.target.value;
                          const newStatus =
                            newRound === 'Selected'
                              ? 'Selected'
                              : newRound === 'Rejected'
                              ? 'Rejected'
                              : app.status === 'Selected' || app.status === 'Rejected'
                              ? 'In Progress'
                              : app.status;
                          handleStageUpdate(app.application_id, newRound, newStatus);
                        }}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {RECRUITMENT_ROUNDS.filter((r) => r !== 'All').map((round) => (
                          <option key={round} value={round}>
                            {round}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status Selector */}
                    <td className="py-3.5 px-4">
                      <select
                        disabled={updatingId === app.application_id}
                        value={app.status}
                        onChange={(e) =>
                          handleStageUpdate(app.application_id, app.current_round, e.target.value)
                        }
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border ${
                          app.status === 'Selected'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : app.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : app.status === 'Shortlisted'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
