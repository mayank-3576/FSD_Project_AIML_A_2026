import { query } from '../db/index.js';
import { checkAtsScore } from '../services/aiEngine.js';
import { extractDocumentText } from '../services/docExtractor.js';

export async function scoreAts(req, res) {
  try {
    let resumeText = req.body.resume_text || '';
    let jdText = req.body.jd_text || '';
    let jobTitle = req.body.job_title || 'Target Job Role';
    let driveId = req.body.drive_id ? parseInt(req.body.drive_id, 10) : null;

    // Handle file upload if present
    if (req.file) {
      const extracted = await extractDocumentText(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      resumeText = extracted.text;
    }

    // Fallback to student profile resume text if available
    if (!resumeText.trim() && req.user && req.user.studentId) {
      const studentRes = await query(
        'SELECT resume_text FROM student_profiles WHERE student_id = $1',
        [req.user.studentId]
      );
      if (studentRes.rows.length > 0 && studentRes.rows[0].resume_text) {
        resumeText = studentRes.rows[0].resume_text;
      }
    }

    // If drive_id provided, fetch drive details to form JD text
    if (driveId && (!jdText || jdText.trim().length < 20)) {
      const driveRes = await query(
        `SELECT pd.*, c.company_name 
         FROM placement_drives pd 
         JOIN companies c ON pd.company_id = c.company_id 
         WHERE pd.drive_id = $1`,
        [driveId]
      );

      if (driveRes.rows.length > 0) {
        const drive = driveRes.rows[0];
        jobTitle = `${drive.job_role} at ${drive.company_name}`;
        
        let mustHaveStr = '';
        try {
          const m = JSON.parse(drive.must_have_skills || '[]');
          mustHaveStr = Array.isArray(m) ? m.join(', ') : m;
        } catch {
          mustHaveStr = drive.must_have_skills || '';
        }

        let goodHaveStr = '';
        try {
          const g = JSON.parse(drive.good_to_have_skills || '[]');
          goodHaveStr = Array.isArray(g) ? g.join(', ') : g;
        } catch {
          goodHaveStr = drive.good_to_have_skills || '';
        }

        jdText = `
Role: ${drive.job_role}
Company: ${drive.company_name}
Overview: ${drive.role_overview || ''}
Responsibilities: ${drive.responsibilities || ''}
Must Have Skills: ${mustHaveStr}
Good to Have Skills: ${goodHaveStr}
Location: ${drive.location}
CTC: ${drive.ctc_lpa} LPA
        `.trim();
      }
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resume text or upload your resume file',
      });
    }

    if (!jdText || jdText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide job description text or select an active placement drive',
      });
    }

    // Run ATS Score match
    const atsResult = await checkAtsScore(resumeText, jdText);

    const studentId = req.user?.studentId || null;

    // Save scan to database
    await query(
      `INSERT INTO ats_scans
       (student_id, drive_id, job_title, match_score, shortlist_probability, keyword_breakdown, matched_keywords, missing_must_have, missing_good_to_have, recommendations, resume_text, jd_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        studentId,
        driveId,
        jobTitle,
        atsResult.match_score,
        atsResult.shortlist_probability,
        JSON.stringify(atsResult.keyword_breakdown),
        JSON.stringify(atsResult.matched_keywords),
        JSON.stringify(atsResult.missing_must_have),
        JSON.stringify(atsResult.missing_good_to_have),
        JSON.stringify(atsResult.recommendations),
        resumeText.substring(0, 4000),
        jdText.substring(0, 4000),
      ]
    );

    // Update student's best ATS score if logged in
    if (studentId) {
      await query(
        `UPDATE training_scores 
         SET best_ats_score = CASE 
           WHEN best_ats_score IS NULL OR best_ats_score < $1 THEN $1 
           ELSE best_ats_score 
         END,
         updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $2`,
        [atsResult.match_score, studentId]
      );
    }

    const savedRes = await query(
      `SELECT * FROM ats_scans 
       ${studentId ? 'WHERE student_id = $1' : ''} 
       ORDER BY scan_id DESC LIMIT 1`,
      studentId ? [studentId] : []
    );

    const saved = savedRes.rows[0];

    return res.status(200).json({
      success: true,
      message: 'ATS score evaluated successfully',
      scan: {
        scan_id: saved.scan_id,
        job_title: saved.job_title,
        drive_id: saved.drive_id,
        match_score: parseFloat(saved.match_score),
        shortlist_probability: saved.shortlist_probability,
        keyword_breakdown: JSON.parse(saved.keyword_breakdown),
        matched_keywords: JSON.parse(saved.matched_keywords || '[]'),
        missing_must_have: JSON.parse(saved.missing_must_have || '[]'),
        missing_good_to_have: JSON.parse(saved.missing_good_to_have || '[]'),
        recommendations: JSON.parse(saved.recommendations || '[]'),
        created_at: saved.created_at,
      },
    });
  } catch (err) {
    console.error('scoreAts error:', err);
    return res.status(500).json({
      success: false,
      message: `Failed to calculate ATS score: ${err.message}`,
    });
  }
}

export async function getAtsHistory(req, res) {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      return res.status(200).json({ success: true, history: [] });
    }

    const result = await query(
      `SELECT scan_id, drive_id, job_title, match_score, shortlist_probability, keyword_breakdown, matched_keywords, missing_must_have, missing_good_to_have, recommendations, created_at 
       FROM ats_scans 
       WHERE student_id = $1 
       ORDER BY created_at DESC LIMIT 15`,
      [studentId]
    );

    const history = result.rows.map((row) => ({
      scan_id: row.scan_id,
      drive_id: row.drive_id,
      job_title: row.job_title,
      match_score: parseFloat(row.match_score),
      shortlist_probability: row.shortlist_probability,
      keyword_breakdown: typeof row.keyword_breakdown === 'string' ? JSON.parse(row.keyword_breakdown) : row.keyword_breakdown,
      matched_keywords: typeof row.matched_keywords === 'string' ? JSON.parse(row.matched_keywords || '[]') : row.matched_keywords,
      missing_must_have: typeof row.missing_must_have === 'string' ? JSON.parse(row.missing_must_have || '[]') : row.missing_must_have,
      missing_good_to_have: typeof row.missing_good_to_have === 'string' ? JSON.parse(row.missing_good_to_have || '[]') : row.missing_good_to_have,
      recommendations: typeof row.recommendations === 'string' ? JSON.parse(row.recommendations || '[]') : row.recommendations,
      created_at: row.created_at,
    }));

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (err) {
    console.error('getAtsHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving ATS history' });
  }
}

export default {
  scoreAts,
  getAtsHistory,
};
