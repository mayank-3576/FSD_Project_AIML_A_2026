import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users,
  Search,
  Filter,
  Award,
  Edit2,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
} from 'lucide-react';

export function StudentDirectory() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [placementFilter, setPlacementFilter] = useState('All');

  // Modal State for Grading / Evaluation
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [aptitudeScore, setAptitudeScore] = useState(0);
  const [dsaScore, setDsaScore] = useState(0);
  const [mockRemarks, setMockRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students');
      if (res.success) {
        setStudents(res.students || []);
      }
    } catch (err) {
      console.error('Failed to load student directory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const openEvaluationModal = (st) => {
    setSelectedStudent(st);
    setAptitudeScore(st.aptitude_score || 0);
    setDsaScore(st.dsa_score || 0);
    setMockRemarks(st.mock_interview_remarks || '');
    setModalOpen(true);
  };

  const handleSaveAssessment = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setSaving(true);
    setFeedback(null);

    try {
      await api.post('/assessments', {
        student_id: selectedStudent.student_id,
        aptitude_score: parseFloat(aptitudeScore),
        dsa_score: parseFloat(dsaScore),
        mock_interview_remarks: mockRemarks,
      });

      setFeedback({
        type: 'success',
        text: `Training scores and interview feedback saved for ${selectedStudent.name}`,
      });
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to update assessment',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesBranch = branchFilter === 'All' || s.branch.includes(branchFilter);
    const matchesSection = sectionFilter === 'All' || s.section === sectionFilter;
    const matchesPlacement =
      placementFilter === 'All' || s.placement_status === placementFilter;
    const matchesQuery =
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesSection && matchesPlacement && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Student Directory & Academic Records</h1>
            <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
              ABES EC (032)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified student candidates, review placement offers, and update TPO training readiness scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            {students.filter((s) => s.is_placed).length} Students Placed
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            {students.length} Total Registered
          </div>
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

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search roll number, name, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Branch Filter */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Branches</option>
            <option value="CSE">CSE</option>
            <option value="AIML">CSE (AI & ML)</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
          </select>

          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>

          {/* Placement Filter */}
          <select
            value={placementFilter}
            onChange={(e) => setPlacementFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="All">All Status</option>
            <option value="Placed">Placed Candidates</option>
            <option value="Unplaced">Unplaced Candidates</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Branch & Section</th>
                <th className="py-3 px-4">CGPA / Backlogs</th>
                <th className="py-3 px-4">TPO Scores</th>
                <th className="py-3 px-4">Placement Status</th>
                <th className="py-3 px-4">Resume</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading student directory...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No students match the criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.student_id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {st.roll_no}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{st.name}</p>
                      <p className="text-[11px] text-slate-400">{st.email}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{st.branch}</p>
                      <p className="text-slate-500">Sec {st.section} • {st.batch_year}</p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-600 block">{st.cgpa} CGPA</span>
                      <span className="text-[11px] text-slate-500">{st.active_backlogs} backlogs</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-blue-700 font-bold">Apt: {st.aptitude_score || 0}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-indigo-700 font-bold">DSA: {st.dsa_score || 0}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {st.is_placed ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Placed ({st.offers_count} Offers)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Unplaced
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {st.resume_url ? (
                        <a
                          href={st.resume_url}
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

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEvaluationModal(st)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md text-xs font-semibold flex items-center gap-1 ml-auto transition"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Grade Readiness</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Evaluate & Grade Student Readiness */}
      {modalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Training Assessment & Grading</h2>
                <p className="text-xs text-slate-500">
                  {selectedStudent.name} ({selectedStudent.roll_no})
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Aptitude Score (/100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={aptitudeScore}
                    onChange={(e) => setAptitudeScore(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    DSA Score (/100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    value={dsaScore}
                    onChange={(e) => setDsaScore(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mock Interview Remarks / TPO Feedback
                </label>
                <textarea
                  rows={4}
                  value={mockRemarks}
                  onChange={(e) => setMockRemarks(e.target.value)}
                  placeholder="Enter detailed feedback on fundamentals, algorithms, system design, or communication..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
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
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDirectory;
