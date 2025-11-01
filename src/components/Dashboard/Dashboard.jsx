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
    } catch (err) {
      console.warn('Could not load history', err);
    }
  }, []);

  // Save history on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
    } catch (err) {
      console.warn('Could not save history', err);
    }
  }, [history]);

  const handleResumeUpload = async (file) => {
    try {
      setError(null);
      setLoading(true);
      const text = await readFile(file);
      const newData = { fileName: file.name, text };
      setResumeData(newData);
      // also save to localStorage for convenience
      try {
        localStorage.setItem(STORAGE_KEYS.resume, JSON.stringify(newData));
      } catch (e) {
        console.warn('Could not cache resume', e);
      }
    } catch (err) {
      setError('Failed to read resume file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Updated to handle both File objects and text strings
  const handleJobDescriptionUpload = async (fileOrText) => {
    try {
      setError(null);
      setLoading(true);
      
      let text;
      let fileName;
      
      // Check if input is a string (direct text input) or a File object
      if (typeof fileOrText === 'string') {
        // Direct text input from textarea
        text = fileOrText;
        fileName = 'Job Description (Text Input)';
      } else if (fileOrText instanceof File) {
        // File upload
        text = await readFile(fileOrText);
        fileName = fileOrText.name;
      } else {
        throw new Error('Invalid input: expected File or string');
      }
      
      const newData = { fileName, text };
      setJobDescriptionData(newData);
      
      // Save to localStorage for convenience
      try {
        localStorage.setItem(STORAGE_KEYS.jd, JSON.stringify(newData));
      } catch (e) {
        console.warn('Could not cache job description', e);
      }
    } catch (err) {
      setError('Failed to process job description: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const mockAnalysisEngine = (resumeText, jdText) => {
    // simplified score: measure keyword match as a percentage
    const jdWords = jdText.toLowerCase().match(/\w+/g) || [];
    const resumeWords = new Set(
      resumeText.toLowerCase().match(/\w+/g) || []
    );
    const commonWords = jdWords.filter(w => resumeWords.has(w));
    const coverage = Math.round((commonWords.length / jdWords.length) * 100) || 0;
    const score = Math.min(coverage, 100);
    const requiredKeywords = ['experience', 'skills', 'education'];
    const optionalKeywords = ['leadership', 'communication', 'teamwork'];
    const matchedKeywords = [
      ...new Set(
        jdWords.filter(w => resumeWords.has(w) && w.length > 3).slice(0, 10)
      ),
    ];
    const missingKeywords = jdWords
      .filter(w => !resumeWords.has(w) && w.length > 4)
      .slice(0, 8);
    const insights = [
      score < 50 ? 'Consider adding more relevant keywords from the job description.' : 'Good keyword match!',
      'Tailor your resume to highlight specific experiences mentioned in the JD.',
    ];
    const sectionScores = {
      skills: Math.min(score + 10, 100),
      experience: Math.max(score - 5, 0),
      education: score,
    };
    const experienceMatch = score > 60 ? 'Strong' : score > 40 ? 'Moderate' : 'Weak';

    return {
      score,
      coverage,
      matchedKeywords,
      missingKeywords,
      insights,
      requiredKeywords,
      optionalKeywords,
      sectionScores,
      experienceMatch,
    };
  };

  const handleAnalyze = () => {
    if (!resumeData || !jobDescriptionData) {
      setError('Please upload both a resume and a job description before analyzing.');
      return;
    }
    setLoading(true);
    setError(null);
    // simulate async call
    setTimeout(() => {
      const result = mockAnalysisEngine(resumeData.text, jobDescriptionData.text);
      setAnalysisResult(result);
      setCurrentView('analysis');
      // add to history
      const newEntry = {
        id: Date.now(),
        date: new Date().toISOString(),
        resumeFile: resumeData.fileName,
        jdFile: jobDescriptionData.fileName,
        score: result.score,
        coverage: result.coverage,
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 10));
      setLoading(false);
    }, 800);
  };

  const goBackToUpload = () => {
    setCurrentView('upload');
    setAnalysisResult(null);
  };

  const clearAll = () => {
    setResumeData(null);
    setJobDescriptionData(null);
    setAnalysisResult(null);
    setError(null);
    setCurrentView('upload');
    try {
      localStorage.removeItem(STORAGE_KEYS.resume);
      localStorage.removeItem(STORAGE_KEYS.jd);
    } catch (e) {
      console.warn('Could not clear storage', e);
    }
  };

  const canAnalyze = useMemo(
    () => !loading && resumeData && jobDescriptionData,
    [loading, resumeData, jobDescriptionData]
  );

  return (
    <div className="dashboard">
      {currentView === 'analysis' && analysisResult ? (
        <Analysis
          loading={false}
          result={analysisResult}
          resumeText={resumeData?.text || ''}
          jdText={jobDescriptionData?.text || ''}
          error={error}
          onBack={goBackToUpload}
        />
      ) : (
        <div className="dashboard-container">
          <header className="dashboard__header">
            <h1>ATS Resume Analyzer</h1>
            <div className="dashboard__user">
              <span>Welcome, {user?.email || 'User'}</span>
              <button className="btn btn--logout" onClick={logout}>
                Sign Out
              </button>
            </div>
          </header>
          {error && <div className="error-banner">{error}</div>}
          <Upload
            onResumeUpload={handleResumeUpload}
            onJobDescriptionUpload={handleJobDescriptionUpload}
            resumeFileName={resumeData?.fileName}
            jdFileName={jobDescriptionData?.fileName}
            invalidFeedback={setError}
          />
          <div className="dashboard__actions">
            <button className="btn btn--primary" onClick={handleAnalyze} disabled={!canAnalyze}>
              Analyze Resume
            </button>
            <button className="btn btn--secondary" onClick={clearAll} disabled={loading}>
              Reset
            </button>
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
        </div>
      )}
    </div>
  );
};

export default Dashboard;
