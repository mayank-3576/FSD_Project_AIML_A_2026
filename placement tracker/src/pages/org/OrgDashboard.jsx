import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  Users,
  Award,
  TrendingUp,
  Building2,
  Briefcase,
  UserCheck,
  UserX,
  DollarSign,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
const TIER_COLORS = {
  'Super Dream': '#8b5cf6',
  Dream: '#3b82f6',
  Standard: '#10b981',
};

export function OrgDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await api.get('/analytics/summary');
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load analytics summary:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSummary();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { kpi, branchWiseStats, companyHires, tierDistribution } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            TPO Central Command • ABES EC (College Code: 032)
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Placement Analytics & Insights</h1>
          <p className="text-xs text-slate-300 mt-1">
            Comprehensive recruitment metrics, hiring partner performance, and student placement rates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/drives"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Drive</span>
          </Link>
          <Link
            to="/companies"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Manage Companies</span>
          </Link>
        </div>
      </div>

      {/* 7 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* KPI 1: Total Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Total Students</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{kpi.totalStudents}</p>
          <span className="text-[10px] text-slate-500">Registered batch</span>
        </div>

        {/* KPI 2: Placement % */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Placement %</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-600">{kpi.placementPercentage}%</p>
          <span className="text-[10px] text-emerald-700 font-semibold">{kpi.placedStudents} Placed</span>
        </div>

        {/* KPI 3: Highest CTC */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Highest CTC</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-purple-600">{kpi.highestCtc} <span className="text-xs font-normal">LPA</span></p>
          <span className="text-[10px] text-purple-700 font-medium">Super Dream Offer</span>
        </div>

        {/* KPI 4: Average CTC */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Average CTC</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-indigo-600">{kpi.avgCtc} <span className="text-xs font-normal">LPA</span></p>
          <span className="text-[10px] text-slate-500">Across {kpi.totalOffers} offers</span>
        </div>

        {/* KPI 5: Partner Companies */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Partners</span>
            <Building2 className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xl font-bold text-slate-900">{kpi.partnerCompanies}</p>
          <span className="text-[10px] text-slate-500">Active recruiters</span>
        </div>

        {/* KPI 6: Active Drives */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Active Drives</span>
            <Briefcase className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-600">{kpi.activeDrives}</p>
          <span className="text-[10px] text-amber-700 font-medium">Open for apply</span>
        </div>

        {/* KPI 7: Unplaced Students */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-medium">Unplaced</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-slate-900">{kpi.unplacedStudents}</p>
          <span className="text-[10px] text-rose-600 font-medium">In active training</span>
        </div>
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Branch-wise Placement % */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Branch-wise Placement Statistics</h2>
            <p className="text-xs text-slate-500">Total students vs placed students by engineering branch</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={branchWiseStats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'percentage' ? `${value}%` : value,
                    name === 'total' ? 'Total Students' : name === 'placed' ? 'Placed Students' : 'Placement %',
                  ]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="total" name="Total Students" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="placed" name="Placed Students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Company-wise Hiring Count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Company-wise Hiring Distribution</h2>
            <p className="text-xs text-slate-500">Offers extended by major corporate partners</p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyHires} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="company" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value, name, item) => [
                    `${value} Hires (${item.payload.avg_ctc} LPA avg)`,
                    'Offers',
                  ]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="hires" name="Students Hired" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* CTC Tier Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Hiring Tier Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown of drives across CTC packages</p>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierDistribution}
                  dataKey="drives_count"
                  nameKey="tier"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={5}
                >
                  {tierDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={TIER_COLORS[entry.tier] || COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, item) => [`${value} Drives (${item.payload.offers_count} Offers)`, name]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 mt-2">
            {tierDistribution.map((t) => (
              <div key={t.tier} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: TIER_COLORS[t.tier] || '#64748b' }}
                  />
                  <span className="font-medium text-slate-700">{t.tier}</span>
                </div>
                <span className="font-bold text-slate-900">
                  {t.drives_count} drives ({t.offers_count} offers)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Pipeline Status */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Top Performing Student Profiles</h2>
              <p className="text-xs text-slate-500">ABES EC high-achievers with confirmed placement offers</p>
            </div>
            <Link to="/students" className="text-xs text-blue-600 hover:underline font-semibold">
              View All Students →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Roll Number</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Branch & Sec</th>
                  <th className="py-2.5 px-3">CGPA</th>
                  <th className="py-2.5 px-3">Readiness</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono font-medium">2400321530154</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">Raghav Bhatnagar</td>
                  <td className="py-2 px-3">CSE (AI & ML) - A</td>
                  <td className="py-2 px-3 font-bold text-emerald-600">8.60</td>
                  <td className="py-2 px-3 text-blue-600 font-medium">90/100</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Selected (TCS Digital)
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono font-medium">2400321510001</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">Aarav Sharma</td>
                  <td className="py-2 px-3">CSE - B</td>
                  <td className="py-2 px-3 font-bold text-emerald-600">8.90</td>
                  <td className="py-2 px-3 text-blue-600 font-medium">95/100</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                      Selected (Microsoft 42L)
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-mono font-medium">2400321530140</td>
                  <td className="py-2 px-3 font-semibold text-slate-900">Mayank Garg</td>
                  <td className="py-2 px-3">CSE (AI & ML) - A</td>
                  <td className="py-2 px-3 font-bold text-emerald-600">8.20</td>
                  <td className="py-2 px-3 text-blue-600 font-medium">84/100</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                      Selected (Infosys 9.5L)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrgDashboard;
