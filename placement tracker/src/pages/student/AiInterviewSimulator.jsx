import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Sparkles,
  Clock,
  Code,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Send,
  Award,
  BookOpen,
  HelpCircle,
  TrendingUp,
  User,
  Briefcase,
  Layers,
  StopCircle,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export default function AiInterviewSimulator() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Mode: 'setup' | 'interview' | 'report'
  const [phase, setPhase] = useState('setup');

  // Setup options
  const [drives, setDrives] = useState([]);
  const [targetRole, setTargetRole] = useState('Full Stack Software Engineer');
  const [interviewType, setInterviewType] = useState('Mixed Technical & HR');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [inputMode, setInputMode] = useState('Voice & Text');
  const [selectedDriveId, setSelectedDriveId] = useState('');

  // Interview state
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodePad, setShowCodePad] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // Voice Interaction state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const recognitionRef = useRef(null);

  // Per-question timer
  const [timerSeconds, setTimerSeconds] = useState(180); // 3 mins per question
  const [totalElapsed, setTotalElapsed] = useState(0);
  const timerRef = useRef(null);

  // Final evaluation report data
  const [reportData, setReportData] = useState(null);

  // Initialize SpeechRecognition & fetch drives
  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (e) => {
        console.warn('SpeechRecognition error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    fetchDrives();
    fetchHistory();

    // Check query params
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    const driveParam = params.get('drive_id');
    if (roleParam) setTargetRole(roleParam);
    if (driveParam) setSelectedDriveId(driveParam);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [location.search]);

  // Timer logic during interview
  useEffect(() => {
    if (phase === 'interview') {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        setTotalElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentIndex]);

  const fetchDrives = async () => {
    try {
      const res = await api.get('/drives?status=Open');
      if (res.success && res.drives) {
        setDrives(res.drives);
      }
    } catch (e) {
      console.error('Failed to load drives:', e);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/ai-interview/history');
      if (res.success && res.history) {
        setHistory(res.history);
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  };

  // Speak question with speechSynthesis
  const speakQuestion = (text) => {
    if (!window.speechSynthesis || voiceMuted) return;
    window.speechSynthesis.cancel(); // stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  // Start interview session
  const handleStartInterview = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/ai-interview/start', {
        target_role: targetRole,
        interview_type: interviewType,
        difficulty,
        question_count: parseInt(questionCount, 10),
        input_mode: inputMode,
        drive_id: selectedDriveId || null,
      });

      if (res.success && res.session) {
        setSessionId(res.session.session_id);
        setQuestions(res.session.questions);
        setCurrentIndex(0);
        setUserAnswer('');
        setCodeSnippet('');
        setShowCodePad(false);
        setTimerSeconds(180);
        setTotalElapsed(0);
        setPhase('interview');

        // Speak the first question
        if (res.session.questions.length > 0) {
          setTimeout(() => {
            speakQuestion(res.session.questions[0].question);
          }, 600);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to start interview session');
    } finally {
      setLoading(false);
    }
  };

  // Submit answer for current question
  const handleSubmitAnswer = async () => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post(`/ai-interview/${sessionId}/answer`, {
        question_index: currentIndex,
        answer: userAnswer || 'Candidate skipped this question.',
        code_snippet: codeSnippet,
      });

      if (res.success) {
        // Update current question in local questions state
        const updatedQuestions = [...questions];
        updatedQuestions[currentIndex] = {
          ...updatedQuestions[currentIndex],
          user_answer: userAnswer,
          code_snippet: codeSnippet,
          evaluation: res.evaluation.feedback,
          score: res.evaluation.score,
          strengths: res.evaluation.strengths,
          areas_for_improvement: res.evaluation.areas_for_improvement,
          model_answer: res.evaluation.model_answer,
          answered: true,
        };
        setQuestions(updatedQuestions);

        if (res.is_completed || currentIndex + 1 >= questions.length) {
          // All questions answered -> finish session
          handleFinishInterview();
        } else {
          // Advance to next question
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          setUserAnswer('');
          setCodeSnippet('');
          setTimerSeconds(180);
          setShowHints(false);

          setTimeout(() => {
            speakQuestion(questions[nextIdx]?.question);
          }, 400);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  // Finish interview and show 5-axis RadarChart
  const handleFinishInterview = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/ai-interview/${sessionId}/finish`, {
        duration_seconds: totalElapsed,
      });

      if (res.success && res.session) {
        setReportData(res.session);
        setPhase('report');
        fetchHistory();
      }
    } catch (err) {
      setError(err.message || 'Failed to generate interview report');
    } finally {
      setLoading(false);
    }
  };

  // Format timer mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQ = questions[currentIndex];

  // Radar chart formatting
  const getRadarData = (axisScores) => {
    if (!axisScores) return [];
    return [
      { axis: 'Technical Accuracy', score: axisScores.technical_accuracy || 85, fullMark: 100 },
      { axis: 'Communication Clarity', score: axisScores.communication_clarity || 80, fullMark: 100 },
      { axis: 'Problem Solving', score: axisScores.problem_solving || 88, fullMark: 100 },
      { axis: 'STAR Structure', score: axisScores.star_structure || 78, fullMark: 100 },
      { axis: 'JD Relevance', score: axisScores.jd_relevance || 90, fullMark: 100 },
    ];
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          PHASE 1: SETUP SCREEN
         ========================================================================= */}
      {phase === 'setup' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-400/30">
                  ABES TPO Simulated Panels
                </span>
                <span className="text-xs text-slate-300">Voice & Code Enabled</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                AI Technical & HR Interview Simulator
              </h1>
              <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                Practice realistic technical and behavioral campus recruitment rounds tailored to your target company and job description. Supports speech-to-text answers, live code pad, and five-axis radar chart scoring.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Setup Form (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>Configure Your Interview Session</span>
              </h2>

              {/* Target Role & Campus Drive */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Role
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Full Stack Software Engineer, ML Engineer"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                {drives.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Link to Active Campus Drive (Optional)
                    </label>
                    <select
                      value={selectedDriveId}
                      onChange={(e) => {
                        setSelectedDriveId(e.target.value);
                        const found = drives.find((d) => String(d.drive_id) === e.target.value);
                        if (found) setTargetRole(`${found.company_name} — ${found.job_role}`);
                      }}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="">-- Practice General Role (No Specific Drive) --</option>
                      {drives.map((d) => (
                        <option key={d.drive_id} value={d.drive_id}>
                          {d.company_name} — {d.job_role} ({d.ctc_lpa} LPA)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Interview Track */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Interview Track
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'Mixed Technical & HR', desc: 'DSA, System Design, & Behavioral Questions' },
                    { id: 'Pure DSA & System Design', desc: 'Coding, Complexity, and Architecture' },
                    { id: 'Core CS Fundamentals', desc: 'DBMS, Operating Systems, & Computer Networks' },
                    { id: 'HR & Behavioral', desc: 'STAR Format, Conflict Resolution, & Fit' },
                  ].map((track) => (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => setInterviewType(track.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        interviewType === track.id
                          ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-900 block">{track.id}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{track.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty & Length Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Easy">Standard / Foundational</option>
                    <option value="Medium">Medium (ABES Tier-1 Standard)</option>
                    <option value="Hard">Challenging / FAANG Caliber</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Question Count
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="3">3 Questions (Quick Sprint ~ 10m)</option>
                    <option value="5">5 Questions (Comprehensive ~ 20m)</option>
                    <option value="7">7 Questions (In-Depth Panel ~ 30m)</option>
                  </select>
                </div>
              </div>

              {/* Input Mode: Voice & Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Interaction Mode
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setInputMode('Voice & Text')}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      inputMode === 'Voice & Text'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-blue-600" />
                    <span>Voice & Text (Recommended)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('Text Only')}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      inputMode === 'Text Only'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>Text Only</span>
                  </button>
                </div>
                {speechSupported ? (
                  <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Web Speech API is active in your browser.</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Voice transcription not detected in this browser. Fallback to text input is fully enabled.
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleStartInterview}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Tailored Interview Questions...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Begin Mock AI Interview Room</span>
                  </>
                )}
              </button>
            </div>

            {/* Right Column: Historical Sessions (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <span>Previous AI Interview Sessions ({history.length})</span>
                </h3>

                {history.length > 0 ? (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {history.map((s) => (
                      <div
                        key={s.session_id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-colors"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{s.target_role}</h4>
                            <p className="text-[10px] text-slate-500">
                              {s.interview_type} • {s.difficulty}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-blue-600">
                              {Math.round(s.overall_score)}%
                            </span>
                            <span className="text-[10px] text-slate-400 block">Overall</span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{new Date(s.created_at).toLocaleDateString()}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              s.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No completed sessions yet. Launch your first mock round on the left!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 2: LIVE INTERVIEW ROOM
         ========================================================================= */}
      {phase === 'interview' && currentQ && (
        <div className="space-y-6">
          {/* Interview Room Control Bar */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow">
                  <User className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">ABES TPO Senior AI Panelist</span>
                  {isSpeaking && (
                    <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1 animate-pulse">
                      <Volume2 className="w-3 h-3" />
                      <span>Speaking Question...</span>
                    </span>
                  )}
                  {isListening && (
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 font-semibold px-2 py-0.5 rounded-full border border-rose-400/30 flex items-center gap-1 animate-pulse">
                      <Mic className="w-3 h-3" />
                      <span>Transcribing Voice...</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Target: {targetRole} • {interviewType}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Question Countdown Timer */}
              <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300">Question Timer:</span>
                <span className="font-mono font-bold text-white">{formatTime(timerSeconds)}</span>
              </div>

              {/* Speech Controls */}
              <button
                onClick={() => {
                  setVoiceMuted(!voiceMuted);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title={voiceMuted ? 'Unmute question audio' : 'Mute question audio'}
              >
                {voiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* End Early */}
              <button
                onClick={handleFinishInterview}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                End & Evaluate
              </button>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Question <strong className="text-slate-900">{currentIndex + 1}</strong> of{' '}
              {questions.length}
            </span>
            <span>Total Elapsed: {formatTime(totalElapsed)}</span>
          </div>

          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                Category: {currentQ.category || 'Technical Evaluation'}
              </span>
              <button
                onClick={() => speakQuestion(currentQ.question)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Repeat Question</span>
              </button>
            </div>

            <h2 className="text-lg font-bold text-slate-900 leading-relaxed">
              {currentQ.question}
            </h2>

            {/* Expected Topics Toggle */}
            <div>
              <button
                onClick={() => setShowHints(!showHints)}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHints ? 'Hide Evaluation Hints' : 'View Key Concepts Expected'}</span>
              </button>
              {showHints && currentQ.expected_topics && (
                <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap gap-1.5">
                  {currentQ.expected_topics.map((top, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white text-slate-700 border border-slate-200 rounded text-[11px] font-medium"
                    >
                      {top}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Answer Workspace */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Your Response</h3>
                {isListening && (
                  <span className="flex items-center gap-1 text-[11px] text-rose-600 font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span>Listening... speak clearly</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {speechSupported && inputMode.includes('Voice') && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      isListening
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <StopCircle className="w-3.5 h-3.5" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-blue-600" />
                        <span>Voice Answer</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowCodePad(!showCodePad)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                    showCodePad
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showCodePad ? 'Hide Code Pad' : 'Add Code / Pseudocode'}</span>
                </button>
              </div>
            </div>

            {/* Answer Textarea */}
            <textarea
              rows={6}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Speak using the 'Voice Answer' button above, or type your structured response here..."
              className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
            />

            {/* Code / Pseudocode Pad */}
            {showCodePad && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Code / Algorithmic Scratchpad</span>
                  <span className="text-[10px] text-slate-400">Optional</span>
                </div>
                <textarea
                  rows={6}
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="// Paste pseudocode, SQL query, or architecture schema..."
                  className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={submitting}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Skip Question
              </button>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Evaluating Response...</span>
                  </>
                ) : (
                  <>
                    <span>Submit & Next Question</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PHASE 3: EVALUATION REPORT & RADAR CHART
         ========================================================================= */}
      {phase === 'report' && reportData && (
        <div className="space-y-6">
          {/* Report Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 border-2 border-blue-200 text-blue-700 flex flex-col items-center justify-center font-black shadow-inner">
                  <span className="text-3xl leading-none">{Math.round(reportData.overall_score)}</span>
                  <span className="text-[10px] font-bold uppercase opacity-75">/ 100</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{reportData.target_role}</h2>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        reportData.overall_score >= 80
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : reportData.overall_score >= 65
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {reportData.overall_score >= 80
                        ? 'Strong Hire Recommendation'
                        : reportData.overall_score >= 65
                        ? 'Competitive Candidate'
                        : 'Training Needed'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Completed {reportData.questions?.length || 0} questions in{' '}
                    {formatTime(reportData.duration_seconds || 0)} • Evaluated by ABES TPO AI Panel
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPhase('setup')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Practice Another Round</span>
                </button>
              </div>
            </div>

            {/* 5-Axis Spider / Radar Chart Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6 items-center">
              <div className="md:col-span-6 h-72 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={getRadarData(reportData.axis_scores)}
                  >
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: '#475569', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* 5 Axes Breakdown Cards */}
              <div className="md:col-span-6 space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  5-Axis Performance Breakdown
                </h4>
                {getRadarData(reportData.axis_scores).map((axis) => (
                  <div
                    key={axis.axis}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                  >
                    <span className="font-semibold text-slate-700">{axis.axis}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${axis.score}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 w-8 text-right">{axis.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Question-by-Question Detailed Review */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Transcript & Detailed Question Evaluations</span>
            </h3>

            <div className="space-y-4 mt-4">
              {(reportData.questions || []).map((q, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Q{idx + 1}: {q.category || 'General'}
                    </span>
                    <span className="text-xs font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                      Score: {q.score !== null ? `${q.score}/10` : 'Evaluated'}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">{q.question}</p>

                  {/* Candidate's Answer */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Your Response
                    </span>
                    <p className="text-slate-800 leading-relaxed italic">
                      "{q.user_answer || 'No spoken or written answer provided.'}"
                    </p>
                    {q.code_snippet && (
                      <pre className="mt-2 p-2 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto">
                        {q.code_snippet}
                      </pre>
                    )}
                  </div>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {q.strengths && q.strengths.length > 0 && (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                        <span className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Strengths</span>
                        </span>
                        <ul className="list-disc list-inside text-emerald-900 space-y-0.5">
                          {q.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {q.areas_for_improvement && q.areas_for_improvement.length > 0 && (
                      <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                        <span className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Areas to Enhance</span>
                        </span>
                        <ul className="list-disc list-inside text-amber-900 space-y-0.5">
                          {q.areas_for_improvement.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Model Answer */}
                  {q.model_answer && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs">
                      <span className="font-bold text-indigo-900 flex items-center gap-1 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ideal Model Answer</span>
                      </span>
                      <p className="text-indigo-950 leading-relaxed">{q.model_answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
