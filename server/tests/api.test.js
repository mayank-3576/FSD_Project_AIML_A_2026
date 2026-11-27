import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import { initDb } from '../src/db/db.js';
import { runMigrations } from '../src/db/migrate.js';
import { seed } from '../src/db/seed.js';
import { checkEligibility } from '../src/services/eligibilityEngine.js';

let server;
let baseUrl;

test.before(async () => {
  await initDb();
  await runMigrations();
  await seed();

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    server.close();
  }
});

test('GET /api/health should return system status and ABES College Code 032', async () => {
  const res = await fetch(`http://localhost:${server.address().port}/api/health`);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.status, 'healthy');
  assert.match(data.college, /032/);
});

test('POST /api/v1/auth/login with student demo credentials', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'student@abes.ac.in',
      password: 'Student@123',
    }),
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.user.role, 'user');
  assert.strictEqual(data.user.email, 'student@abes.ac.in');
  assert.strictEqual(data.user.studentProfile.roll_no, '2400321530154');
  assert.ok(data.token);
});

test('POST /api/v1/auth/login with organization demo credentials', async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'org@abes.ac.in',
      password: 'Org@123',
    }),
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.user.role, 'organization');
  assert.ok(data.token);
});

test('Role-based access: Student cannot access GET /api/v1/students', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@abes.ac.in', password: 'Student@123' }),
  });
  const loginData = await loginRes.json();

  const res = await fetch(`${baseUrl}/students`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  assert.strictEqual(res.status, 403);
});

test('Organization CAN access GET /api/v1/students and analytics summary', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'org@abes.ac.in', password: 'Org@123' }),
  });
  const loginData = await loginRes.json();

  const res = await fetch(`${baseUrl}/students`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(data.students.length >= 10);

  const analyticsRes = await fetch(`${baseUrl}/analytics/summary`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  const analyticsData = await analyticsRes.json();
  assert.strictEqual(analyticsRes.status, 200);
  assert.strictEqual(analyticsData.kpi.totalStudents >= 10, true);
  assert.ok(analyticsData.branchWiseStats.length > 0);
});

test('Eligibility Engine: check CGPA, Backlogs, and Branch constraints', () => {
  const student = {
    cgpa: 8.6,
    active_backlogs: 0,
    branch: 'CSE (AI & ML)',
  };

  const eligibleDrive = {
    status: 'Open',
    min_cgpa: 8.0,
    max_backlogs: 0,
    eligible_branches: JSON.stringify(['CSE', 'AIML', 'IT']),
    registration_deadline: new Date(Date.now() + 86400000).toISOString(),
  };

  const res1 = checkEligibility(student, eligibleDrive);
  assert.strictEqual(res1.isEligible, true);
  assert.strictEqual(res1.failedReasons.length, 0);

  const highCgpaDrive = {
    ...eligibleDrive,
    min_cgpa: 9.0,
  };
  const res2 = checkEligibility(student, highCgpaDrive);
  assert.strictEqual(res2.isEligible, false);
  assert.match(res2.failedReasons[0], /Minimum CGPA 9.0/);

  const restrictedBranchDrive = {
    ...eligibleDrive,
    eligible_branches: JSON.stringify(['ECE']),
  };
  const res3 = checkEligibility(student, restrictedBranchDrive);
  assert.strictEqual(res3.isEligible, false);
  assert.match(res3.failedReasons[0], /Eligible branches/);
});

test('Password reset OTP generation flow works locally', async () => {
  const reqRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'request',
      email: 'student@abes.ac.in',
    }),
  });
  const reqData = await reqRes.json();
  assert.strictEqual(reqRes.status, 200);
  assert.ok(reqData.devOtp);

  // Now reset using the generated OTP
  const resetRes = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify-and-reset',
      email: 'student@abes.ac.in',
      otp: reqData.devOtp,
      newPassword: 'Student@123',
    }),
  });
  const resetData = await resetRes.json();
  assert.strictEqual(resetRes.status, 200);
  assert.strictEqual(resetData.success, true);
});

test('POST /api/v1/resume-checker/analyze audits resume and provides score and STAR rewrites', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@abes.ac.in', password: 'Student@123' }),
  });
  const loginData = await loginRes.json();

  const auditRes = await fetch(`${baseUrl}/resume-checker/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({
      resume_text: `Raghav Bhatnagar. B.Tech CSE AI&ML at ABES Engineering College (032).
      Skills: Python, React, Node.js, SQL, Docker, AWS.
      Projects:
      - Worked on campus recruitment portal with React and Node.js.
      - Developed deep convolutional neural network ResNet-50 achieving 93.8% accuracy.`,
    }),
  });
  const auditData = await auditRes.json();
  assert.strictEqual(auditRes.status, 200);
  assert.strictEqual(auditData.success, true);
  assert.ok(auditData.audit.overall_score > 0);
  assert.ok(auditData.audit.grade_badge);
  assert.ok(auditData.audit.section_scores);
  assert.ok(auditData.audit.bullet_rewrites);
});

test('POST /api/v1/ats-checker/score compares resume and JD for match score and keyword gap', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@abes.ac.in', password: 'Student@123' }),
  });
  const loginData = await loginRes.json();

  const atsRes = await fetch(`${baseUrl}/ats-checker/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({
      job_title: 'SDE-1 (Full Stack)',
      jd_text: `Role: Full Stack Engineer. Responsibilities: Design and implement high-performance microservices and responsive web UI.
      Must Have: Python, React, Node.js, PostgreSQL, Docker.
      Good to have: Redis, AWS, Kubernetes, GraphQL.`,
      resume_text: `Raghav Bhatnagar. Proficient in Python, React, Node.js, PostgreSQL, Docker, Git. Built full-stack portals.`,
    }),
  });
  const atsData = await atsRes.json();
  assert.strictEqual(atsRes.status, 200);
  assert.strictEqual(atsData.success, true);
  assert.ok(atsData.scan.match_score > 0);
  assert.ok(atsData.scan.shortlist_probability);
  assert.ok(Array.isArray(atsData.scan.matched_keywords));
});

