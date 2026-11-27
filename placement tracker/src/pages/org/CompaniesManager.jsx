import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export function CompaniesManager() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('All');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    industry_sector: '',
    location: '',
    website: '',
    hr_name: '',
    hr_email: '',
    hr_phone: '',
    hiring_tier: 'Standard',
  });

  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/companies');
      if (res.success) {
        setCompanies(res.companies || []);
      }
    } catch (err) {
      console.error('Failed to load companies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const openCreateModal = () => {
    setEditingCompany(null);
    setFormData({
      company_name: '',
      industry_sector: '',
      location: '',
      website: '',
      hr_name: '',
      hr_email: '',
      hr_phone: '',
      hiring_tier: 'Standard',
    });
    setModalOpen(true);
  };

  const openEditModal = (comp) => {
    setEditingCompany(comp);
    setFormData({
      company_name: comp.company_name,
      industry_sector: comp.industry_sector,
      location: comp.location,
      website: comp.website || '',
      hr_name: comp.hr_name || '',
      hr_email: comp.hr_email || '',
      hr_phone: comp.hr_phone || '',
      hiring_tier: comp.hiring_tier,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.company_id}`, formData);
        setFeedback({ type: 'success', text: 'Company details updated successfully' });
      } else {
        await api.post('/companies', formData);
        setFeedback({ type: 'success', text: 'New recruiting company registered successfully' });
      }
      setModalOpen(false);
      fetchCompanies();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (comp) => {
    if (!window.confirm(`Are you sure you want to remove ${comp.company_name}? This will remove associated placement drives.`)) {
      return;
    }

    try {
      await api.delete(`/companies/${comp.company_id}`);
      setFeedback({ type: 'success', text: `${comp.company_name} deleted successfully` });
      fetchCompanies();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete company' });
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesTier = selectedTier === 'All' || c.hiring_tier === selectedTier;
    const matchesQuery =
      searchQuery === '' ||
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry_sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.hr_name && c.hr_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTier && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Partner Companies Directory</h1>
            <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
              TPO Corporate Relations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain authorized corporate recruiters, campus hiring tiers, and direct HR contacts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Register Company</span>
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company name, HR name, sector..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold">Tier:</span>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Tiers</option>
            <option value="Super Dream">Super Dream (&gt; 20 LPA)</option>
            <option value="Dream">Dream (8-20 LPA)</option>
            <option value="Standard">Standard (&lt; 8 LPA)</option>
          </select>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Industry Sector</th>
                <th className="py-3 px-4">Hiring Tier</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">HR Contact Person</th>
                <th className="py-3 px-4 text-center">Drives</th>
                <th className="py-3 px-4 text-center">Hires</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading companies directory...
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No corporate partners found.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((comp) => (
                  <tr key={comp.company_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{comp.company_name}</span>
                        {comp.website && (
                          <a
                            href={comp.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-blue-600"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{comp.industry_sector}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          comp.hiring_tier === 'Super Dream'
                            ? 'bg-purple-100 text-purple-800'
                            : comp.hiring_tier === 'Dream'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {comp.hiring_tier}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{comp.location}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{comp.hr_name || 'N/A'}</p>
                      <p className="text-[11px] text-slate-500">{comp.hr_email}</p>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">
                      {comp.total_drives || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">
                      {comp.total_hired || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(comp)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition"
                          title="Edit Company"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(comp)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-md transition"
                          title="Delete Company"
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

      {/* Modal for Create / Edit Company */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-900">
                {editingCompany ? 'Edit Company Information' : 'Register Corporate Partner'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Microsoft India"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Sector</label>
                  <input
                    type="text"
                    required
                    value={formData.industry_sector}
                    onChange={(e) => setFormData({ ...formData, industry_sector: e.target.value })}
                    placeholder="e.g. Cloud & Software"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hiring Tier</label>
                  <select
                    value={formData.hiring_tier}
                    onChange={(e) => setFormData({ ...formData, hiring_tier: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="Standard">Standard (&lt; 8 LPA)</option>
                    <option value="Dream">Dream (8-20 LPA)</option>
                    <option value="Super Dream">Super Dream (&gt; 20 LPA)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Office Location</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Noida / Bengaluru"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Careers Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://company.com/careers"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block mb-2">Corporate HR Contact</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={formData.hr_name}
                    onChange={(e) => setFormData({ ...formData, hr_name: e.target.value })}
                    placeholder="HR Name"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="email"
                    value={formData.hr_email}
                    onChange={(e) => setFormData({ ...formData, hr_email: e.target.value })}
                    placeholder="HR Email"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <input
                    type="text"
                    value={formData.hr_phone}
                    onChange={(e) => setFormData({ ...formData, hr_phone: e.target.value })}
                    placeholder="HR Phone"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
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
                  {submitting ? 'Saving...' : editingCompany ? 'Update Company' : 'Register Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompaniesManager;
