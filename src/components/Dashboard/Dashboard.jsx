import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Upload from '../Upload/Upload';
import Analysis from '../Analysis/Analysis';
import './Dashboard.css';

// Utility: safe file reader
const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result?.toString() || '');
    reader.onerror = reject;
    reader.readAsText(file);
  });

const STORAGE_KEYS = {
  resume: 'ats-resume',
  jd: 'ats-jd',
  history: 'ats-history',
};

const Dashboard = () => {
  const { user, logout } = useAuth();

  // Data state
  const [resumeData, setResumeData] = useState(null); // { fileName, text }
  const [jobDescriptionData, setJobDescriptionData] = useState({ mode: 'text', text: '', fileName: '' });
  const [currentView, setCurrentView] = useState('upload'); // upload | analysis | history
  const [history, setHistory] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Restore from storage
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedResume = localStorage.getItem(STORAGE_KEYS.resume);
      if (savedResume) setResumeData(JSON.parse(savedResume));

      const savedJd = localStorage.getItem(STORAGE_KEYS.jd);
      if (savedJd) setJobDescriptionData(JSON.parse(savedJd));
    } catch (err) {
      console.error('Failed to parse saved data', err);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (resumeData) localStorage.setItem(STORAGE_KEYS.resume, JSON.stringify(resumeData));
  }, [resumeData]);

  useEffect(() => {
    if (jobDescriptionData) localStorage.setItem(STORAGE_KEYS.jd, JSON.stringify(jobDescriptionData));
  }, [jobDescriptionData]);

  // Derived flags
  const canAnalyze = useMemo(() => !!(resumeData?.text && jobDescriptionData?.text), [resumeData, jobDescriptionData]);

  // Handlers: Resume
  const onResumeFile = async (file) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const text = await readFile(file);
      setResumeData({ fileName: file.name, text });
      setSuccess('Resume loaded successfully');
    } catch (e) {
      setError('Failed to read resume file');
    } finally {
      setLoading(false);
    }
  };

  // Handlers: JD (toggle text/file but always show textarea)
  const onJDFile = async (file) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const text = await readFile(file);
      setJobDescriptionData({ mode: 'file', fileName: file.name, text });
      setSuccess('Job description loaded from file');
    } catch (e) {
      setError('Failed to read job description file');
    } finally {
      setLoading(false);
    }
  };

  const onJDText = (text) => {
    setJobDescriptionData((prev) => ({ ...prev, mode: 'text', text }));
  };

  // Analysis trigger (delegates to Analysis component alignment)
  const startAnalysis = () => {
    if (!canAnalyze) {
      setError('Please provide both resume and job description.');
      return;
    }
    setError(null);
    setSuccess(null);
    setCurrentView('analysis');
  };

  // Add to history
  const pushHistory = (entry) => {
    const item = { id: Date.now(), ...entry };
    setHistory((h) => [item, ...h].slice(0, 20));
  };

  // Reset feedback after a while
  useEffect(() => {
    if (!error && !success) return;
    const t = setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
    return () => clearTimeout(t);
  }, [error, success]);

  // Visual: Modern background classes are in Dashboard.css to keep JSX clean
  return (
    <div className="dashboard-root">
      <div className="dashboard-bg"></div>
      <header className="dashboard-header">
        <div className="brand">
          <span className="brand-dot"></span>
          ATS Boost
        </div>
        <div className="header-actions">
          <span className="user-chip" title={user?.email}>
            {user?.email ? user.email : 'Guest'}
          </span>
          <button className="btn btn-ghost" onClick={logout}>Logout</button>
        </div>
      </header>

      {/* Feedback toasts */}
      <div className="toast-wrap" aria-live="polite" aria-atomic="true">
        {error && <div className="toast toast-error" role="alert">{error}</div>}
        {success && <div className="toast toast-success" role="status">{success}</div>}
      </div>

      <main className="dashboard-content">
        {/* Cards grid */}
        <section className="cards-grid">
          {/* Upload Card */}
          <article className="card">
            <div className="card-header">
              Upload
              <p className="sub">Add your resume and job description</p>
            </div>
            <div className="card-body">
              <div className="stack gap-md">
                {/* Resume uploader (reuse Upload component for alignment with main branch) */}
                <Upload label="Resume" onFileSelected={onResumeFile} fileName={resumeData?.fileName} />

                {/* JD Input: always show textarea with file/text toggle */}
                <div className="jd-input">
                  <div className="row space between">
                    <label className="label">Job Description</label>
                    <div className="segmented">
                      <button
                        className={jobDescriptionData.mode === 'text' ? 'seg active' : 'seg'}
                        onClick={() => setJobDescriptionData((p) => ({ ...p, mode: 'text' }))}
                        type="button"
                        aria-pressed={jobDescriptionData.mode === 'text'}
                      >Text</button>
                      <button
                        className={jobDescriptionData.mode === 'file' ? 'seg active' : 'seg'}
                        onClick={() => setJobDescriptionData((p) => ({ ...p, mode: 'file' }))}
                        type="button"
                        aria-pressed={jobDescriptionData.mode === 'file'}
                      >File</button>
                    </div>
                  </div>
                  {/* Textarea always visible */}
                  <textarea
                    className="textarea jd-textarea"
                    placeholder="Paste or type the job description here..."
                    value={jobDescriptionData.text}
                    onChange={(e) => onJDText(e.target.value)}
                    rows={8}
                  />
                  {/* Optional file if in file mode */}
                  {jobDescriptionData.mode === 'file' && (
                    <div className="file-inline">
                      <Upload compact label="JD File" onFileSelected={onJDFile} fileName={jobDescriptionData?.fileName} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="card-footer">
              <button className="btn btn-primary" onClick={startAnalysis} disabled={!canAnalyze || loading}>
                {loading ? 'Preparing…' : 'Analyze'}
              </button>
            </div>
          </article>

          {/* Analysis Card */}
          <article className="card">
            <div className="card-header">
              Analysis
              <p className="sub">Match score, gaps, and suggestions</p>
            </div>
            <div className="card-body analysis-area">
              {currentView === 'analysis' && canAnalyze ? (
                <Analysis
                  resumeText={resumeData.text}
                  jdText={jobDescriptionData.text}
                  onComplete={(result) => {
                    setSuccess('Analysis completed');
                    pushHistory({ type: 'analysis', date: new Date().toISOString(), resume: resumeData?.fileName, jd: jobDescriptionData?.fileName || 'Text', resultSummary: result?.summary || '' });
                  }}
                  onError={(msg) => setError(msg || 'Analysis failed')}
                />
              ) : (
                <div className="placeholder">
                  Run an analysis to see results here.
                </div>
              )}
            </div>
          </article>

          {/* History Card */}
          <article className="card">
            <div className="card-header">
              History
              <p className="sub">Recent analyses</p>
            </div>
            <div className="card-body">
              {history.length === 0 ? (
                <div className="placeholder">
                  No history yet. Your latest analyses will appear here.
                </div>
              ) : (
                <ul className="history-list">
                  {history.map((h) => (
                    <li key={h.id} className="history-item">
                      <div className="history-meta">
                        <span className="badge">{new Date(h.date).toLocaleString()}</span>
                        <span className="muted">{h.resume} • {h.jd}</span>
                      </div>
                      <div className="history-summary">{h.resultSummary || '—'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        </section>
      </main>

      <footer className="dashboard-footer">
        <p className="muted">Pro tip: You can paste JD text directly or switch to file mode.</p>
      </footer>
    </div>
  );
};

export default Dashboard;
