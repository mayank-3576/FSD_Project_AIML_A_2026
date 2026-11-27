import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  Briefcase,
  ArrowLeft,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
} from 'lucide-react';

const ROUNDS = [
  'Applied',
  'Shortlisted',
  'Online Assessment',
  'Technical Interview',
  'HR Round',
  'Selected',
  'Rejected',
];

const STATUSES = ['In Review', 'In Progress', 'Shortlisted', 'Selected', 'Rejected'];

export function DriveApplicants() {
  const { id } = useParams();
  const [drive, setDrive] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roundFilter, setRoundFilter] = useState('All');
  const [feedback, setFeedback] = useState(null);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/drives/${id}`);
      if (res.success) {
        setDrive(res.drive);
        setApplicants(res.applicants || []);
      }
    } catch (err) {
      console.error('Failed to load drive applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [id]);

  const handleUpdateStatus = async (appId, newRound, newStatus) => {
    try {
      await api.patch(`/applications/${appId}/status`, {
        current_round: newRound,
        status: newStatus,
      });

      setApplicants((prev) =>
        prev.map((a) =>
          a.application_id === appId
            ? { ...a, current_round: newRound || a.current_round, status: newStatus || a.status }
            : a
        )
      );

      setFeedback({
        type: 'success',
        text: 'Applicant stage and recruitment status updated!',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update applicant status',
      });
    }
  };

  const filteredApplicants = applicants.filter((a) => {
    const matchesRound = roundFilter === 'All' || a.current_round === roundFilter;
    const matchesQuery =
      searchQuery === '' ||
      a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.student_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRound && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/drives"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Placement Drives
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">
              {drive?.company_name} — {drive?.job_role}
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {drive?.ctc_lpa} LPA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Applicant Recruitment Pipeline ({applicants.length} Total Applicants Registered)
          </p>
        </div>

        {/* CSV Export Button */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/v1/drives/${id}/export?filter=all`}
            download
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold text-slate-400">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student roll, name, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold">Stage:</span>
          <select
            value={roundFilter}
            onChange={(e) => setRoundFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Stages</option>
            {ROUNDS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Applicants Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student & Roll No</th>
                <th className="py-3 px-4">Branch & Sec</th>
                <th className="py-3 px-4">CGPA / Backlogs</th>
                <th className="py-3 px-4">Readiness (Apt/DSA)</th>
                <th className="py-3 px-4">ATS Match</th>
                <th className="py-3 px-4">Resume</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading applicants pipeline...
                  </td>
                </tr>
              ) : filteredApplicants.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No applicants found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredApplicants.map((app) => (
                  <tr key={app.application_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{app.student_name}</p>
                      <p className="font-mono text-slate-500">{app.roll_no}</p>
                      <p className="text-[11px] text-slate-400">{app.student_email}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{app.branch}</p>
                      <p className="text-slate-500">Sec {app.section} ({app.batch_year})</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-600 block">{app.cgpa} CGPA</span>
                      <span className="text-[11px] text-slate-500">{app.active_backlogs} backlogs</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-700 block font-medium">
                        Apt: {app.aptitude_score || 0}/100
                      </span>
                      <span className="text-slate-500 block">DSA: {app.dsa_score || 0}/100</span>
                    </td>

                    <td className="py-3 px-4">
                      {app.ats_score ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
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

                    <td className="py-3 px-4">
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

                    <td className="py-3 px-4">
                      <select
                        value={app.current_round}
                        onChange={(e) =>
                          handleUpdateStatus(
                            app.application_id,
                            e.target.value,
                            e.target.value === 'Selected' ? 'Selected' : e.target.value === 'Rejected' ? 'Rejected' : app.status
                          )
                        }
                        className="px-2 py-1 text-xs rounded border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        {ROUNDS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateStatus(app.application_id, app.current_round, e.target.value)}
                        className={`px-2 py-1 text-xs rounded font-bold border focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                          app.status === 'Selected'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : app.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-blue-50 text-blue-800 border-blue-300'
                        }`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
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

export default DriveApplicants;
