import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Upload from '../Upload/Upload';
import Analysis from '../Analysis/Analysis';
import './Dashboard.css';

// helper to read files safely
const readFile = (file) => new Promise((resolve, reject) => {
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

  const [resumeData, setResumeData] = useState(null); // {fileName, text}
  const [jobDescriptionData, setJobDescriptionData] = useState(null); // {fileName, text}
  const [currentView, setCurrentView] = useState('upload');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Restore from storage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.history);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      const savedResume = sessionStorage.getItem(STORAGE_KEYS.resume);
      if (savedResume) {
        const r = JSON.parse(savedResume);
        setResumeData({ fileName: r.fileName, text: r.text });
      }
      const savedJd = sessionStorage.getItem(STORAGE_KEYS.jd);
      if (savedJd) {
        const j = JSON.parse(savedJd);
        setJobDescriptionData({ fileName: j.fileName, text: j.text });
      }
    } catch (e) {
      console.error('Failed to load saved state', e);
    }
  }, []);

  // Persist history and inputs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
    } catch {}
  }, [history]);

  useEffect(() => {
    try {
      if (resumeData) sessionStorage.setItem(STORAGE_KEYS.resume, JSON.stringify(resumeData));
      else sessionStorage.removeItem(STORAGE_KEYS.resume);
    } catch {}
  }, [resumeData]);

  useEffect(() => {
    try {
      if (jobDescriptionData) sessionStorage.setItem(STORAGE_KEYS.jd, JSON.stringify(jobDescriptionData));
      else sessionStorage.removeItem(STORAGE_KEYS.jd);
    } catch {}
  }, [jobDescriptionData]);

  const canAnalyze = useMemo(() => !!(resumeData?.text && jobDescriptionData?.text), [resumeData, jobDescriptionData]);

  const validateText = (text) => text && text.trim().length > 10; // simple validation

  const handleResumeUpload = async (file) => {
    setError(null);
    if (!file) return setError('No resume file selected.');
    const allowed = ['pdf', 'doc', 'docx', 'txt', 'md'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setError('Unsupported resume format. Please upload PDF, DOC, DOCX, or TXT.');
      return;
    }
    setLoading(true);
    try {
      const text = await readFile(file);
      if (!validateText(text)) throw new Error('Resume appears empty or unreadable.');
      setResumeData({ fileName: file.name, text });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to read resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleJobDescriptionUpload = async (file) => {
    setError(null);
    if (!file) return setError('No job description file selected.');
    const allowed = ['pdf', 'doc', 'docx', 'txt', 'md'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setError('Unsupported JD format. Please upload PDF, DOC, DOCX, or TXT.');
      return;
    }
    setLoading(true);
    try {
      const text = await readFile(file);
      if (!validateText(text)) throw new Error('Job description appears empty or unreadable.');
      setJobDescriptionData({ fileName: file.name, text });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to read job description.');
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!canAnalyze) return;
    setError(null);
    setLoading(true);
    setCurrentView('analysis');
    try {
      // call local scoring util or API
      const payload = {
        resume: resumeData.text,
        jobDescription: jobDescriptionData.text,
      };
      // naive local ATS score + keywords
      const jdWords = Array.from(new Set(payload.jobDescription.toLowerCase().match(/[a-zA-Z]{3,}/g) || []));
      const resumeWords = new Set((payload.resume.toLowerCase().match(/[a-zA-Z]{3,}/g) || []));
      const matched = jdWords.filter(w => resumeWords.has(w));
      const coverage = Math.round((matched.length / Math.max(1, jdWords.length)) * 100);
      const score = Math.min(100, Math.round(60 + coverage * 0.4));
      const result = {
        score,
        coverage,
        matchedKeywords: matched.slice(0, 100),
        missingKeywords: jdWords.filter(w => !resumeWords.has(w)).slice(0, 100),
        insights: [
          coverage < 50 ? 'Low keyword coverage. Add more role-specific terms.' : 'Good keyword coverage.',
          score < 75 ? 'Consider tailoring achievements with metrics.' : 'Strong alignment overall.',
        ],
        timestamp: Date.now(),
      };

      setAnalysisResult(result);
      setHistory(prev => [{
        id: result.timestamp,
        resumeFile: resumeData.fileName,
        jdFile: jobDescriptionData.fileName,
        score: result.score,
        coverage: result.coverage,
        date: new Date(result.timestamp).toISOString(),
      }, ...prev].slice(0, 50));
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setResumeData(null);
    setJobDescriptionData(null);
    setAnalysisResult(null);
    setError(null);
    sessionStorage.removeItem(STORAGE_KEYS.resume);
    sessionStorage.removeItem(STORAGE_KEYS.jd);
    setCurrentView('upload');
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h2>ATS Boost Dashboard</h2>
        {user && <div className="dashboard__user">Hi, {user.email || 'User'} <button className="btn btn--link" onClick={logout}>Logout</button></div>}
      </header>

      {error && <div role="alert" className="alert alert--error">{error}</div>}

      <section className="dashboard__content">
        {currentView === 'upload' && (
          <Upload
            onResumeUpload={handleResumeUpload}
            onJobDescriptionUpload={handleJobDescriptionUpload}
            resumeFileName={resumeData?.fileName}
            jdFileName={jobDescriptionData?.fileName}
            invalidFeedback={(msg) => setError(msg)}
          />
        )}

        {currentView === 'analysis' && (
          <Analysis
            loading={loading}
            result={analysisResult}
            resumeText={resumeData?.text}
            jdText={jobDescriptionData?.text}
          />)
        }
      </section>

      <footer className="dashboard__footer">
        <div className="actions">
          <button className="btn" disabled={!canAnalyze || loading} onClick={runAnalysis} aria-disabled={!canAnalyze || loading}>
            {loading ? 'Analyzing…' : 'Analyze Resume'}
          </button>
          <button className="btn btn--secondary" onClick={clearAll} disabled={loading}>Reset</button>
        </div>

        {loading && (
          <div className="progress">
            <div className="spinner" aria-label="Loading" />
            <div className="bar"><div className="bar__fill" /></div>
          </div>
        )}

        {!!history.length && (
          <div className="history">
            <h3>Analysis History</h3>
            <ul>
              {history.map(h => (
                <li key={h.id}>
                  <span>{new Date(h.date).toLocaleString()}</span>
                  <span>Score: {h.score}% (Coverage {h.coverage}%)</span>
                  <span>{h.resumeFile} vs {h.jdFile}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </footer>
    </div>
  );
};

export default Dashboard;
