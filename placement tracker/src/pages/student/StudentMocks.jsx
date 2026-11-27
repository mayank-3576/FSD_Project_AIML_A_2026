import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  Award,
  Video,
  ChevronRight,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';

export default function StudentMocks() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [slotsRes, bookingsRes] = await Promise.all([
        api.get('/mock-interviews/slots'),
        api.get('/mock-interviews/my-bookings'),
      ]);

      if (slotsRes.success) setSlots(slotsRes.slots || []);
      if (bookingsRes.success) setMyBookings(bookingsRes.bookings || []);
    } catch (err) {
      setError(err.message || 'Failed to load mock interview data');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (slotId) => {
    setMessage(null);
    setError(null);
    setActionLoading(true);
    try {
      const res = await api.post(`/mock-interviews/slots/${slotId}/book`);
      setMessage(res.message || 'Seat reserved successfully!');
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to book slot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (slotId) => {
    if (!window.confirm('Are you sure you want to cancel this mock interview reservation?')) return;
    setMessage(null);
    setError(null);
    setActionLoading(true);
    try {
      const res = await api.delete(`/mock-interviews/slots/${slotId}/cancel-booking`);
      setMessage(res.message || 'Booking cancelled');
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-400/30">
                ABES TPO Offline & Virtual Mocks
              </span>
              <span className="text-xs text-slate-300">Live Faculty & Alumni Panels</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Faculty Mock Interview Sessions</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Book one-on-one and small group mock evaluations with senior ABES TPO panelists. Receive structured 4-dimensional scorecards across DSA, Core CS, Project Defense, and Communication.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: My Bookings & Available Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: My Booked / Completed Sessions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>My Mock Bookings & Scorecards ({myBookings.length})</span>
            </h2>

            {myBookings.length > 0 ? (
              <div className="space-y-4">
                {myBookings.map((b) => (
                  <div
                    key={b.booking_id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {b.track}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">{b.title}</h3>
                        <p className="text-xs text-slate-500">
                          Interviewer: <strong>{b.interviewer_name}</strong>
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          b.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : b.status === 'Booked'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {new Date(b.scheduled_at).toLocaleDateString()} at{' '}
                          {new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.meeting_link_or_room}</span>
                      </div>
                    </div>

                    {/* Evaluated Scorecard */}
                    {b.status === 'Completed' && (
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">TPO Scorecard</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Verdict: {b.readiness_verdict || 'Ready'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="p-2 bg-white rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">DSA / Algorithmic</span>
                            <span className="font-bold text-slate-900">{b.dsa_score || 0}/100</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">Core CS</span>
                            <span className="font-bold text-slate-900">{b.core_cs_score || 0}/100</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">Project Defense</span>
                            <span className="font-bold text-slate-900">{b.project_defense_score || 0}/100</span>
                          </div>
                          <div className="p-2 bg-white rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block">Communication</span>
                            <span className="font-bold text-slate-900">{b.communication_score || 0}/100</span>
                          </div>
                        </div>

                        {b.strengths && (
                          <p className="text-[11px] text-emerald-800 bg-emerald-50/60 p-2 rounded">
                            <strong>Strengths:</strong> {b.strengths}
                          </p>
                        )}
                        {b.action_items && (
                          <p className="text-[11px] text-amber-800 bg-amber-50/60 p-2 rounded">
                            <strong>Action Items:</strong> {b.action_items}
                          </p>
                        )}
                      </div>
                    )}

                    {b.status === 'Booked' && (
                      <button
                        onClick={() => handleCancel(b.slot_id)}
                        disabled={actionLoading}
                        className="w-full text-center text-xs font-semibold text-rose-600 hover:text-rose-800 py-1"
                      >
                        Cancel Reservation
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                You haven't reserved any mock interview seats yet. Choose from the available slots on the right.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Available TPO Slots (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Upcoming Scheduled Slots ({slots.length})</span>
              </div>
              <button
                onClick={fetchData}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </h2>

            <div className="space-y-4">
              {loading ? (
                <div className="py-12 flex justify-center">
                  <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  No mock interview slots are currently scheduled.
                </p>
              ) : (
                slots.map((slot) => (
                <div
                  key={slot.slot_id}
                  className="p-5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {slot.track}
                        </span>
                        <span className="text-xs text-slate-400">• {slot.duration_minutes} Minutes</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{slot.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                          slot.available_seats === 0
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : slot.available_seats <= 2
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {slot.available_seats === 0
                          ? 'Fully Booked'
                          : `${slot.available_seats} of ${slot.capacity} Seats Free`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>
                        {new Date(slot.scheduled_at).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at{' '}
                        {new Date(slot.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">Panelist: {slot.interviewer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Venue / Link: {slot.meeting_link_or_room}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pt-1">
                    {slot.is_booked_by_me ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Seat Confirmed for You</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBook(slot.slot_id)}
                        disabled={actionLoading || slot.is_full}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                      >
                        <span>Reserve My Seat</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
