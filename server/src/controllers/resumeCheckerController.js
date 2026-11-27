import { query } from '../db/index.js';
import { auditResume } from '../services/aiEngine.js';
import { extractDocumentText } from '../services/docExtractor.js';

export async function analyzeResume(req, res) {
  try {
    let resumeText = req.body.resume_text || '';

    // If file was uploaded via multer memory storage
    if (req.file) {
      const extracted = await extractDocumentText(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      resumeText = extracted.text;
    }

    // If still empty and user is logged in as student, try loading their saved resume_text
    if (!resumeText.trim() && req.user && req.user.studentId) {
      const studentRes = await query(
        'SELECT resume_text FROM student_profiles WHERE student_id = $1',
        [req.user.studentId]
      );
      if (studentRes.rows.length > 0 && studentRes.rows[0].resume_text) {
        resumeText = studentRes.rows[0].resume_text;
      }
    }

    if (!resumeText || resumeText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resume text or upload a valid PDF, DOCX, or TXT file',
      });
    }

    // Run audit using hybrid / deterministic local NLP engine
    const auditResult = await auditResume(resumeText);

    const studentId = req.user?.studentId || null;

    // Save audit to database
    await query(
      `INSERT INTO resume_audits
       (student_id, overall_score, grade_badge, section_scores, formatting_checks, impact_analysis, bullet_rewrites, extracted_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        studentId,
        auditResult.overall_score,
        auditResult.grade_badge,
        JSON.stringify(auditResult.section_scores),
        JSON.stringify(auditResult.formatting_checks),
        JSON.stringify(auditResult.impact_analysis),
        JSON.stringify(auditResult.bullet_rewrites),
        resumeText.substring(0, 5000), // store preview/text
      ]
    );

    const savedRes = await query(
      `SELECT * FROM resume_audits 
       ${studentId ? 'WHERE student_id = $1' : ''} 
       ORDER BY audit_id DESC LIMIT 1`,
      studentId ? [studentId] : []
    );

    const saved = savedRes.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Resume audit completed successfully',
      audit: {
        audit_id: saved.audit_id,
        overall_score: parseFloat(saved.overall_score),
        grade_badge: saved.grade_badge,
        section_scores: JSON.parse(saved.section_scores),
        formatting_checks: JSON.parse(saved.formatting_checks),
        impact_analysis: JSON.parse(saved.impact_analysis),
        bullet_rewrites: JSON.parse(saved.bullet_rewrites || '[]'),
        extracted_text: saved.extracted_text,
        created_at: saved.created_at,
      },
    });
  } catch (err) {
    console.error('analyzeResume error:', err);
    return res.status(500).json({
      success: false,
      message: `Failed to analyze resume: ${err.message}`,
    });
  }
}

export async function getAuditHistory(req, res) {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      return res.status(200).json({ success: true, history: [] });
    }

    const result = await query(
      `SELECT audit_id, overall_score, grade_badge, section_scores, formatting_checks, impact_analysis, bullet_rewrites, created_at 
       FROM resume_audits 
       WHERE student_id = $1 
       ORDER BY created_at DESC LIMIT 15`,
      [studentId]
    );

    const history = result.rows.map((row) => ({
      audit_id: row.audit_id,
      overall_score: parseFloat(row.overall_score),
      grade_badge: row.grade_badge,
      section_scores: typeof row.section_scores === 'string' ? JSON.parse(row.section_scores) : row.section_scores,
      formatting_checks: typeof row.formatting_checks === 'string' ? JSON.parse(row.formatting_checks) : row.formatting_checks,
      impact_analysis: typeof row.impact_analysis === 'string' ? JSON.parse(row.impact_analysis) : row.impact_analysis,
      bullet_rewrites: typeof row.bullet_rewrites === 'string' ? JSON.parse(row.bullet_rewrites || '[]') : row.bullet_rewrites,
      created_at: row.created_at,
    }));

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (err) {
    console.error('getAuditHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving audit history' });
  }
}

export default {
  analyzeResume,
  getAuditHistory,
};
