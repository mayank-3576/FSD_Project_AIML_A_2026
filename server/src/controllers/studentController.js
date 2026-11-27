import { query } from '../db/db.js';

export async function getStudents(req, res) {
  try {
    const { branch, section, batch_year, min_cgpa, placement_status, q } = req.query;

    let sql = `
      SELECT 
        sp.student_id,
        sp.user_id,
        u.name,
        u.email,
        sp.roll_no,
        sp.branch,
        sp.section,
        sp.batch_year,
        sp.tenth_pct,
        sp.twelfth_pct,
        sp.cgpa,
        sp.active_backlogs,
        sp.github_url,
        sp.linkedin_url,
        sp.resume_url,
        ts.aptitude_score,
        ts.dsa_score,
        ts.mock_interview_remarks,
        COUNT(CASE WHEN app.status = 'Selected' THEN 1 END) as offers_count,
        COUNT(app.application_id) as total_applications
      FROM student_profiles sp
      JOIN users u ON sp.user_id = u.user_id
      LEFT JOIN training_scores ts ON sp.student_id = ts.student_id
      LEFT JOIN applications app ON sp.student_id = app.student_id
      WHERE 1=1
    `;

    const params = [];
    let paramIdx = 1;

    if (branch && branch !== 'All') {
      sql += ` AND sp.branch LIKE $${paramIdx++}`;
      params.push(`%${branch}%`);
    }

    if (section && section !== 'All') {
      sql += ` AND sp.section = $${paramIdx++}`;
      params.push(section);
    }

    if (batch_year && batch_year !== 'All') {
      sql += ` AND sp.batch_year = $${paramIdx++}`;
      params.push(batch_year);
    }

    if (min_cgpa) {
      sql += ` AND sp.cgpa >= $${paramIdx++}`;
      params.push(parseFloat(min_cgpa));
    }

    if (q) {
      sql += ` AND (u.name LIKE $${paramIdx} OR sp.roll_no LIKE $${paramIdx} OR u.email LIKE $${paramIdx})`;
      params.push(`%${q}%`);
      paramIdx++;
    }

    sql += `
      GROUP BY sp.student_id, sp.user_id, u.name, u.email, sp.roll_no, sp.branch, sp.section, sp.batch_year,
               sp.tenth_pct, sp.twelfth_pct, sp.cgpa, sp.active_backlogs, sp.github_url, sp.linkedin_url,
               sp.resume_url, ts.aptitude_score, ts.dsa_score, ts.mock_interview_remarks
    `;

    if (placement_status === 'Placed') {
      sql += ` HAVING COUNT(CASE WHEN app.status = 'Selected' THEN 1 END) > 0`;
    } else if (placement_status === 'Unplaced') {
      sql += ` HAVING COUNT(CASE WHEN app.status = 'Selected' THEN 1 END) = 0`;
    }

    sql += ` ORDER BY sp.cgpa DESC, u.name ASC`;

    const result = await query(sql, params);

    const students = result.rows.map((row) => ({
      ...row,
      is_placed: parseInt(row.offers_count || 0, 10) > 0,
      placement_status: parseInt(row.offers_count || 0, 10) > 0 ? 'Placed' : 'Unplaced',
    }));

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (err) {
    console.error('getStudents error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving students' });
  }
}

export async function getStudentById(req, res) {
  try {
    const studentId = req.params.id;
    const result = await query(
      `SELECT sp.*, u.name, u.email, ts.aptitude_score, ts.dsa_score, ts.mock_interview_remarks
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.user_id
       LEFT JOIN training_scores ts ON sp.student_id = ts.student_id
       WHERE sp.student_id = $1`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    return res.status(200).json({
      success: true,
      student: result.rows[0],
    });
  } catch (err) {
    console.error('getStudentById error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving student' });
  }
}

export async function updateStudent(req, res) {
  try {
    const studentId = req.params.id;
    const {
      name,
      roll_no,
      branch,
      section,
      batch_year,
      tenth_pct,
      twelfth_pct,
      cgpa,
      active_backlogs,
      github_url,
      linkedin_url,
      resume_url,
    } = req.body;

    // Verify ownership or org role
    const currentStud = await query('SELECT * FROM student_profiles WHERE student_id = $1', [studentId]);
    if (currentStud.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const studentRecord = currentStud.rows[0];
    if (req.user.role !== 'organization' && req.user.userId !== studentRecord.user_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this profile' });
    }

    // Update user name if provided
    if (name) {
      await query('UPDATE users SET name = $1 WHERE user_id = $2', [name.trim(), studentRecord.user_id]);
    }

    // Update student profile
    await query(
      `UPDATE student_profiles SET
        roll_no = COALESCE($1, roll_no),
        branch = COALESCE($2, branch),
        section = COALESCE($3, section),
        batch_year = COALESCE($4, batch_year),
        tenth_pct = COALESCE($5, tenth_pct),
        twelfth_pct = COALESCE($6, twelfth_pct),
        cgpa = COALESCE($7, cgpa),
        active_backlogs = COALESCE($8, active_backlogs),
        github_url = COALESCE($9, github_url),
        linkedin_url = COALESCE($10, linkedin_url),
        resume_url = COALESCE($11, resume_url),
        updated_at = CURRENT_TIMESTAMP
       WHERE student_id = $12`,
      [
        roll_no,
        branch,
        section,
        batch_year,
        tenth_pct !== undefined ? parseFloat(tenth_pct) : null,
        twelfth_pct !== undefined ? parseFloat(twelfth_pct) : null,
        cgpa !== undefined ? parseFloat(cgpa) : null,
        active_backlogs !== undefined ? parseInt(active_backlogs, 10) : null,
        github_url,
        linkedin_url,
        resume_url,
        studentId,
      ]
    );

    const updatedRes = await query(
      `SELECT sp.*, u.name, u.email, ts.aptitude_score, ts.dsa_score, ts.mock_interview_remarks
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.user_id
       LEFT JOIN training_scores ts ON sp.student_id = ts.student_id
       WHERE sp.student_id = $1`,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      message: 'Student profile updated successfully',
      student: updatedRes.rows[0],
    });
  } catch (err) {
    console.error('updateStudent error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating student' });
  }
}

export default {
  getStudents,
  getStudentById,
  updateStudent,
};
