import { query } from '../db/db.js';
import { checkEligibility } from '../services/eligibilityEngine.js';
import { autoExtractJdFields, checkAtsScore } from '../services/aiEngine.js';

export async function getDrives(req, res) {
  try {
    const { status, company_id, tier, q } = req.query;

    let sql = `
      SELECT 
        pd.*,
        c.company_name,
        c.industry_sector,
        c.hiring_tier,
        c.website,
        c.location as company_location,
        c.hr_name,
        c.hr_email,
        COUNT(app.application_id) as total_applicants,
        COUNT(CASE WHEN app.status = 'Selected' THEN 1 END) as total_selected
      FROM placement_drives pd
      JOIN companies c ON pd.company_id = c.company_id
      LEFT JOIN applications app ON pd.drive_id = app.drive_id
      WHERE 1=1
    `;

    const params = [];
    let paramIdx = 1;

    if (status && status !== 'All') {
      sql += ` AND pd.status = $${paramIdx++}`;
      params.push(status);
    }

    if (company_id) {
      sql += ` AND pd.company_id = $${paramIdx++}`;
      params.push(company_id);
    }

    if (tier && tier !== 'All') {
      sql += ` AND c.hiring_tier = $${paramIdx++}`;
      params.push(tier);
    }

    if (q) {
      sql += ` AND (pd.job_role LIKE $${paramIdx} OR c.company_name LIKE $${paramIdx} OR pd.location LIKE $${paramIdx})`;
      params.push(`%${q}%`);
      paramIdx++;
    }

    sql += `
      GROUP BY pd.drive_id, c.company_name, c.industry_sector, c.hiring_tier,
               c.website, c.location, c.hr_name, c.hr_email
      ORDER BY 
        CASE WHEN pd.status = 'Open' THEN 1 WHEN pd.status = 'Upcoming' THEN 2 ELSE 3 END,
        pd.drive_date ASC
    `;

    const result = await query(sql, params);
    let drives = result.rows;

    // If authenticated user is a student, attach eligibility details and application state
    if (req.user && req.user.role === 'user' && req.user.studentId) {
      const studentRes = await query('SELECT * FROM student_profiles WHERE student_id = $1', [
        req.user.studentId,
      ]);
      const student = studentRes.rows[0];

      const studentAppsRes = await query(
        'SELECT drive_id, application_id, current_round, status FROM applications WHERE student_id = $1',
        [req.user.studentId]
      );
      const appMap = {};
      studentAppsRes.rows.forEach((a) => {
        appMap[a.drive_id] = a;
      });

      drives = drives.map((d) => {
        const eligibility = checkEligibility(student, d);
        const userApp = appMap[d.drive_id];
        return {
          ...d,
          is_eligible: eligibility.isEligible,
          failed_reasons: eligibility.failedReasons,
          has_applied: !!userApp,
          application_id: userApp ? userApp.application_id : null,
          current_round: userApp ? userApp.current_round : null,
          application_status: userApp ? userApp.status : null,
        };
      });
    }

    return res.status(200).json({
      success: true,
      count: drives.length,
      drives,
    });
  } catch (err) {
    console.error('getDrives error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving placement drives' });
  }
}

