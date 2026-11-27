-- Placement Tracker & AI Recruitment Platform Database Schema for ABES Engineering College (College Code: 032)

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK(role IN ('user', 'organization')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. STUDENT_PROFILES
CREATE TABLE IF NOT EXISTS student_profiles (
  student_id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  roll_no VARCHAR(50) UNIQUE NOT NULL,
  branch VARCHAR(50) NOT NULL,
  section VARCHAR(10) NOT NULL,
  batch_year VARCHAR(20) NOT NULL,
  tenth_pct NUMERIC(5,2) DEFAULT 0,
  twelfth_pct NUMERIC(5,2) DEFAULT 0,
  cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.0,
  active_backlogs INTEGER NOT NULL DEFAULT 0,
  github_url TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  resume_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. COMPANIES
CREATE TABLE IF NOT EXISTS companies (
  company_id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name VARCHAR(255) NOT NULL,
  industry_sector VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  website VARCHAR(255),
  hr_name VARCHAR(255),
  hr_email VARCHAR(255),
  hr_phone VARCHAR(50),
  hiring_tier VARCHAR(50) NOT NULL CHECK(hiring_tier IN ('Standard', 'Dream', 'Super Dream')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. PLACEMENT_DRIVES
CREATE TABLE IF NOT EXISTS placement_drives (
  drive_id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  created_by INTEGER,
  job_role VARCHAR(255) NOT NULL,
  ctc_lpa NUMERIC(5,2) NOT NULL,
  location VARCHAR(255) NOT NULL,
  min_cgpa NUMERIC(4,2) NOT NULL DEFAULT 0.0,
  max_backlogs INTEGER NOT NULL DEFAULT 0,
  eligible_branches TEXT NOT NULL,
  registration_deadline TIMESTAMP NOT NULL,
  drive_date TIMESTAMP NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK(status IN ('Upcoming', 'Open', 'Closed')),
  selection_rounds TEXT NOT NULL DEFAULT '["Online Assessment", "Technical Interview", "HR Round"]',
  role_overview TEXT,
  responsibilities TEXT,
  must_have_skills TEXT,
  good_to_have_skills TEXT,
  bond_details TEXT,
  perks TEXT,
  ctc_breakdown TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 5. APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
  application_id INTEGER PRIMARY KEY AUTOINCREMENT,
  drive_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  current_round VARCHAR(100) NOT NULL DEFAULT 'Applied',
  status VARCHAR(50) NOT NULL DEFAULT 'In Review',
  ats_score NUMERIC(5,2) DEFAULT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(drive_id, student_id),
  FOREIGN KEY (drive_id) REFERENCES placement_drives(drive_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE
);

-- 6. TRAINING_SCORES
CREATE TABLE IF NOT EXISTS training_scores (
  score_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER UNIQUE NOT NULL,
  evaluated_by INTEGER,
  aptitude_score NUMERIC(5,2) DEFAULT 0,
  dsa_score NUMERIC(5,2) DEFAULT 0,
  mock_interview_remarks TEXT,
  ai_interview_avg_score NUMERIC(5,2) DEFAULT 0,
  best_ats_score NUMERIC(5,2) DEFAULT 0,
  readiness_verdict VARCHAR(50) DEFAULT 'In Progress',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE,
  FOREIGN KEY (evaluated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 7. RESUME_AUDITS
CREATE TABLE IF NOT EXISTS resume_audits (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  overall_score NUMERIC(5,2) NOT NULL,
  grade_badge VARCHAR(50) NOT NULL,
  section_scores TEXT NOT NULL,
  formatting_checks TEXT NOT NULL,
  impact_analysis TEXT NOT NULL,
  bullet_rewrites TEXT,
  extracted_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE
);

-- 8. ATS_SCANS
CREATE TABLE IF NOT EXISTS ats_scans (
  scan_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  drive_id INTEGER,
  job_title VARCHAR(255) NOT NULL,
  match_score NUMERIC(5,2) NOT NULL,
  shortlist_probability VARCHAR(50) NOT NULL,
  keyword_breakdown TEXT NOT NULL,
  matched_keywords TEXT,
  missing_must_have TEXT,
  missing_good_to_have TEXT,
  recommendations TEXT,
  resume_text TEXT,
  jd_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE,
  FOREIGN KEY (drive_id) REFERENCES placement_drives(drive_id) ON DELETE SET NULL
);

-- 9. AI_INTERVIEW_SESSIONS
CREATE TABLE IF NOT EXISTS ai_interview_sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  drive_id INTEGER,
  target_role VARCHAR(255) NOT NULL,
  interview_type VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50) NOT NULL DEFAULT 'Medium',
  input_mode VARCHAR(50) NOT NULL DEFAULT 'Text Chat',
  overall_score NUMERIC(5,2) DEFAULT 0,
  axis_scores TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'In Progress',
  duration_seconds INTEGER DEFAULT 0,
  questions_data TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE,
  FOREIGN KEY (drive_id) REFERENCES placement_drives(drive_id) ON DELETE SET NULL
);

-- 10. MOCK_INTERVIEW_SLOTS
CREATE TABLE IF NOT EXISTS mock_interview_slots (
  slot_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(255) NOT NULL,
  track VARCHAR(100) NOT NULL,
  interviewer_name VARCHAR(255) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  meeting_link_or_room VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 5,
  booked_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Upcoming' CHECK(status IN ('Upcoming', 'Completed', 'Cancelled')),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 11. MOCK_INTERVIEW_BOOKINGS
CREATE TABLE IF NOT EXISTS mock_interview_bookings (
  booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
  slot_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Booked' CHECK(status IN ('Booked', 'Completed', 'Cancelled', 'No-Show')),
  dsa_score NUMERIC(5,2) DEFAULT NULL,
  core_cs_score NUMERIC(5,2) DEFAULT NULL,
  project_defense_score NUMERIC(5,2) DEFAULT NULL,
  communication_score NUMERIC(5,2) DEFAULT NULL,
  readiness_verdict VARCHAR(50) DEFAULT NULL,
  strengths TEXT,
  action_items TEXT,
  evaluated_by INTEGER,
  evaluated_at TIMESTAMP,
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(slot_id, student_id),
  FOREIGN KEY (slot_id) REFERENCES mock_interview_slots(slot_id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES student_profiles(student_id) ON DELETE CASCADE,
  FOREIGN KEY (evaluated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 12. PASSWORD_RESETS
CREATE TABLE IF NOT EXISTS password_resets (
  reset_id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_user ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_branch ON student_profiles(branch);
CREATE INDEX IF NOT EXISTS idx_drives_company ON placement_drives(company_id);
CREATE INDEX IF NOT EXISTS idx_drives_status ON placement_drives(status);
CREATE INDEX IF NOT EXISTS idx_applications_drive ON applications(drive_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_resume_audits_student ON resume_audits(student_id);
CREATE INDEX IF NOT EXISTS idx_ats_scans_student ON ats_scans(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_student ON ai_interview_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_mock_slots_status ON mock_interview_slots(status);
CREATE INDEX IF NOT EXISTS idx_mock_bookings_student ON mock_interview_bookings(student_id);
