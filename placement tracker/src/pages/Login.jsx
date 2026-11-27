import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Shield,
  Building,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export function Login() {
  const [roleToggle, setRoleToggle] = useState('user'); // 'user' or 'organization'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoStudent = async () => {
    setRoleToggle('user');
    setEmail('student@abes.ac.in');
    setPassword('Student@123');
    setError('');
    setSubmitting(true);
    try {
      await login('student@abes.ac.in', 'Student@123');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoOrg = async () => {
    setRoleToggle('organization');
    setEmail('org@abes.ac.in');
    setPassword('Org@123');
    setError('');
    setSubmitting(true);
    try {
      await login('org@abes.ac.in', 'Org@123');
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative z-10">
        {/* Header with College Code */}
        <div className="bg-slate-950 p-6 text-white text-center border-b border-slate-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-3 shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-xl font-bold tracking-tight text-white">ABES Engineering College</h1>
            <span className="text-xs bg-blue-500/30 text-blue-300 font-semibold px-2 py-0.5 rounded border border-blue-400/30">
              Code: 032
            </span>
          </div>
          <p className="text-xs text-slate-400">Placement Tracker — Campus Recruitment System</p>
        </div>

        {/* Demo Credentials Quick Click Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              One-Click Demo Access
            </span>
            <span className="text-[11px] text-slate-500">Instant login</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDemoStudent}
              disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 shadow-xs transition-all active:scale-95"
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Raghav (Student)</span>
            </button>
            <button
              type="button"
              onClick={handleDemoOrg}
              disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 shadow-xs transition-all active:scale-95"
            >
              <Building className="w-3.5 h-3.5 text-purple-600" />
              <span>TPO Office (Org)</span>
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8">
          {/* Role Selector Toggle */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => setRoleToggle('user')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                roleToggle === 'user'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>Student Login</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleToggle('organization')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                roleToggle === 'organization'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-purple-600" />
              <span>TPO / Organization</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={roleToggle === 'user' ? 'student@abes.ac.in' : 'org@abes.ac.in'}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In as {roleToggle === 'organization' ? 'TPO Staff' : 'Student'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration link */}
          <div className="mt-6 text-center text-xs text-slate-600">
            New to Placement Tracker?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-800">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