export async function getDriveById(req, res) {
  try {
    const driveId = req.params.id;
    const driveRes = await query(
      `SELECT pd.*, c.company_name, c.industry_sector, c.hiring_tier, c.website, c.location as company_location,
              c.hr_name, c.hr_email, c.hr_phone
       FROM placement_drives pd
       JOIN companies c ON pd.company_id = c.company_id
       WHERE pd.drive_id = $1`,
      [driveId]
    );

    if (driveRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Placement drive not found' });
    }

    const drive = driveRes.rows[0];

    // If student, calculate eligibility
    if (req.user && req.user.role === 'user' && req.user.studentId) {
      const studentRes = await query('SELECT * FROM student_profiles WHERE student_id = $1', [
        req.user.studentId,
      ]);
      const student = studentRes.rows[0];
      const eligibility = checkEligibility(student, drive);
      const appRes = await query(
        'SELECT * FROM applications WHERE drive_id = $1 AND student_id = $2',
        [driveId, req.user.studentId]
      );
      const userApp = appRes.rows[0];

      return res.status(200).json({
        success: true,
        drive: {
          ...drive,
          is_eligible: eligibility.isEligible,
          failed_reasons: eligibility.failedReasons,
          has_applied: !!userApp,
          application: userApp || null,
        },
      });
    }

    // If organization, include applicants list
    if (req.user && req.user.role === 'organization') {
      const applicantsRes = await query(
        `SELECT 
          app.application_id,
          app.drive_id,
          app.student_id,
          app.current_round,
          app.status,
          app.ats_score,
          app.applied_at,
          app.updated_at,
          u.name as student_name,
          u.email as student_email,
          sp.roll_no,
          sp.branch,
          sp.section,
          sp.batch_year,
          sp.cgpa,
          sp.active_backlogs,
          sp.resume_url,
          sp.github_url,
          sp.linkedin_url,
          ts.aptitude_score,
          ts.dsa_score
         FROM applications app
         JOIN student_profiles sp ON app.student_id = sp.student_id
         JOIN users u ON sp.user_id = u.user_id
         LEFT JOIN training_scores ts ON sp.student_id = ts.student_id
         WHERE app.drive_id = $1
         ORDER BY app.applied_at DESC`,
        [driveId]
      );

      return res.status(200).json({
        success: true,
        drive,
        applicants: applicantsRes.rows,
      });
    }

    return res.status(200).json({ success: true, drive });
  } catch (err) {
    console.error('getDriveById error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving drive details' });
  }
}

