import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Unlock,
  ExternalLink,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

export function DrivesManager() {
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [formData, setFormData] = useState({
    company_id: '',
    job_role: '',
    ctc_lpa: '',
    location: '',
    min_cgpa: '7.0',
    max_backlogs: '0',
    eligible_branches: ['CSE', 'AIML', 'IT'],
    registration_deadline: '',
    drive_date: '',
    status: 'Open',
    selection_rounds: ['Online Assessment', 'Technical Interview', 'HR Round'],
  });

  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [drivesRes, companiesRes] = await Promise.all([
        api.get('/drives'),
        api.get('/companies'),
      ]);
      if (drivesRes.success) setDrives(drivesRes.drives || []);
      if (companiesRes.success) setCompanies(companiesRes.companies || []);
    } catch (err) {
      console.error('Failed to load drives:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [rawJdInput, setRawJdInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const openCreateModal = () => {
    setEditingDrive(null);
    setRawJdInput('');
    const in10Days = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
    const in18Days = new Date(Date.now() + 18 * 86400000).toISOString().split('T')[0];

    setFormData({
      company_id: companies.length > 0 ? companies[0].company_id : '',
      job_role: '',
      ctc_lpa: '10.0',
      location: 'Noida',
      min_cgpa: '7.5',
      max_backlogs: '0',
      eligible_branches: ['CSE', 'AIML', 'IT'],
      registration_deadline: in10Days,
      drive_date: in18Days,
      status: 'Open',
      selection_rounds: ['Online Assessment', 'Technical Interview', 'HR Round'],
      role_overview: '',
      responsibilities: '',
      must_have_skills: 'Python, React, Node.js, SQL',
      good_to_have_skills: 'Docker, AWS, System Design',
      bond_details: 'No service bond required.',
      perks_and_benefits: 'Health insurance, annual learning allowance.',
    });
    setModalOpen(true);
  };

  const openEditModal = (d) => {
    setEditingDrive(d);
    setRawJdInput('');
    let branches = [];
    try {
      branches = Array.isArray(d.eligible_branches)
        ? d.eligible_branches
        : JSON.parse(d.eligible_branches || '[]');
    } catch {
      branches = (d.eligible_branches || '').split(',');
    }

    let mustHave = '';
    try {
      const parsed = JSON.parse(d.must_have_skills || '[]');
      mustHave = Array.isArray(parsed) ? parsed.join(', ') : parsed;
    } catch {
      mustHave = d.must_have_skills || '';
    }

    let goodHave = '';
    try {
      const parsed = JSON.parse(d.good_to_have_skills || '[]');
      goodHave = Array.isArray(parsed) ? parsed.join(', ') : parsed;
    } catch {
      goodHave = d.good_to_have_skills || '';
    }

    setFormData({
      company_id: d.company_id,
      job_role: d.job_role,
      ctc_lpa: d.ctc_lpa,
      location: d.location,
      min_cgpa: d.min_cgpa,
      max_backlogs: d.max_backlogs,
      eligible_branches: branches,
      registration_deadline: d.registration_deadline ? d.registration_deadline.split('T')[0] : '',
      drive_date: d.drive_date ? d.drive_date.split('T')[0] : '',
      status: d.status,
      selection_rounds: ['Online Assessment', 'Technical Interview', 'HR Round'],
      role_overview: d.role_overview || '',
      responsibilities: d.responsibilities || '',
      must_have_skills: mustHave,
      good_to_have_skills: goodHave,
      bond_details: d.bond_details || 'No service bond required.',
      perks_and_benefits: d.perks_and_benefits || 'Health insurance, annual learning allowance.',
    });
    setModalOpen(true);
  };

  const handleAutoExtractJd = async () => {
    if (!rawJdInput || rawJdInput.trim().length < 20) {
      alert('Please paste a substantial job description text to extract fields.');
      return;
    }
    setIsExtracting(true);
    try {
      const res = await api.post('/drives/parse-jd', { jd_text: rawJdInput });
      if (res.success && res.extracted) {
        const ext = res.extracted;
        setFormData((prev) => ({
          ...prev,
          job_role: ext.job_role || prev.job_role,
          ctc_lpa: ext.ctc_lpa ? String(ext.ctc_lpa) : prev.ctc_lpa,
          location: ext.location || prev.location,
          min_cgpa: ext.min_cgpa ? String(ext.min_cgpa) : prev.min_cgpa,
          role_overview: ext.role_overview || prev.role_overview,
          responsibilities: ext.responsibilities || prev.responsibilities,
          must_have_skills: Array.isArray(ext.must_have_skills)
            ? ext.must_have_skills.join(', ')
            : ext.must_have_skills || prev.must_have_skills,
          good_to_have_skills: Array.isArray(ext.good_to_have_skills)
            ? ext.good_to_have_skills.join(', ')
            : ext.good_to_have_skills || prev.good_to_have_skills,
        }));
      }
    } catch (err) {
      alert('Failed to parse JD: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingDrive) {
        await api.put(`/drives/${editingDrive.drive_id}`, formData);
        setFeedback({ type: 'success', text: 'Placement drive updated successfully' });
      } else {
        await api.post('/drives', formData);
        setFeedback({ type: 'success', text: 'New placement drive launched successfully' });
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleClose = async (drive) => {
    const newStatus = drive.status === 'Closed' ? 'Open' : 'Closed';
    try {
      await api.put(`/drives/${drive.drive_id}`, { status: newStatus });
      setFeedback({
        type: 'success',
        text: `Drive marked as ${newStatus}`,
      });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update drive status' });
    }
  };

  const handleDelete = async (drive) => {
    if (!window.confirm(`Are you sure you want to delete the ${drive.company_name} — ${drive.job_role} drive?`)) {
      return;
    }

    try {
      await api.delete(`/drives/${drive.drive_id}`);
      setFeedback({ type: 'success', text: 'Drive deleted successfully' });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete drive' });
    }
  };

  const toggleBranch = (b) => {
    setFormData((prev) => {
      const exists = prev.eligible_branches.includes(b);
      return {
        ...prev,
        eligible_branches: exists
          ? prev.eligible_branches.filter((x) => x !== b)
          : [...prev.eligible_branches, b],
      };
    });
  };

  const filteredDrives = drives.filter((d) => {
    const matchesStatus = selectedStatus === 'All' || d.status === selectedStatus;
    const matchesQuery =
      searchQuery === '' ||
      d.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.job_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Placement Drive Management</h1>
            <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
              TPO Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, schedule, close, and manage on-campus recruitment drives for ABES EC.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Launch New Drive</span>
        </button>
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
            placeholder="Search company, role, location..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Drives</option>
            <option value="Open">Open</option>
            <option value="Upcoming">Upcoming</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Drives Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Recruiter & Role</th>
                <th className="py-3 px-4">Tier & CTC</th>
                <th className="py-3 px-4">Eligibility Rules</th>
                <th className="py-3 px-4">Key Dates</th>
                <th className="py-3 px-4 text-center">Applicants</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading recruitment drives...
                  </td>
                </tr>
              ) : filteredDrives.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No placement drives found.
                  </td>
                </tr>
              ) : (
                filteredDrives.map((d) => (
                  <tr key={d.drive_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{d.company_name}</p>
                      <p className="text-slate-600 font-medium">{d.job_role}</p>
                      <p className="text-[11px] text-slate-400">{d.location}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-sm text-blue-600 block">{d.ctc_lpa} LPA</span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                        {d.hiring_tier}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-700">Min CGPA: <strong>{d.min_cgpa}</strong></p>
                      <p className="text-slate-500">Max Backlogs: {d.max_backlogs}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-slate-700">
                        Drive:{' '}
                        <strong>
                          {new Date(d.drive_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </strong>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Deadline:{' '}
                        {new Date(d.registration_deadline).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Link
                        to={`/drives/${d.drive_id}/applicants`}
                        className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>{d.total_applicants || 0}</span>
                      </Link>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          d.status === 'Open'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'Upcoming'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/v1/drives/${d.drive_id}/export`}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                          title="Export Applicants CSV"
                          download
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleToggleClose(d)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition"
                          title={d.status === 'Closed' ? 'Re-open Drive' : 'Close Drive'}
                        >
                          {d.status === 'Closed' ? (
                            <Unlock className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="Edit Drive"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          title="Delete Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create / Edit Drive */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingDrive ? 'Edit Placement Drive' : 'Launch New Placement Drive'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* AI Auto-Extract JD Banner */}
              <div className="bg-blue-50/80 border border-blue-200 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>Auto-Extract JD Fields via NLP</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoExtractJd}
                    disabled={isExtracting}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition disabled:opacity-50"
                  >
                    {isExtracting ? 'Extracting...' : 'Auto-Fill Fields'}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={rawJdInput}
                  onChange={(e) => setRawJdInput(e.target.value)}
                  placeholder="Paste raw JD text from company email/PDF to automatically extract role, package, CGPA, and required skills..."
                  className="w-full text-xs font-mono p-2 bg-white border border-blue-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company</label>
                  <select
                    required
                    value={formData.company_id}
                    onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">Select Company</option>
                    {companies.map((c) => (
                      <option key={c.company_id} value={c.company_id}>
                        {c.company_name} ({c.hiring_tier})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Role</label>
                  <input
                    type="text"
                    required
                    value={formData.job_role}
                    onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                    placeholder="e.g. SDE-1 / ML Engineer"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CTC (LPA)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.ctc_lpa}
                    onChange={(e) => setFormData({ ...formData, ctc_lpa: e.target.value })}
                    placeholder="12.5"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={formData.min_cgpa}
                    onChange={(e) => setFormData({ ...formData, min_cgpa: e.target.value })}
                    placeholder="7.5"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.max_backlogs}
                    onChange={(e) => setFormData({ ...formData, max_backlogs: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Noida / Gurugram"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Open">Open</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.registration_deadline}
                    onChange={(e) =>
                      setFormData({ ...formData, registration_deadline: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Drive Date</label>
                  <input
                    type="date"
                    required
                    value={formData.drive_date}
                    onChange={(e) => setFormData({ ...formData, drive_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Overview / Summary
                  </label>
                  <textarea
                    rows={2}
                    value={formData.role_overview}
                    onChange={(e) => setFormData({ ...formData, role_overview: e.target.value })}
                    placeholder="Brief overview of role and technical cohort..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Key Responsibilities
                  </label>
                  <textarea
                    rows={2}
                    value={formData.responsibilities}
                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                    placeholder="Bullet points of daily engineering responsibilities..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Must-Have Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.must_have_skills}
                      onChange={(e) => setFormData({ ...formData, must_have_skills: e.target.value })}
                      placeholder="e.g. Python, React, SQL, Docker"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Good-To-Have Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.good_to_have_skills}
                      onChange={(e) =>
                        setFormData({ ...formData, good_to_have_skills: e.target.value })
                      }
                      placeholder="e.g. AWS, Redis, GraphQL"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Eligible branches selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Eligible Branches
                </label>
                <div className="flex flex-wrap gap-2">
                  {['CSE', 'AIML', 'IT', 'ECE'].map((b) => {
                    const isSelected = formData.eligible_branches.includes(b);
                    return (
                      <button
                        type="button"
                        key={b}
                        onClick={() => toggleBranch(b)}
                        className={`px-3 py-1 text-xs rounded-md font-semibold transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingDrive ? 'Update Drive' : 'Launch Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DrivesManager;
