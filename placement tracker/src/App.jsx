import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentDrives from './pages/student/StudentDrives';
import StudentApplications from './pages/student/StudentApplications';
import StudentProfile from './pages/student/StudentProfile';
import ResumeChecker from './pages/student/ResumeChecker';
import AtsScoreChecker from './pages/student/AtsScoreChecker';
import AiInterviewSimulator from './pages/student/AiInterviewSimulator';
import StudentMocks from './pages/student/StudentMocks';

// Organization Pages
import OrgDashboard from './pages/org/OrgDashboard';
import CompaniesManager from './pages/org/CompaniesManager';
import DrivesManager from './pages/org/DrivesManager';
import DriveApplicants from './pages/org/DriveApplicants';
import StudentDirectory from './pages/org/StudentDirectory';
import TrainingAssessments from './pages/org/TrainingAssessments';
import OrgMocks from './pages/org/OrgMocks';
import ApplicantPipeline from './pages/org/ApplicantPipeline';

// Role Dispatchers for shared paths
function DashboardDispatcher() {
  const { role } = useAuth();
  return role === 'organization' ? <OrgDashboard /> : <StudentDashboard />;
}

function DrivesDispatcher() {
  const { role } = useAuth();
  return role === 'organization' ? <DrivesManager /> : <StudentDrives />;
}

function ApplicationsDispatcher() {
  const { role } = useAuth();
  return role === 'organization' ? <ApplicantPipeline /> : <StudentApplications />;
}

function MocksDispatcher() {
  const { role } = useAuth();
  return role === 'organization' ? <OrgMocks /> : <StudentMocks />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Dynamic Dashboard based on Role */}
            <Route index element={<DashboardDispatcher />} />

            {/* Drives Route */}
            <Route path="drives" element={<DrivesDispatcher />} />
            <Route
              path="drives/:id/applicants"
              element={
                <ProtectedRoute allowedRoles={['organization']}>
                  <DriveApplicants />
                </ProtectedRoute>
              }
            />

            {/* Applications Route */}
            <Route path="applications" element={<ApplicationsDispatcher />} />

            {/* AI Tools for Students */}
            <Route
              path="resume-checker"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <ResumeChecker />
                </ProtectedRoute>
              }
            />
            <Route
              path="ats-score-checker"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <AtsScoreChecker />
                </ProtectedRoute>
              }
            />
            <Route
              path="ai-interview"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <AiInterviewSimulator />
                </ProtectedRoute>
              }
            />

            {/* Mock Interviews (Dynamic based on Role) */}
            <Route path="mock-interviews" element={<MocksDispatcher />} />

            {/* Student Specific Routes */}
            <Route
              path="profile"
              element={
                <ProtectedRoute allowedRoles={['user']}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />

            {/* Organization Specific Routes */}
            <Route
              path="companies"
              element={
                <ProtectedRoute allowedRoles={['organization']}>
                  <CompaniesManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="students"
              element={
                <ProtectedRoute allowedRoles={['organization']}>
                  <StudentDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="assessments"
              element={
                <ProtectedRoute allowedRoles={['organization']}>
                  <TrainingAssessments />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
