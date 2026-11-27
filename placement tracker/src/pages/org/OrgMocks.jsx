import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  Plus,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Trash2,
  Edit,
  X,
  UserCheck,
  RotateCcw,
} from 'lucide-react';

export default function OrgMocks() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // New Slot Modal State
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({
    title: '',
    track: 'Full-Stack Technical',
    interviewer_name: 'ABES TPO Senior Panelist',
    scheduled_at: '',
    duration_minutes: 45,
    meeting_link_or_room: 'TPO Interview Lab B-204',
    capacity: 5,
  });

  // Evaluate Candidate Modal State
  const [evalBooking, setEvalBooking] = useState(null);
  const [evalForm, setEvalForm] = useState({
    dsa_score: 85,
    core_cs_score: 80,
    project_defense_score: 90,
    communication_score: 85,
    readiness_verdict: 'Ready',
    strengths: 'Strong algorithmic understanding, explains edge cases well.',
    action_items: 'Revise concurrency and distributed caching topics.',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsRes, bookingsRes] = await Promise.all([
        api.get('/mock-interviews/slots'),
        api.get('/mock-interviews/all-bookings'),
      ]);

      if (slotsRes.success) setSlots(slotsRes.slots || []);
      if (bookingsRes.success) setBookings(bookingsRes.bookings || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch mock sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await api.post('/mock-interviews/slots', slotForm);
      if (res.success) {
        setMessage('Mock interview slot scheduled successfully');
        setShowSlotModal(false);
        setSlotForm({
          title: '',
          track: 'Full-Stack Technical',
          interviewer_name: 'ABES TPO Senior Panelist',
          scheduled_at: '',
          duration_minutes: 45,
          meeting_link_or_room: 'TPO Interview Lab B-204',
          capacity: 5,
        });
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to create slot');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this mock interview slot? All associated bookings will be removed.')) return;
    try {
      const res = await api.delete(`/mock-interviews/slots/${slotId}`);
      if (res.success) {
        setMessage('Slot deleted');
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete slot');
    }
  };

  const handleOpenEvaluate = (booking) => {
    setEvalBooking(booking);
    setEvalForm({
      dsa_score: booking.dsa_score || 85,
      core_cs_score: booking.core_cs_score || 80,
      project_defense_score: booking.project_defense_score || 90,
      communication_score: booking.communication_score || 85,
      readiness_verdict: booking.readiness_verdict || 'Ready',
      strengths: booking.strengths || 'Strong grasp of foundational concepts.',
      action_items: booking.action_items || 'Continue practicing speed on dynamic programming.',
    });
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!evalBooking) return;
    try {
      const res = await api.post(`/mock-interviews/bookings/${evalBooking.booking_id}/evaluate`, evalForm);
      if (res.success) {
        setMessage(`Evaluation saved for ${evalBooking.student_name}`);
        setEvalBooking(null);
        fetchData();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit evaluation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2.5 py-0.5 rounded border border-blue-400/30">
                TPO Operations
              </span>
              <span className="text-xs text-slate-300">Mock Panels & Candidate Evaluations</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Mock Interview Management</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Schedule technical and HR mock evaluation panels, manage seat capacity, review registered candidates, and submit 4-axis assessment scorecards that synchronize with student readiness profiles.
            </p>
          </div>

          <button
            onClick={() => setShowSlotModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-semibold shadow transition-colors shrink-0 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Mock Slot</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Slots Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center justify-between">
          <span>Active Scheduled Slots ({slots.length})</span>
          <button
            onClick={fetchData}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slots.map((slot) => (
            <div
              key={slot.slot_id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    {slot.track}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{slot.title}</h3>
                </div>
                <button
                  onClick={() => handleDeleteSlot(slot.slot_id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Delete slot"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <strong>Panelist:</strong> {slot.interviewer_name}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(slot.scheduled_at).toLocaleDateString()} at{' '}
                  {new Date(slot.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p>
                  <strong>Room/Link:</strong> {slot.meeting_link_or_room}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                <span className="font-semibold text-slate-700">
                  {slot.booked_count} of {slot.capacity} Booked
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    slot.status === 'Upcoming'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {slot.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Candidate Bookings Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Candidate Reservations & Evaluations ({bookings.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3">Student Name / Roll</th>
                <th className="p-3">Branch / CGPA</th>
                <th className="p-3">Slot Title</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Verdict / Scores</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => (
                <tr key={b.booking_id} className="hover:bg-slate-50/60">
                  <td className="p-3">
                    <span className="font-bold text-slate-900 block">{b.student_name}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{b.roll_no}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-800">{b.branch}</span>
                    <span className="text-slate-500 block">CGPA {b.cgpa}</span>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{b.slot_title}</td>
                  <td className="p-3 text-slate-600">
                    {new Date(b.scheduled_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        b.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border-blue-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {b.status === 'Completed' ? (
                      <div>
                        <span className="font-bold text-emerald-700 block">{b.readiness_verdict}</span>
                        <span className="text-[10px] text-slate-500">
                          DSA: {b.dsa_score} • Core: {b.core_cs_score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pending Evaluation</span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleOpenEvaluate(b)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition-colors"
                    >
                      {b.status === 'Completed' ? 'Re-Evaluate' : 'Evaluate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Mock Slot */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Faculty Mock Slot</h3>
              <button onClick={() => setShowSlotModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSlot} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={slotForm.title}
                  onChange={(e) => setSlotForm({ ...slotForm, title: e.target.value })}
                  placeholder="e.g. SDE Full-Stack Technical Round Mock"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Track</label>
                  <select
                    value={slotForm.track}
                    onChange={(e) => setSlotForm({ ...slotForm, track: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Full-Stack Technical">Full-Stack Technical</option>
                    <option value="DSA & Problem Solving">DSA & Problem Solving</option>
                    <option value="Core CS Fundamentals">Core CS Fundamentals</option>
                    <option value="HR & Behavioral">HR & Behavioral</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Panelist / Evaluator</label>
                  <input
                    type="text"
                    required
                    value={slotForm.interviewer_name}
                    onChange={(e) => setSlotForm({ ...slotForm, interviewer_name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={slotForm.scheduled_at}
                    onChange={(e) => setSlotForm({ ...slotForm, scheduled_at: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    max="120"
                    value={slotForm.duration_minutes}
                    onChange={(e) => setSlotForm({ ...slotForm, duration_minutes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room No / Meet Link</label>
                  <input
                    type="text"
                    required
                    value={slotForm.meeting_link_or_room}
                    onChange={(e) => setSlotForm({ ...slotForm, meeting_link_or_room: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Capacity (Seats)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={slotForm.capacity}
                    onChange={(e) => setSlotForm({ ...slotForm, capacity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSlotModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow"
                >
                  Save & Publish Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Evaluate Candidate */}
      {evalBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Evaluate {evalBooking.student_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Roll: {evalBooking.roll_no} • {evalBooking.slot_title}
                </p>
              </div>
              <button onClick={() => setEvalBooking(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluation} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">DSA Score (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalForm.dsa_score}
                    onChange={(e) => setEvalForm({ ...evalForm, dsa_score: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Core CS (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalForm.core_cs_score}
                    onChange={(e) => setEvalForm({ ...evalForm, core_cs_score: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Project Defense (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalForm.project_defense_score}
                    onChange={(e) => setEvalForm({ ...evalForm, project_defense_score: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Communication (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalForm.communication_score}
                    onChange={(e) => setEvalForm({ ...evalForm, communication_score: e.target.value })}
                    className="w-full p-2 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Readiness Verdict</label>
                <select
                  value={evalForm.readiness_verdict}
                  onChange={(e) => setEvalForm({ ...evalForm, readiness_verdict: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Ready">Ready (Cleared for Tier-1 Recruitment)</option>
                  <option value="Needs Improvement">Needs Improvement (More practice needed)</option>
                  <option value="Borderline">Borderline (Close to benchmark)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observed Strengths</label>
                <textarea
                  rows={2}
                  value={evalForm.strengths}
                  onChange={(e) => setEvalForm({ ...evalForm, strengths: e.target.value })}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Action Items / Feedback</label>
                <textarea
                  rows={2}
                  value={evalForm.action_items}
                  onChange={(e) => setEvalForm({ ...evalForm, action_items: e.target.value })}
                  className="w-full p-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEvalBooking(null)}
                  className="px-4 py-2 border rounded-xl text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow"
                >
                  Save Scorecard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
