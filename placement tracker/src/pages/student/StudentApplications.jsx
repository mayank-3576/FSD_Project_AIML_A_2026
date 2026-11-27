import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

const STAGES = [
  'Applied',
  'Shortlisted',
  'Online Assessment',
  'Technical Interview',
  'HR Round',
  'Selected',
];

export function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All');

  useEffect(() => {
    async function loadApplications() {
      try {
        const res = await api.get('/applications');
        if (res.success) {
          setApplications(res.applications || []);
        }
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, []);

  const filtered = applications.filter((app) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Selected') return app.status === 'Selected';
    if (selectedFilter === 'Rejected') return app.status === 'Rejected';
    if (selectedFilter === 'In Progress')
      return app.status !== 'Selected' && app.status !== 'Rejected';
    return true;
  });

  const getStageIndex = (round) => {
    if (round === 'Selected') return 5;
    if (round === 'Rejected') return -1;
    const idx = STAGES.findIndex(
      (s) => s.toLowerCase() === round.toLowerCase() || round.toLowerCase().includes(s.toLowerCase())
    );
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Placement Applications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track multi-round recruitment progress from initial application to offer letter.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'In Progress', 'Selected', 'Rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedFilter === f
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Applications Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Browse the Eligible Drives tab to apply for upcoming on-campus drives.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const currentStageIdx = getStageIndex(app.current_round);
            const isSelected = app.status === 'Selected';
            const isRejected = app.status === 'Rejected';

            return (
              <div
                key={app.application_id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all space-y-6"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900">{app.company_name}</h2>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            app.hiring_tier === 'Super Dream'
                              ? 'bg-purple-100 text-purple-700'
                              : app.hiring_tier === 'Dream'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {app.hiring_tier}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium">
                        {app.job_role} • <strong className="text-slate-900">{app.ctc_lpa} LPA</strong> • {app.job_location}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500">
                      Applied:{' '}
                      {new Date(app.applied_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        isSelected
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isRejected
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                </div>

                {/* Progress Stepper: Applied -> Shortlisted -> OA -> Tech Interview -> HR Round -> Selected */}
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                    Recruitment Stage Stepper
                  </span>

                  <div className="relative">
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      {STAGES.map((stageName, idx) => {
                        const isPast = !isRejected && idx < currentStageIdx;
                        const isCurrent = !isRejected && idx === currentStageIdx;
                        const isCompletedOffer = isSelected && idx === 5;

                        return (
                          <div
                            key={stageName}
                            className={`p-2.5 rounded-lg border text-center transition-all ${
                              isCompletedOffer
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-bold shadow-xs'
                                : isCurrent
                                ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold shadow-xs ring-2 ring-blue-500/20'
                                : isPast
                                ? 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                                : 'bg-slate-50/40 border-slate-100 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-center mb-1">
                              {isCompletedOffer || isPast ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : isCurrent ? (
                                <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                              ) : (
                                <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                              )}
                            </div>
                            <span className="text-[11px] block leading-tight">{stageName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {isRejected && (
                    <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        Application concluded at stage: <strong>{app.current_round}</strong>. Keep practicing and apply for other active drives!
                      </span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        🎉 Congratulations! You have been selected for <strong>{app.job_role}</strong> at <strong>{app.company_name}</strong> with a package of <strong>{app.ctc_lpa} LPA</strong>!
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentApplications;
