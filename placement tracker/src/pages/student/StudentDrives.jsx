import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Briefcase,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Building2,
  Award,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  Sparkles,
  Target,
  X,
  FileText,
} from 'lucide-react';

export function StudentDrives() {
  const navigate = useNavigate();
  const { studentProfile } = useAuth();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingJdDrive, setViewingJdDrive] = useState(null);

  const [applyingDriveId, setApplyingDriveId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  const fetchDrives = async () => {
    try {
      setLoading(true);
      const res = await api.get('/drives');
      if (res.success) {
        setDrives(res.drives || []);
      }
    } catch (err) {
      console.error('Failed to load drives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, []);

  const handleApply = async (drive) => {
    if (!studentProfile?.resume_url) {
      setFeedback({
        type: 'error',
        text: 'Please upload your PDF resume in your Profile before applying.',
      });
      return;
    }

    setApplyingDriveId(drive.drive_id);
    setFeedback(null);

    try {
      const res = await api.post(`/drives/${drive.drive_id}/apply`);
      if (res.success) {
        setFeedback({
          type: 'success',
          text: `Application submitted successfully for ${drive.company_name} — ${drive.job_role}!`,
        });
        await fetchDrives(); // Refresh states
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to submit application',
      });
    } finally {
      setApplyingDriveId(null);
    }
  };

  const filteredDrives = drives.filter((d) => {
    const matchesTier = selectedTier === 'All' || d.hiring_tier === selectedTier;
    const matchesStatus = selectedStatus === 'All' || d.status === selectedStatus;
    const matchesQuery =
      searchQuery === '' ||
      d.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.job_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Campus Placement Drives</h1>
            <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
              ABES EC (032)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time eligibility engine validated against your verified profile (CGPA: {studentProfile?.cgpa || '8.6'})
          </p>
        </div>

        {/* Quick summary badges */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <span className="font-bold">{drives.filter((d) => d.is_eligible && d.status === 'Open').length}</span> Eligible to Apply
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <span className="font-bold">{drives.filter((d) => d.has_applied).length}</span> Applied
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
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
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search role, company, location..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Tier:</span>
          </div>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Tiers</option>
            <option value="Super Dream">Super Dream (&gt; 20 LPA)</option>
            <option value="Dream">Dream (8-20 LPA)</option>
            <option value="Standard">Standard (&lt; 8 LPA)</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Drives Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredDrives.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Placement Drives Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or tier filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDrives.map((drive) => {
            let branches = [];
            try {
              branches = Array.isArray(drive.eligible_branches)
                ? drive.eligible_branches
                : JSON.parse(drive.eligible_branches || '[]');
            } catch {
              branches = (drive.eligible_branches || '').split(',');
            }

            const deadline = new Date(drive.registration_deadline);
            const driveDate = new Date(drive.drive_date);

            return (
              <div
                key={drive.drive_id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  {/* Company & Tier Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">
                          {drive.company_name}
                        </span>
                        {drive.website && (
                          <a
                            href={drive.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-blue-600"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {drive.industry_sector} • {drive.company_location}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                        drive.hiring_tier === 'Super Dream'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : drive.hiring_tier === 'Dream'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {drive.hiring_tier}
                    </span>
                  </div>

                  {/* Role & CTC */}
                  <div className="my-3 pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800">{drive.job_role}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-extrabold text-blue-600">
                        {drive.ctc_lpa} LPA
                      </span>
                      <span className="text-xs text-slate-500">Fixed + Variable</span>
                    </div>
                  </div>

                  {/* Criteria & Details */}
                  <div className="space-y-2 text-xs text-slate-600 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Min CGPA Required:</span>
                      <span className="font-semibold text-slate-800">{drive.min_cgpa}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Max Backlogs Allowed:</span>
                      <span className="font-semibold text-slate-800">{drive.max_backlogs}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Eligible Branches:</span>
                      <span className="font-medium text-slate-800">
                        {branches.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Registration Deadline:</span>
                      <span className="font-medium text-slate-800">
                        {deadline.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Drive Date:</span>
                      <span className="font-medium text-slate-800">
                        {driveDate.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Eligibility Engine Feedback Box */}
                  <div className="mt-3">
                    {drive.has_applied ? (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <FileCheck className="w-4 h-4 text-blue-600" />
                          Application Submitted
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded text-[11px] font-bold border border-blue-300">
                          {drive.current_round}
                        </span>
                      </div>
                    ) : drive.is_eligible ? (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">
                          You meet all eligibility criteria for this drive.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>Not Eligible to Apply</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                          {drive.failed_reasons?.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      Location: <strong className="text-slate-700">{drive.location}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setViewingJdDrive(drive)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Full JD</span>
                    </button>
                  </div>

                  <div>
                    {drive.has_applied ? (
                      <span className="text-xs font-bold text-blue-700">
                        Status: {drive.application_status}
                      </span>
                    ) : drive.is_eligible && drive.status === 'Open' ? (
                      <button
                        onClick={() => handleApply(drive)}
                        disabled={applyingDriveId === drive.drive_id}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        {applyingDriveId === drive.drive_id ? (
                          'Submitting Application...'
                        ) : (
                          <>
                            <span>Eligible — Apply Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-1.5 bg-slate-200 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed"
                      >
                        {drive.status !== 'Open' ? drive.status : 'Ineligible'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Structured Job Description (JD) Hub Modal */}
      {viewingJdDrive && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {viewingJdDrive.hiring_tier}
                  </span>
                  <span className="text-xs text-slate-500">• {viewingJdDrive.location}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {viewingJdDrive.job_role}
                </h2>
                <p className="text-xs font-medium text-slate-600">
                  {viewingJdDrive.company_name} • Package: <strong className="text-blue-700">{viewingJdDrive.ctc_lpa} LPA</strong>
                </p>
              </div>
              <button
                onClick={() => setViewingJdDrive(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Direct Actions Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  navigate(`/ats-score-checker?drive_id=${viewingJdDrive.drive_id}`);
                }}
                className="p-2.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs font-semibold text-slate-800 transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Target className="w-4 h-4 text-blue-600" />
                <span>Check ATS Match</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigate(
                    `/ai-interview?role=${encodeURIComponent(viewingJdDrive.job_role)}&drive_id=${viewingJdDrive.drive_id}`
                  );
                }}
                className="p-2.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold text-slate-800 transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Practice AI Interview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const toApply = viewingJdDrive;
                  setViewingJdDrive(null);
                  handleApply(toApply);
                }}
                disabled={viewingJdDrive.has_applied || !viewingJdDrive.is_eligible || viewingJdDrive.status !== 'Open'}
                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                <ArrowRight className="w-4 h-4" />
                <span>{viewingJdDrive.has_applied ? 'Already Applied' : 'Apply Now'}</span>
              </button>
            </div>

            {/* Structured Sections */}
            <div className="space-y-4 text-xs text-slate-700">
              {/* Role Overview */}
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                  Role Overview
                </h3>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                  {viewingJdDrive.role_overview ||
                    `${viewingJdDrive.company_name} is hiring for ${viewingJdDrive.job_role}. Joining as part of the core campus engineering cohort.`}
                </p>
              </div>

              {/* Responsibilities */}
              {viewingJdDrive.responsibilities && (
                <div>
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                    Key Responsibilities
                  </h3>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-line">
                    {viewingJdDrive.responsibilities}
                  </div>
                </div>
              )}

              {/* Must-Have Skills */}
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5">
                  Must-Have Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    let skills = [];
                    try {
                      skills = Array.isArray(viewingJdDrive.must_have_skills)
                        ? viewingJdDrive.must_have_skills
                        : JSON.parse(viewingJdDrive.must_have_skills || '[]');
                    } catch {
                      skills = (viewingJdDrive.must_have_skills || '').split(',');
                    }
                    return skills.length > 0 ? (
                      skills.map((s, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold text-[11px]"
                        >
                          {String(s).trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">Core Computer Science & Programming</span>
                    );
                  })()}
                </div>
              </div>

              {/* Good-To-Have Skills */}
              <div>
                <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5">
                  Good-To-Have Skills
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    let skills = [];
                    try {
                      skills = Array.isArray(viewingJdDrive.good_to_have_skills)
                        ? viewingJdDrive.good_to_have_skills
                        : JSON.parse(viewingJdDrive.good_to_have_skills || '[]');
                    } catch {
                      skills = (viewingJdDrive.good_to_have_skills || '').split(',');
                    }
                    return skills.length > 0 ? (
                      skills.map((s, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-semibold text-[11px]"
                        >
                          {String(s).trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 italic">Cloud & Containerization basics</span>
                    );
                  })()}
                </div>
              </div>

              {/* Service Bond & Perks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                    Service Bond
                  </span>
                  <span className="text-slate-600 mt-0.5 block">
                    {viewingJdDrive.bond_details || 'No service bond required.'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                    Perks & Benefits
                  </span>
                  <span className="text-slate-600 mt-0.5 block">
                    {viewingJdDrive.perks_and_benefits || 'Health insurance, annual learning allowance.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDrives;
