import bcrypt from 'bcryptjs';
import { query } from '../db/db.js';
import { generateToken } from '../middleware/auth.js';

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const userRes = await query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    let studentProfile = null;
    if (user.role === 'user') {
      const studRes = await query(
        `SELECT sp.*, ts.aptitude_score, ts.dsa_score, ts.mock_interview_remarks
         FROM student_profiles sp
         LEFT JOIN training_scores ts ON sp.student_id = ts.student_id
         WHERE sp.user_id = $1`,
        [user.user_id]
      );
      if (studRes.rows.length > 0) {
        studentProfile = studRes.rows[0];
      }
    }

    const tokenPayload = {
      userId: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: studentProfile ? studentProfile.student_id : null,
    };

    const token = generateToken(tokenPayload);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentProfile,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
}

export async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      role = 'user',
      roll_no,
      branch = 'CSE (AI & ML)',
      section = 'A',
      batch_year = '2024–2028',
      cgpa = 0.0,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await query('SELECT user_id FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userInsert = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)`,
      [name.trim(), cleanEmail, passwordHash, role === 'organization' ? 'organization' : 'user']
    );

    const userRes = await query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    const user = userRes.rows[0];

    let studentProfile = null;
    if (user.role === 'user') {
      const generatedRoll = roll_no ? roll_no.trim() : `240032${Math.floor(1000000 + Math.random() * 9000000)}`;
      await query(
        `INSERT INTO student_profiles (user_id, roll_no, branch, section, batch_year, cgpa)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [user.user_id, generatedRoll, branch, section, batch_year, parseFloat(cgpa) || 0.0]
      );
      const studRes = await query('SELECT * FROM student_profiles WHERE user_id = $1', [user.user_id]);
      studentProfile = studRes.rows[0];

      // Initialize empty training scores
      await query(
        `INSERT INTO training_scores (student_id, aptitude_score, dsa_score, mock_interview_remarks)
         VALUES ($1, 0, 0, 'Orientation pending')`,
        [studentProfile.student_id]
      );
    }

    const token = generateToken({
      userId: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      studentId: studentProfile ? studentProfile.student_id : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        userId: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentProfile,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { action = 'request', email, otp, newPassword } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const userRes = await query('SELECT user_id, name FROM users WHERE email = $1', [cleanEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No registered account found with this email' });
    }

    if (action === 'request') {
      // Generate 6-digit OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      await query('DELETE FROM password_resets WHERE email = $1', [cleanEmail]);
      await query('INSERT INTO password_resets (email, otp, expires_at) VALUES ($1, $2, $3)', [
        cleanEmail,
        generatedOtp,
        expiresAt,
      ]);

      // Returns OTP in development mode so user can test locally without SMTP
      return res.status(200).json({
        success: true,
        message: 'Verification OTP generated. Please enter it below to set your new password.',
        devOtp: generatedOtp, // Exposed for immediate offline evaluation
      });
    }

    if (action === 'verify-and-reset') {
      if (!otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'OTP and new password are required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      }

      const resetRes = await query(
        'SELECT * FROM password_resets WHERE email = $1 AND otp = $2 ORDER BY created_at DESC LIMIT 1',
        [cleanEmail, otp.trim()]
      );

      if (resetRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      const resetRow = resetRes.rows[0];
      if (new Date(resetRow.expires_at) < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(newPassword, salt);

      await query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, cleanEmail]);
      await query('DELETE FROM password_resets WHERE email = $1', [cleanEmail]);

      return res.status(200).json({
        success: true,
        message: 'Password has been reset successfully. You can now login with your new password.',
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid action specified' });
  } catch (err) {
    console.error('Password reset error:', err);
    return res.status(500).json({ success: false, message: 'Server error during password reset' });
  }
}

export async function getProfile(req, res) {
  try {
    const userRes = await query('SELECT user_id, name, email, role, created_at FROM users WHERE user_id = $1', [
      req.user.userId,
    ]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userRes.rows[0];
    let studentProfile = null;

    if (user.role === 'user') {
      const studRes = await query(
        `SELECT sp.*, ts.aptitude_score, ts.dsa_score, ts.mock_interview_remarks
         FROM student_profiles sp
         LEFT JOIN training_scores ts ON sp.student_id = ts.student_id
         WHERE sp.user_id = $1`,
        [user.user_id]
      );
      if (studRes.rows.length > 0) {
        studentProfile = studRes.rows[0];
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        studentProfile,
      },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
}

export default {
  login,
  register,
  resetPassword,
  getProfile,
};
