import { query } from '../db/db.js';

export async function uploadResume(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file was rejected. Please upload a valid PDF (max 5MB).',
      });
    }

    const fileUrl = `/uploads/resumes/${req.file.filename}`;

    // If user is a student, update their student profile with the new resume URL
    if (req.user && req.user.studentId) {
      await query('UPDATE student_profiles SET resume_url = $1 WHERE student_id = $2', [
        fileUrl,
        req.user.studentId,
      ]);
    }

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        url: fileUrl,
      },
    });
  } catch (err) {
    console.error('uploadResume error:', err);
    return res.status(500).json({ success: false, message: 'Server error processing file upload' });
  }
}

export default {
  uploadResume,
};
