import { query } from '../db/index.js';
import {
  generateInterviewQuestions,
  evaluateInterviewAnswer,
  calculateSessionSummary,
} from '../services/aiEngine.js';

export async function startInterviewSession(req, res) {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student profile required to initiate an AI interview',
      });
    }

    const {
      target_role = 'Full Stack Software Engineer',
      interview_type = 'Mixed Technical & HR',
      difficulty = 'Medium',
      question_count = 5,
      input_mode = 'Text Chat',
      drive_id = null,
    } = req.body;

    let jdText = '';
    if (drive_id) {
      const driveRes = await query(
        `SELECT pd.*, c.company_name FROM placement_drives pd JOIN companies c ON pd.company_id = c.company_id WHERE pd.drive_id = $1`,
        [drive_id]
      );
      if (driveRes.rows.length > 0) {
        const d = driveRes.rows[0];
        jdText = `${d.job_role} at ${d.company_name}: ${d.role_overview || ''} ${d.responsibilities || ''}`;
      }
    }

    // Get student profile resume context
    const studentRes = await query('SELECT resume_text FROM student_profiles WHERE student_id = $1', [
      studentId,
    ]);
    const resumeText = studentRes.rows[0]?.resume_text || '';

    // Generate questions
    const rawQuestions = await generateInterviewQuestions({
      role: target_role,
      interviewType: interview_type,
      difficulty,
      count: parseInt(question_count, 10) || 5,
      jdText,
      resumeText,
    });

    const questionsData = rawQuestions.map((q, idx) => ({
      index: idx,
      id: q.id || `q-${idx + 1}`,
      question: q.question,
      category: q.category || 'General',
      expected_topics: q.expected_topics || [],
      user_answer: '',
      code_snippet: '',
      score: null,
      evaluation: null,
      strengths: [],
      areas_for_improvement: [],
      model_answer: '',
      answered: false,
    }));

    await query(
      `INSERT INTO ai_interview_sessions 
       (student_id, drive_id, target_role, interview_type, difficulty, input_mode, overall_score, status, questions_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        studentId,
        drive_id,
        target_role,
        interview_type,
        difficulty,
        input_mode,
        0,
        'In Progress',
        JSON.stringify(questionsData),
      ]
    );

    const sessionRes = await query(
      'SELECT * FROM ai_interview_sessions WHERE student_id = $1 ORDER BY session_id DESC LIMIT 1',
      [studentId]
    );

    const session = sessionRes.rows[0];

    return res.status(201).json({
      success: true,
      message: 'AI interview session started',
      session: {
        session_id: session.session_id,
        target_role: session.target_role,
        interview_type: session.interview_type,
        difficulty: session.difficulty,
        input_mode: session.input_mode,
        status: session.status,
        total_questions: questionsData.length,
        current_question_index: 0,
        questions: questionsData,
      },
    });
  } catch (err) {
    console.error('startInterviewSession error:', err);
    return res.status(500).json({ success: false, message: 'Server error starting AI interview' });
  }
}

export async function submitQuestionAnswer(req, res) {
  try {
    const sessionId = req.params.sessionId;
    const { question_index, answer, code_snippet = '' } = req.body;

    const sessionRes = await query(
      'SELECT * FROM ai_interview_sessions WHERE session_id = $1',
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const session = sessionRes.rows[0];
    const questions = JSON.parse(session.questions_data || '[]');

    const idx = parseInt(question_index, 10);
    if (idx < 0 || idx >= questions.length) {
      return res.status(400).json({ success: false, message: 'Invalid question index' });
    }

    const currentQ = questions[idx];

    // Evaluate answer via AI engine
    const evalResult = await evaluateInterviewAnswer({
      question: currentQ.question,
      answer: answer || 'No response provided.',
      role: session.target_role,
      codeSnippet: code_snippet,
    });

    questions[idx] = {
      ...currentQ,
      user_answer: answer || '',
      code_snippet: code_snippet || '',
      score: evalResult.score,
      evaluation: evalResult.feedback,
      strengths: evalResult.strengths || [],
      areas_for_improvement: evalResult.areas_for_improvement || [],
      model_answer: evalResult.model_answer || '',
      answered: true,
    };

    await query(
      'UPDATE ai_interview_sessions SET questions_data = $1 WHERE session_id = $2',
      [JSON.stringify(questions), sessionId]
    );

    return res.status(200).json({
      success: true,
      message: 'Answer evaluated successfully',
      evaluation: {
        question_index: idx,
        score: evalResult.score,
        feedback: evalResult.feedback,
        strengths: evalResult.strengths,
        areas_for_improvement: evalResult.areas_for_improvement,
        model_answer: evalResult.model_answer,
      },
      next_question_index: idx + 1 < questions.length ? idx + 1 : null,
      is_completed: idx + 1 >= questions.length,
    });
  } catch (err) {
    console.error('submitQuestionAnswer error:', err);
    return res.status(500).json({ success: false, message: 'Server error evaluating answer' });
  }
}

export async function finishInterviewSession(req, res) {
  try {
    const sessionId = req.params.sessionId;
    const { duration_seconds = 300 } = req.body;

    const sessionRes = await query(
      'SELECT * FROM ai_interview_sessions WHERE session_id = $1',
      [sessionId]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const session = sessionRes.rows[0];
    const questions = JSON.parse(session.questions_data || '[]');

    const summary = calculateSessionSummary(questions);

    await query(
      `UPDATE ai_interview_sessions 
       SET overall_score = $1, 
           axis_scores = $2, 
           status = 'Completed', 
           duration_seconds = $3, 
           completed_at = CURRENT_TIMESTAMP 
       WHERE session_id = $4`,
      [
        summary.overall_score,
        JSON.stringify(summary.axis_scores),
        parseInt(duration_seconds, 10) || 0,
        sessionId,
      ]
    );

    // Update student's training_scores table with avg AI interview score
    const avgScoreRes = await query(
      `SELECT AVG(overall_score) as avg_score 
       FROM ai_interview_sessions 
       WHERE student_id = $1 AND status = 'Completed'`,
      [session.student_id]
    );

    const avgAiScore = parseFloat(avgScoreRes.rows[0]?.avg_score || summary.overall_score);

    await query(
      `UPDATE training_scores 
       SET ai_interview_avg_score = $1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE student_id = $2`,
      [avgAiScore.toFixed(1), session.student_id]
    );

    const updatedSessionRes = await query(
      'SELECT * FROM ai_interview_sessions WHERE session_id = $1',
      [sessionId]
    );

    const updated = updatedSessionRes.rows[0];

    return res.status(200).json({
      success: true,
      message: 'Interview completed and evaluated',
      session: {
        session_id: updated.session_id,
        target_role: updated.target_role,
        interview_type: updated.interview_type,
        difficulty: updated.difficulty,
        overall_score: parseFloat(updated.overall_score),
        axis_scores: JSON.parse(updated.axis_scores || '{}'),
        status: updated.status,
        duration_seconds: updated.duration_seconds,
        questions: JSON.parse(updated.questions_data || '[]'),
        created_at: updated.created_at,
        completed_at: updated.completed_at,
      },
    });
  } catch (err) {
    console.error('finishInterviewSession error:', err);
    return res.status(500).json({ success: false, message: 'Server error finishing interview' });
  }
}

export async function getInterviewHistory(req, res) {
  try {
    const studentId = req.user?.studentId;
    if (!studentId) {
      return res.status(200).json({ success: true, history: [] });
    }

    const result = await query(
      `SELECT session_id, drive_id, target_role, interview_type, difficulty, input_mode, overall_score, axis_scores, status, duration_seconds, created_at, completed_at 
       FROM ai_interview_sessions 
       WHERE student_id = $1 
       ORDER BY created_at DESC LIMIT 20`,
      [studentId]
    );

    const history = result.rows.map((row) => ({
      session_id: row.session_id,
      drive_id: row.drive_id,
      target_role: row.target_role,
      interview_type: row.interview_type,
      difficulty: row.difficulty,
      input_mode: row.input_mode,
      overall_score: parseFloat(row.overall_score),
      axis_scores: typeof row.axis_scores === 'string' ? JSON.parse(row.axis_scores || '{}') : row.axis_scores,
      status: row.status,
      duration_seconds: row.duration_seconds,
      created_at: row.created_at,
      completed_at: row.completed_at,
    }));

    return res.status(200).json({ success: true, history });
  } catch (err) {
    console.error('getInterviewHistory error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving history' });
  }
}

export async function getInterviewSessionById(req, res) {
  try {
    const sessionId = req.params.sessionId;
    const sessionRes = await query('SELECT * FROM ai_interview_sessions WHERE session_id = $1', [
      sessionId,
    ]);

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const session = sessionRes.rows[0];

    return res.status(200).json({
      success: true,
      session: {
        session_id: session.session_id,
        target_role: session.target_role,
        interview_type: session.interview_type,
        difficulty: session.difficulty,
        input_mode: session.input_mode,
        overall_score: parseFloat(session.overall_score),
        axis_scores: typeof session.axis_scores === 'string' ? JSON.parse(session.axis_scores || '{}') : session.axis_scores,
        status: session.status,
        duration_seconds: session.duration_seconds,
        questions: typeof session.questions_data === 'string' ? JSON.parse(session.questions_data || '[]') : session.questions_data,
        created_at: session.created_at,
        completed_at: session.completed_at,
      },
    });
  } catch (err) {
    console.error('getInterviewSessionById error:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving session' });
  }
}

export default {
  startInterviewSession,
  submitQuestionAnswer,
  finishInterviewSession,
  getInterviewHistory,
  getInterviewSessionById,
};
