import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Upload from '../Upload/Upload';
import Analysis from '../Analysis/Analysis';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [resumeData, setResumeData] = useState(null);
  const [jobDescriptionData, setJobDescriptionData] = useState(null);
  const [currentView, setCurrentView] = useState('upload');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load saved history from localStorage
    const savedHistory = localStorage.getItem('ats-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    }
  }, []);

  const handleResumeUpload = async (file) => {
    setLoading(true);
    try {
      const text = await readFile(file);
      setResumeData({ file, text });
      
      if (jobDescriptionData) {
        setCurrentView('analysis');
      }
    } catch (err) {
      throw new Error('Failed to read resume file');
    } finally {
      setLoading(false);
    }
  };

  const handleJDUpload = async (input) => {
    setLoading(true);
    try {
      let text;
      if (typeof input === 'string') {
        text = input;
      } else {
        text = await readFile(input);
      }
      
      setJobDescriptionData({ text });
      
      if (resumeData) {
        setCurrentView('analysis');
      }
    } catch (err) {
      throw new Error('Failed to process job description');
    } finally {
      setLoading(false);
    }
  };

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const saveToHistory = (score, date) => {
    const newEntry = {
      id: Date.now(),
      score,
      date,
      resumeName: resumeData?.file?.name || 'Pasted Text'
    };
    
    const updatedHistory = [newEntry, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('ats-history', JSON.stringify(updatedHistory));
  };

  const handleReset = () => {
    setResumeData(null);
    setJobDescriptionData(null);
    setCurrentView('upload');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>ATS Boost</h1>
          <div className="user-info">
            <span>Welcome, {user?.email || 'User'}</span>
            <button onClick={logout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={currentView === 'upload' ? 'active' : ''}
          onClick={() => setCurrentView('upload')}
        >
          Upload
        </button>
        <button
          className={currentView === 'analysis' ? 'active' : ''}
          onClick={() => setCurrentView('analysis')}
          disabled={!resumeData || !jobDescriptionData}
        >
          Analysis
        </button>
        <button
          className={currentView === 'history' ? 'active' : ''}
          onClick={() => setCurrentView('history')}
        >
          History
        </button>
      </nav>

      <main className="dashboard-main">
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        )}

        {currentView === 'upload' && (
          <div className="view-content">
            <Upload
              onResumeUpload={handleResumeUpload}
              onJDUpload={handleJDUpload}
            />
            {resumeData && jobDescriptionData && (
              <div className="ready-message">
                <p>✓ Files ready for analysis!</p>
                <button
                  onClick={() => setCurrentView('analysis')}
                  className="analyze-btn"
                >
                  Start Analysis
                </button>
              </div>
            )}
          </div>
        )}

        {currentView === 'analysis' && resumeData && jobDescriptionData && (
          <div className="view-content">
            <Analysis
              resume={resumeData.text}
              jobDescription={jobDescriptionData.text}
            />
            <button onClick={handleReset} className="reset-btn">
              Upload New Files
            </button>
          </div>
        )}

        {currentView === 'history' && (
          <div className="view-content">
            <h2>Analysis History</h2>
            {history.length === 0 ? (
              <p className="empty-state">No analysis history yet</p>
            ) : (
              <div className="history-list">
                {history.map((entry) => (
                  <div key={entry.id} className="history-item">
                    <div className="history-score">{entry.score}</div>
                    <div className="history-details">
                      <p className="history-name">{entry.resumeName}</p>
                      <p className="history-date">{entry.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
