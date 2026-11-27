import { query } from '../db/db.js';

export async function getAssessments(req, res) {
  try {
    const { student_id } = req.query;

    let sql = `
      SELECT 
        ts.*,
        sp.roll_no,
        sp.branch,
        sp.section,
        sp.cgpa,
        u.name as student_name,
        u.email as student_email,
        eval.name as evaluator_name
      FROM training_scores ts
      JOIN student_profiles sp ON ts.student_id = sp.student_id
      JOIN users u ON sp.user_id = u.user_id
      LEFT JOIN users eval ON ts.evaluated_by = eval.user_id
      WHERE 1=1
    `;

    const params = [];
    if (student_id) {
      sql += ' AND ts.student_id = $1';
      params.push(student_id);
    } else if (req.user.role === 'user') {
      sql += ' AND ts.student_id = $1';
      params.push(req.user.studentId);
    }

    sql += ' ORDER BY sp.cgpa DESC';

    const result = await query(sql, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      assessments: result.rows,
    });
  } catch (err) {
    console.error('getAssessments error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving training assessments' });
  }
}

export async function saveAssessment(req, res) {
  try {
    const { student_id, aptitude_score, dsa_score, mock_interview_remarks } = req.body;

    if (!student_id) {
      return res.status(400).json({ success: false, message: 'Student ID is required' });
    }

    const existing = await query('SELECT score_id FROM training_scores WHERE student_id = $1', [student_id]);

    if (existing.rows.length > 0) {
      await query(
        `UPDATE training_scores SET
          evaluated_by = $1,
          aptitude_score = COALESCE($2, aptitude_score),
          dsa_score = COALESCE($3, dsa_score),
          mock_interview_remarks = COALESCE($4, mock_interview_remarks),
          updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $5`,
        [
          req.user.userId,
          aptitude_score !== undefined ? parseFloat(aptitude_score) : null,
          dsa_score !== undefined ? parseFloat(dsa_score) : null,
          mock_interview_remarks,
          student_id,
        ]
      );
    } else {
      await query(
        `INSERT INTO training_scores 
         (student_id, evaluated_by, aptitude_score, dsa_score, mock_interview_remarks)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          student_id,
          req.user.userId,
          parseFloat(aptitude_score || 0),
          parseFloat(dsa_score || 0),
          mock_interview_remarks || '',
        ]
      );
    }

    const updated = await query(
      `SELECT ts.*, sp.roll_no, u.name as student_name
       FROM training_scores ts
       JOIN student_profiles sp ON ts.student_id = sp.student_id
       JOIN users u ON sp.user_id = u.user_id
       WHERE ts.student_id = $1`,
      [student_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Training scores and interview feedback saved successfully',
      assessment: updated.rows[0],
    });
  } catch (err) {
    console.error('saveAssessment error:', err);
    return res.status(500).json({ success: false, message: 'Server error saving assessment' });
  }
}

export default {
  getAssessments,
  saveAssessment,
};
