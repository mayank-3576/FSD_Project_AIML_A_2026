import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  User,
  Hash,
  BookOpen,
  GraduationCap,
  Percent,
  AlertTriangle,
  Globe,
  Link2,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export function StudentProfile() {
  const { user, studentProfile, updateStudentProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [rollNo, setRollNo] = useState(studentProfile?.roll_no || '');
  const [branch, setBranch] = useState(studentProfile?.branch || 'CSE (AI & ML)');
  const [section, setSection] = useState(studentProfile?.section || 'A');
  const [batchYear, setBatchYear] = useState(studentProfile?.batch_year || '2024–2028');
  const [tenthPct, setTenthPct] = useState(studentProfile?.tenth_pct || '92.5');
  const [twelfthPct, setTwelfthPct] = useState(studentProfile?.twelfth_pct || '90.0');
  const [cgpa, setCgpa] = useState(studentProfile?.cgpa || '8.6');
  const [backlogs, setBacklogs] = useState(studentProfile?.active_backlogs ?? 0);
  const [githubUrl, setGithubUrl] = useState(studentProfile?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(studentProfile?.linkedin_url || '');
  const [resumeUrl, setResumeUrl] = useState(studentProfile?.resume_url || '');

  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handle PDF Resume Upload
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Only PDF documents are allowed for resume upload.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Resume file size must be less than 5MB.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/uploads/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success && res.file) {
        setResumeUrl(res.file.url);
        updateStudentProfile({ resume_url: res.file.url });
        setSuccessMsg('Resume uploaded successfully and linked to your verified profile!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload resume');
    } finally {
      setUploading(false);
    }
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!studentProfile?.student_id) return;

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.put(`/students/${studentProfile.student_id}`, {
        name,
        roll_no: rollNo,
        branch,
        section,
        batch_year: batchYear,
        tenth_pct: parseFloat(tenthPct),
        twelfth_pct: parseFloat(twelfthPct),
        cgpa: parseFloat(cgpa),
        active_backlogs: parseInt(backlogs, 10),
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        resume_url: resumeUrl,
      });

      if (res.success) {
        updateStudentProfile(res.student);
        setSuccessMsg('Student profile updated successfully!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update student profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Student Placement Profile</h1>
            <p className="text-xs text-slate-500">
              ABES Engineering College (College Code: 032) • Campus Placement Verification
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Resume Upload Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">PDF Resume Upload & Preview</h2>
        <p className="text-xs text-slate-500 mb-4">
          Companies inspect your uploaded resume when you submit placement drive applications.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 hover:bg-slate-50 transition">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <FileText className="w-6 h-6" />
            </div>
            <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading PDF...' : 'Choose PDF Resume'}</span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={handleResumeUpload}
              />
            </label>
            <span className="text-[11px] text-slate-400 mt-1">PDF only (Max 5MB)</span>
          </div>

          <div className="flex-1 border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-6 w-full">
            <span className="text-xs font-semibold text-slate-700 block mb-1">Current Active Resume</span>
            {resumeUrl ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-rose-600" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {resumeUrl.split('/').pop()}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-medium">Verified for one-click apply</p>
                  </div>
                </div>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Preview PDF</span>
                </a>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>No resume uploaded yet. Please upload a PDF before applying to drives.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSaveProfile} className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Academic & Personal Details</h2>
          <p className="text-xs text-slate-500">
            Keep your roll number, CGPA, and branch accurate for automated drive eligibility checking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Student Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">University Roll Number</label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="2400321530154"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="CSE (AI & ML)">CSE (AI & ML)</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Year</label>
              <input
                type="text"
                value={batchYear}
                onChange={(e) => setBatchYear(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">10th Percentage (%)</label>
              <div className="relative">
                <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={tenthPct}
                  onChange={(e) => setTenthPct(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">12th Percentage (%)</label>
              <div className="relative">
                <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={twelfthPct}
                  onChange={(e) => setTwelfthPct(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current CGPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                required
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Active Backlogs</label>
              <input
                type="number"
                min="0"
                required
                value={backlogs}
                onChange={(e) => setBacklogs(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">GitHub Profile URL</label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/your-username"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn Profile URL</label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            {saving ? 'Saving changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default StudentProfile;
