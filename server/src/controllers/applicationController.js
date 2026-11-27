import { query } from '../db/db.js';

export async function getApplications(req, res) {
  try {
    const { drive_id, student_id, status } = req.query;

    let sql = `
      SELECT 
        app.*,
        pd.job_role,
        pd.ctc_lpa,
        pd.location as job_location,
        pd.status as drive_status,
        pd.drive_date,
        c.company_name,
        c.hiring_tier,
        c.industry_sector,
        sp.roll_no,
        sp.branch,
        sp.section,
        sp.cgpa,
        sp.active_backlogs,
        sp.resume_url,
        u.name as student_name,
        u.email as student_email
      FROM applications app
      JOIN placement_drives pd ON app.drive_id = pd.drive_id
      JOIN companies c ON pd.company_id = c.company_id
      JOIN student_profiles sp ON app.student_id = sp.student_id
      JOIN users u ON sp.user_id = u.user_id
      WHERE 1=1
    `;

    const params = [];
    let paramIdx = 1;

    // Student restriction
    if (req.user.role === 'user') {
      if (!req.user.studentId) {
        return res.status(200).json({ success: true, count: 0, applications: [] });
      }
      sql += ` AND app.student_id = $${paramIdx++}`;
      params.push(req.user.studentId);
    } else {
      // Organization filters
      if (drive_id) {
        sql += ` AND app.drive_id = $${paramIdx++}`;
        params.push(drive_id);
      }
      if (student_id) {
        sql += ` AND app.student_id = $${paramIdx++}`;
        params.push(student_id);
      }
    }

    if (status && status !== 'All') {
      sql += ` AND app.status = $${paramIdx++}`;
      params.push(status);
    }

    sql += ` ORDER BY app.updated_at DESC`;

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      applications: result.rows,
    });
  } catch (err) {
    console.error('getApplications error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving applications' });
  }
}

export async function updateApplicationStatus(req, res) {
  try {
    const applicationId = req.params.id;
    const { current_round, status } = req.body;

    if (!current_round && !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either current_round or status to update',
      });
    }

    const existing = await query('SELECT * FROM applications WHERE application_id = $1', [applicationId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    await query(
      `UPDATE applications SET
        current_round = COALESCE($1, current_round),
        status = COALESCE($2, status),
        updated_at = CURRENT_TIMESTAMP
       WHERE application_id = $3`,
      [current_round, status, applicationId]
    );

    const updatedRes = await query(
      `SELECT app.*, pd.job_role, c.company_name, sp.roll_no, u.name as student_name
       FROM applications app
       JOIN placement_drives pd ON app.drive_id = pd.drive_id
       JOIN companies c ON pd.company_id = c.company_id
       JOIN student_profiles sp ON app.student_id = sp.student_id
       JOIN users u ON sp.user_id = u.user_id
       WHERE app.application_id = $1`,
      [applicationId]
    );

    return res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      application: updatedRes.rows[0],
    });
  } catch (err) {
    console.error('updateApplicationStatus error:', err);
    return res.status(500).json({ success: false, message: 'Server error updating application' });
  }
}

export default {
  getApplications,
  updateApplicationStatus,
};
