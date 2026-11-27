import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  UserCheck,
  Building2,
  Users,
  GraduationCap,
  Award,
  LogOut,
  ChevronRight,
  Sparkles,
  Target,
  Mic,
  Calendar,
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const { user, role, logout } = useAuth();

  const studentLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Eligible Drives', path: '/drives', icon: Briefcase },
    { name: 'My Applications', path: '/applications', icon: FileText },
    { name: 'Resume Auditor (STAR)', path: '/resume-checker', icon: Sparkles },
    { name: 'ATS Match Checker', path: '/ats-score-checker', icon: Target },
    { name: 'AI Interview Simulator', path: '/ai-interview', icon: Mic },
    { name: 'Faculty Mock Panels', path: '/mock-interviews', icon: Calendar },
    { name: 'Profile & Resume', path: '/profile', icon: UserCheck },
  ];

  const orgLinks = [
    { name: 'Placement Analytics', path: '/', icon: LayoutDashboard },
    { name: 'Companies Directory', path: '/companies', icon: Building2 },
    { name: 'Placement Drives', path: '/drives', icon: Briefcase },
    { name: 'Applicant Pipeline', path: '/applications', icon: FileText },
    { name: 'Mock Panels Manager', path: '/mock-interviews', icon: Calendar },
    { name: 'Student Directory', path: '/students', icon: Users },
    { name: 'Training Readiness', path: '/assessments', icon: Award },
  ];

  const links = role === 'organization' ? orgLinks : studentLinks;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* College Brand Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">ABES EC</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-1.5 py-0.5 rounded border border-blue-400/30">
                  032
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Placement Tracker</p>
            </div>
          </div>
        </div>

        {/* Role Tag & Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {role === 'organization' ? 'TPO Portal' : 'Student Portal'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  role === 'organization'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {role === 'organization' ? 'Organization' : 'Student'}
              </span>
            </div>

            <nav className="space-y-1">
              {links.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 opacity-80 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 mb-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-500/20 rounded-md transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