test('AI Interview Flow: Start session, submit answer, and generate 5-axis summary', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@abes.ac.in', password: 'Student@123' }),
  });
  const loginData = await loginRes.json();

  // 1. Start session
  const startRes = await fetch(`${baseUrl}/ai-interview/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({
      target_role: 'Full Stack Software Engineer',
      interview_type: 'Mixed Technical & HR',
      difficulty: 'Medium',
      question_count: 3,
      input_mode: 'Text Chat',
    }),
  });
  const startData = await startRes.json();
  assert.strictEqual(startRes.status, 201);
  assert.strictEqual(startData.success, true);
  const sessionId = startData.session.session_id;

  // 2. Submit answer to question 0
  const answerRes = await fetch(`${baseUrl}/ai-interview/${sessionId}/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({
      question_index: 0,
      answer:
        'I prioritize indexed relational tables, connection pooling, and multi-tier Redis caching to maintain sub-50ms query response times under high concurrency.',
    }),
  });
  const answerData = await answerRes.json();
  assert.strictEqual(answerRes.status, 200);
  assert.strictEqual(answerData.success, true);
  assert.ok(answerData.evaluation.score !== undefined);

  // 3. Finish session
  const finishRes = await fetch(`${baseUrl}/ai-interview/${sessionId}/finish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({ duration_seconds: 150 }),
  });
  const finishData = await finishRes.json();
  assert.strictEqual(finishRes.status, 200);
  assert.strictEqual(finishData.success, true);
  assert.strictEqual(finishData.session.status, 'Completed');
  assert.ok(finishData.session.axis_scores.technical_accuracy !== undefined);
  assert.ok(finishData.session.axis_scores.communication_clarity !== undefined);
});

test('Mock Interview Flow: TPO schedules slot, Student books, TPO submits 4-axis scorecard', async () => {
  // Login Org
  const orgLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'org@abes.ac.in', password: 'Org@123' }),
  });
  const orgLogin = await orgLoginRes.json();

  // Login Student
  const stuLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@abes.ac.in', password: 'Student@123' }),
  });
  const stuLogin = await stuLoginRes.json();

  // 1. TPO creates mock slot
  const slotRes = await fetch(`${baseUrl}/mock-interviews/slots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${orgLogin.token}`,
    },
    body: JSON.stringify({
      title: 'Automated Test Mock Interview Panel',
      track: 'Full-Stack Technical',
      interviewer_name: 'Dr. TPO Panelist',
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 45,
      meeting_link_or_room: 'Room B-301',
      capacity: 3,
    }),
  });
  const slotData = await slotRes.json();
  assert.strictEqual(slotRes.status, 201);
  const slotId = slotData.slot.slot_id;

  // 2. Student books seat
  const bookRes = await fetch(`${baseUrl}/mock-interviews/slots/${slotId}/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${stuLogin.token}`,
    },
  });
  const bookData = await bookRes.json();
  assert.strictEqual(bookRes.status, 201);
  assert.strictEqual(bookData.success, true);

  // 3. TPO fetches all bookings
  const allBookingsRes = await fetch(`${baseUrl}/mock-interviews/all-bookings`, {
    headers: { Authorization: `Bearer ${orgLogin.token}` },
  });
  const allBookings = await allBookingsRes.json();
  const createdBooking = allBookings.bookings.find((b) => b.slot_id === slotId);
  assert.ok(createdBooking);

  // 4. TPO evaluates candidate
  const evalRes = await fetch(
    `${baseUrl}/mock-interviews/bookings/${createdBooking.booking_id}/evaluate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${orgLogin.token}`,
      },
      body: JSON.stringify({
        dsa_score: 92,
        core_cs_score: 88,
        project_defense_score: 95,
        communication_score: 90,
        readiness_verdict: 'Ready',
        strengths: 'Excellent algorithmic thinking and project defense.',
        action_items: 'Review Linux kernel internals.',
      }),
    }
  );
  const evalData = await evalRes.json();
  assert.strictEqual(evalRes.status, 200);
  assert.strictEqual(evalData.success, true);
});

test('POST /api/v1/drives/parse-jd extracts structured fields from raw text', async () => {
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'org@abes.ac.in', password: 'Org@123' }),
  });
  const loginData = await loginRes.json();

  const parseRes = await fetch(`${baseUrl}/drives/parse-jd`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${loginData.token}`,
    },
    body: JSON.stringify({
      jd_text: `Software Development Engineer - Cloud Services
      We are looking for an SDE to build microservices.
      Package: 14.5 LPA CTC. Location: Noida / Bengaluru.
      Eligibility: Minimum CGPA 7.5.
      Requirements:
      • Design RESTful microservices with Node.js and Python.
      • Manage PostgreSQL database clusters.
      • Deploy with Docker and Kubernetes.`,
    }),
  });
  const parseData = await parseRes.json();
  assert.strictEqual(parseRes.status, 200);
  assert.strictEqual(parseData.success, true);
  assert.strictEqual(parseData.extracted.ctc_lpa, 14.5);
  assert.strictEqual(parseData.extracted.min_cgpa, 7.5);
  assert.ok(parseData.extracted.must_have_skills.length > 0);
});