export async function createDrive(req, res) {
  try {
    const {
      company_id,
      job_role,
      ctc_lpa,
      location,
      min_cgpa = 0.0,
      max_backlogs = 0,
      eligible_branches = ['CSE', 'AIML', 'IT', 'ECE'],
      registration_deadline,
      drive_date,
      status = 'Open',
      selection_rounds = ['Online Assessment', 'Technical Interview', 'HR Round'],
      role_overview = '',
      responsibilities = '',
      must_have_skills = [],
      good_to_have_skills = [],
      bond_details = 'No service bond required.',
      perks_and_benefits = 'Health insurance, PF, relocation assistance.',
      ctc_breakdown = '',
      hiring_tier = 'Tier-1',
    } = req.body;

    if (!company_id || !job_role || !ctc_lpa || !location || !registration_deadline || !drive_date) {
      return res.status(400).json({
        success: false,
        message: 'Company, job role, CTC, location, registration deadline, and drive date are required',
      });
    }

    const branchesStr = typeof eligible_branches === 'string' ? eligible_branches : JSON.stringify(eligible_branches);
    const roundsStr = typeof selection_rounds === 'string' ? selection_rounds : JSON.stringify(selection_rounds);
    const mustHaveStr = typeof must_have_skills === 'string' ? must_have_skills : JSON.stringify(must_have_skills);
    const goodHaveStr = typeof good_to_have_skills === 'string' ? good_to_have_skills : JSON.stringify(good_to_have_skills);

    await query(
      `INSERT INTO placement_drives
       (company_id, created_by, job_role, ctc_lpa, location, min_cgpa, max_backlogs, eligible_branches, registration_deadline, drive_date, status, selection_rounds, role_overview, responsibilities, must_have_skills, good_to_have_skills, bond_details, perks_and_benefits, ctc_breakdown, hiring_tier)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        company_id,
        req.user.userId,
        job_role.trim(),
        parseFloat(ctc_lpa),
        location.trim(),
        parseFloat(min_cgpa),
        parseInt(max_backlogs, 10),
        branchesStr,
        registration_deadline,
        drive_date,
        status,
        roundsStr,
        role_overview,
        responsibilities,
        mustHaveStr,
        goodHaveStr,
        bond_details,
        perks_and_benefits,
        ctc_breakdown,
        hiring_tier,
      ]
    );

    const createdRes = await query(
      'SELECT * FROM placement_drives WHERE company_id = $1 AND job_role = $2 ORDER BY drive_id DESC LIMIT 1',
      [company_id, job_role.trim()]
    );

    return res.status(201).json({
      success: true,
      message: 'Placement drive created successfully',
      drive: createdRes.rows[0],
    });
  } catch (err) {
    console.error('createDrive error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating placement drive' });
  }
}

export async function updateDrive(req, res) {
  try {
    const driveId = req.params.id;
    const {
      company_id,
      job_role,
      ctc_lpa,
      location,
      min_cgpa,
      max_backlogs,
      eligible_branches,
      registration_deadline,
      drive_date,
      status,
      selection_rounds,
      role_overview,
      responsibilities,
      must_have_skills,
      good_to_have_skills,
      bond_details,
      perks_and_benefits,
      ctc_breakdown,
      hiring_tier,
    } = req.body;

    const existing = await query('SELECT * FROM placement_drives WHERE drive_id = $1', [driveId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Placement drive not found' });
    }

    const branchesStr =
      eligible_branches !== undefined
        ? typeof eligible_branches === 'string'
          ? eligible_branches
          : JSON.stringify(eligible_branches)
        : null;

    const roundsStr =
      selection_rounds !== undefined
        ? typeof selection_rounds === 'string'
          ? selection_rounds
          : JSON.stringify(selection_rounds)
        : null;

    const mustHaveStr =
      must_have_skills !== undefined
        ? typeof must_have_skills === 'string'
          ? must_have_skills
          : JSON.stringify(must_have_skills)
        : null;

    const goodHaveStr =
      good_to_have_skills !== undefined
        ? typeof good_to_have_skills === 'string'
          ? good_to_have_skills
          : JSON.stringify(good_to_have_skills)
        : null;

    await query(
      `UPDATE placement_drives SET
        company_id = COALESCE($1, company_id),
        job_role = COALESCE($2, job_role),
        ctc_lpa = COALESCE($3, ctc_lpa),
        location = COALESCE($4, location),
        min_cgpa = COALESCE($5, min_cgpa),
        max_backlogs = COALESCE($6, max_backlogs),
        eligible_branches = COALESCE($7, eligible_branches),
        registration_deadline = COALESCE($8, registration_deadline),
        drive_date = COALESCE($9, drive_date),
        status = COALESCE($10, status),
        selection_rounds = COALESCE($11, selection_rounds),
        role_overview = COALESCE($12, role_overview),
        responsibilities = COALESCE($13, responsibilities),
        must_have_skills = COALESCE($14, must_have_skills),
        good_to_have_skills = COALESCE($15, good_to_have_skills),
        bond_details = COALESCE($16, bond_details),
        perks_and_benefits = COALESCE($17, perks_and_benefits),
        ctc_breakdown = COALESCE($18, ctc_breakdown),
        hiring_tier = COALESCE($19, hiring_tier)
       WHERE drive_id = $20`,
      [
        company_id,
        job_role,
        ctc_lpa !== undefined ? parseFloat(ctc_lpa) : null,
        location,
        min_cgpa !== undefined ? parseFloat(min_cgpa) : null,
        max_backlogs !== undefined ? parseInt(max_backlogs, 10) : null,
        branchesStr,
        registration_deadline,
        drive_date,
        status,
        roundsStr,
        role_overview,
        responsibilities,
        mustHaveStr,
        goodHaveStr,
        bond_details,
        perks_and_benefits,
        ctc_breakdown,
        hiring_tier,
        driveId,
      ]
    );

    const updated = await query('SELECT * FROM placement_drives WHERE drive_id = $1', [driveId]);
    return res.status(200).json({
      success: true,
      message: 'Placement drive updated successfully',
      drive: updated.rows[0],
    });
  } catch (err) {
    console.error('updateDrive error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating placement drive' });
  }
}

export async function deleteDrive(req, res) {
  try {
    const driveId = req.params.id;
    const existing = await query('SELECT * FROM placement_drives WHERE drive_id = $1', [driveId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Placement drive not found' });
    }

    await query('DELETE FROM placement_drives WHERE drive_id = $1', [driveId]);
    return res.status(200).json({
      success: true,
      message: 'Placement drive deleted successfully',
    });
  } catch (err) {
    console.error('deleteDrive error:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting placement drive' });
  }
}

export async function applyDrive(req, res) {
  try {
    const driveId = req.params.id;
    const studentId = req.user.studentId;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'No student profile associated with this account. Please set up your student profile first.',
      });
    }

    // Check drive existence
    const driveRes = await query('SELECT * FROM placement_drives WHERE drive_id = $1', [driveId]);
    if (driveRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Placement drive not found' });
    }
    const drive = driveRes.rows[0];

    // Check student profile
    const studentRes = await query('SELECT * FROM student_profiles WHERE student_id = $1', [studentId]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }
    const student = studentRes.rows[0];

    // Check for duplicate application
    const dupCheck = await query(
      'SELECT application_id FROM applications WHERE drive_id = $1 AND student_id = $2',
      [driveId, studentId]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already applied for this placement drive',
      });
    }

    // SERVER-SIDE ELIGIBILITY CHECK
    const eligibility = checkEligibility(student, drive);
    if (!eligibility.isEligible) {
      return res.status(403).json({
        success: false,
        message: `Eligibility check failed: ${eligibility.failedReasons.join(' ')}`,
        reasons: eligibility.failedReasons,
      });
    }

    // Auto-calculate ATS score against Drive's JD if student has resume text
    let atsScore = null;
    if (student.resume_text && student.resume_text.trim().length > 30) {
      try {
        const fullJd = `
Role: ${drive.job_role}
Overview: ${drive.role_overview || ''}
Responsibilities: ${drive.responsibilities || ''}
Must Have Skills: ${drive.must_have_skills || ''}
Good To Have Skills: ${drive.good_to_have_skills || ''}
        `.trim();
        const atsResult = await checkAtsScore(student.resume_text, fullJd);
        atsScore = atsResult.match_score;
      } catch (e) {
        console.error('Error auto-scoring ATS on apply:', e);
      }
    }

    // Create application
    await query(
      `INSERT INTO applications (drive_id, student_id, current_round, status, ats_score)
       VALUES ($1, $2, 'Applied', 'In Review', $3)`,
      [driveId, studentId, atsScore]
    );

    const appRes = await query(
      'SELECT * FROM applications WHERE drive_id = $1 AND student_id = $2',
      [driveId, studentId]
    );

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully! Your verified profile and resume were forwarded to the company.',
      application: appRes.rows[0],
    });
  } catch (err) {
    console.error('applyDrive error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing drive application' });
  }
}

export async function parseJd(req, res) {
  try {
    const { jd_text } = req.body;
    if (!jd_text || jd_text.trim().length < 20) {
      return res.status(400).json({ success: false, message: 'Please provide job description text to parse' });
    }
    const extracted = autoExtractJdFields(jd_text);
    return res.status(200).json({ success: true, extracted });
  } catch (err) {
    console.error('parseJd error:', err);
    return res.status(500).json({ success: false, message: 'Server error parsing JD text' });
  }
}

export async function exportDriveApplicants(req, res) {
  try {
    const driveId = req.params.id;
    const { filter = 'all' } = req.query; // all, shortlisted, selected

    let sql = `
      SELECT 
        sp.roll_no as "Roll Number",
        u.name as "Student Name",
        u.email as "Email",
        sp.branch as "Branch",
        sp.section as "Section",
        sp.batch_year as "Batch",
        sp.cgpa as "CGPA",
        sp.active_backlogs as "Active Backlogs",
        app.current_round as "Current Round",
        app.status as "Status",
        sp.resume_url as "Resume Link",
        app.applied_at as "Applied Date"
      FROM applications app
      JOIN student_profiles sp ON app.student_id = sp.student_id
      JOIN users u ON sp.user_id = u.user_id
      WHERE app.drive_id = $1
    `;

    if (filter === 'shortlisted') {
      sql += ` AND (app.status IN ('Shortlisted', 'In Progress') OR app.current_round != 'Applied')`;
    } else if (filter === 'selected') {
      sql += ` AND app.status = 'Selected'`;
    }

    sql += ` ORDER BY sp.cgpa DESC, u.name ASC`;

    const result = await query(sql, [driveId]);
    const rows = result.rows;

    if (rows.length === 0) {
      return res.status(200).send('No applicants found matching criteria');
    }

    // Convert to CSV
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];

    for (const r of rows) {
      const values = headers.map((h) => {
        const val = r[h] !== null && r[h] !== undefined ? String(r[h]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvLines.push(values.join(','));
    }

    const csvContent = csvLines.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="drive_${driveId}_applicants_${filter}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('exportDriveApplicants error:', err);
    return res.status(500).json({ success: false, message: 'Server error exporting applicants' });
  }
}

export default {
  getDrives,
  getDriveById,
  createDrive,
  updateDrive,
  deleteDrive,
  applyDrive,
  exportDriveApplicants,
  parseJd,
};
