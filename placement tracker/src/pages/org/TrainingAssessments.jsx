import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Award,
  Search,
  CheckCircle2,
  AlertCircle,
  Save,
  BookOpen,
  TrendingUp,
} from 'lucide-react';

export function TrainingAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMap, setEditMap] = useState({}); // student_id -> { aptitude, dsa, remarks }
  const [feedback, setFeedback] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments');
      if (res.success) {
        setAssessments(res.assessments || []);
        const initialMap = {};
        (res.assessments || []).forEach((a) => {
          initialMap[a.student_id] = {
            aptitude_score: a.aptitude_score || 0,
            dsa_score: a.dsa_score || 0,
            mock_interview_remarks: a.mock_interview_remarks || '',
          };
        });
        setEditMap(initialMap);
      }
    } catch (err) {
      console.error('Failed to load assessments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleFieldChange = (studentId, field, val) => {
    setEditMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val,
      },
    }));
  };

  const handleSaveRow = async (studentId, studentName) => {
    const payload = editMap[studentId];
    if (!payload) return;
    setSavingId(studentId);
    setFeedback(null);

    try {
      await api.post('/assessments', {
        student_id: studentId,
        aptitude_score: parseFloat(payload.aptitude_score || 0),
        dsa_score: parseFloat(payload.dsa_score || 0),
        mock_interview_remarks: payload.mock_interview_remarks || '',
      });

      setFeedback({
        type: 'success',
        text: `Updated training scores and feedback for ${studentName}`,
      });
      fetchAssessments();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to save assessment',
      });
    } finally {
      setSavingId(null);
    }
  };

  const filtered = assessments.filter((a) => {
    return (
      searchQuery === '' ||
      a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.roll_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.branch.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Training Readiness & Mock Assessments</h1>
            <span className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full">
              ABES EC (032)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Grade Aptitude & DSA performance (each out of 100) and provide mock interview remarks.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or roll..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
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

      {/* Assessment Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student & Roll No</th>
                <th className="py-3 px-4">Branch & CGPA</th>
                <th className="py-3 px-4 w-28">Aptitude (/100)</th>
                <th className="py-3 px-4 w-28">DSA (/100)</th>
                <th className="py-3 px-4">Mock Interview Remarks</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading training assessments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No student assessments found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const state = editMap[item.student_id] || {};
                  return (
                    <tr key={item.score_id || item.student_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.student_name}</p>
                        <p className="font-mono text-slate-500">{item.roll_no}</p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800">{item.branch} - Sec {item.section}</p>
                        <p className="font-bold text-emerald-600">{item.cgpa} CGPA</p>
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={state.aptitude_score ?? ''}
                          onChange={(e) =>
                            handleFieldChange(item.student_id, 'aptitude_score', e.target.value)
                          }
                          className="w-20 px-2 py-1 text-xs rounded border border-slate-300 font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={state.dsa_score ?? ''}
                          onChange={(e) =>
                            handleFieldChange(item.student_id, 'dsa_score', e.target.value)
                          }
                          className="w-20 px-2 py-1 text-xs rounded border border-slate-300 font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </td>

                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={state.mock_interview_remarks ?? ''}
                          onChange={(e) =>
                            handleFieldChange(item.student_id, 'mock_interview_remarks', e.target.value)
                          }
                          placeholder="Feedback on problem solving, algorithms, etc."
                          className="w-full px-2.5 py-1 text-xs rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleSaveRow(item.student_id, item.student_name)}
                          disabled={savingId === item.student_id}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 ml-auto transition disabled:opacity-50"
                        >
                          <Save className="w-3 h-3" />
                          <span>{savingId === item.student_id ? 'Saving...' : 'Save'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default TrainingAssessments;
