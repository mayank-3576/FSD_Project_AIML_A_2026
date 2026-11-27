//import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Menu, Shield, GraduationCap, Building } from 'lucide-react';

export function Navbar({ onMenuToggle }) {
  const { user, role} = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Left: Mobile menu button & Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Placement Tracker
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                <GraduationCap className="w-3 h-3" />
                ABES EC (032)
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500">
              Campus Recruitment Management System
            </p>
          </div>
        </div>

        {/* Right: Role indicator & User profile pill */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {role === 'organization' ? (
              <Building className="w-3.5 h-3.5 text-purple-600" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span className="hidden sm:inline">Role:</span>
            <span className="font-semibold text-slate-900">
              {role === 'organization' ? 'TPO / Org' : 'Student'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                {user?.email}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
