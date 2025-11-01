import React, { useState, useEffect } from 'react';
import './Analysis.css';

const Analysis = ({ resume, jobDescription }) => {
  const [score, setScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [optimizing, setOptimizing] = useState(false);

  useEffect(() => {
    if (resume && jobDescription) {
      performAnalysis();
    }
  }, [resume, jobDescription]);

  const performAnalysis = async () => {
    setLoading(true);
    setError('');

    try {
      // Simulate ATS scoring algorithm
      const keywords = extractKeywords(jobDescription);
      const matchedKeywords = findMatchingKeywords(resume, keywords);
      const calculatedScore = calculateScore(matchedKeywords, keywords);
      
      const analysisResult = {
        overallScore: calculatedScore,
        matchedKeywords: matchedKeywords,
        missingKeywords: keywords.filter(k => !matchedKeywords.includes(k)),
        sections: {
          skills: analyzeSection(resume, 'skills'),
          experience: analyzeSection(resume, 'experience'),
          education: analyzeSection(resume, 'education'),
          format: analyzeFormat(resume)
        }
      };

      setScore(calculatedScore);
      setAnalysis(analysisResult);
      generateSuggestions(analysisResult);
    } catch (err) {
      setError('Failed to analyze resume: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const extractKeywords = (text) => {
    const commonWords = ['the', 'and', 'is', 'in', 'to', 'of', 'a', 'for'];
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    return [...new Set(words.filter(word => word.length > 3 && !commonWords.includes(word)))];
  };

  const findMatchingKeywords = (resume, keywords) => {
    const resumeLower = resume.toLowerCase();
    return keywords.filter(keyword => resumeLower.includes(keyword.toLowerCase()));
  };

  const calculateScore = (matched, total) => {
    if (total.length === 0) return 0;
    return Math.round((matched.length / total.length) * 100);
  };

  const analyzeSection = (text, section) => {
    const sectionRegex = new RegExp(`${section}[:\\s]`, 'i');
    return sectionRegex.test(text) ? 'Found' : 'Missing';
  };

  const analyzeFormat = (text) => {
    const hasStructure = /\n{2,}/.test(text);
    return hasStructure ? 'Well-formatted' : 'Needs improvement';
  };

  const generateSuggestions = (analysisResult) => {
    const newSuggestions = [];
    
    if (analysisResult.overallScore < 60) {
      newSuggestions.push('Your ATS score is below average. Consider adding more relevant keywords.');
    }
    
    if (analysisResult.missingKeywords.length > 0) {
      newSuggestions.push(`Add these missing keywords: ${analysisResult.missingKeywords.slice(0, 5).join(', ')}`);
    }
    
    if (analysisResult.sections.skills === 'Missing') {
      newSuggestions.push('Add a dedicated Skills section to your resume.');
    }
    
    if (analysisResult.sections.format !== 'Well-formatted') {
      newSuggestions.push('Improve resume formatting with clear section breaks.');
    }

    setSuggestions(newSuggestions);
  };

  const optimizeResume = async () => {
    setOptimizing(true);
    setError('');

    try {
      // Simulate AI optimization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const optimizedSuggestions = [
        'Reorganize your experience section to highlight relevant achievements',
        'Add quantifiable metrics to your accomplishments',
        'Include technical skills mentioned in the job description',
        'Use action verbs to start bullet points',
        'Tailor your summary to match the job requirements'
      ];

      setSuggestions([...suggestions, ...optimizedSuggestions]);
      setScore(Math.min(100, score + 15)); // Boost score after optimization
    } catch (err) {
      setError('Failed to optimize resume: ' + err.message);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="analysis-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-container">
        <div className="error-message">{error}</div>
        <button onClick={performAnalysis}>Retry Analysis</button>
      </div>
    );
  }

  if (!score || !analysis) {
    return (
      <div className="analysis-container">
        <p>Upload a resume and job description to see analysis</p>
      </div>
    );
  }

  return (
    <div className="analysis-container">
      <h2>ATS Analysis Results</h2>
      
      <div className="score-display">
        <div className="score-circle" style={{ '--score': score }}>
          <span className="score-value">{score}</span>
          <span className="score-label">ATS Score</span>
        </div>
        <div className="score-interpretation">
          {score >= 80 && <p className="excellent">Excellent match!</p>}
          {score >= 60 && score < 80 && <p className="good">Good match</p>}
          {score < 60 && <p className="needs-work">Needs improvement</p>}
        </div>
      </div>

      <div className="analysis-sections">
        <div className="section">
          <h3>Keyword Match</h3>
          <p>Matched: {analysis.matchedKeywords.length}</p>
          <p>Missing: {analysis.missingKeywords.length}</p>
        </div>

        <div className="section">
          <h3>Resume Sections</h3>
          <ul>
            <li>Skills: {analysis.sections.skills}</li>
            <li>Experience: {analysis.sections.experience}</li>
            <li>Education: {analysis.sections.education}</li>
            <li>Format: {analysis.sections.format}</li>
          </ul>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions-section">
          <h3>Improvement Suggestions</h3>
          <ul>
            {suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="action-buttons">
        <button 
          onClick={optimizeResume} 
          disabled={optimizing}
          className="optimize-btn"
        >
          {optimizing ? 'Optimizing...' : 'AI Optimize Resume'}
        </button>
        <button onClick={performAnalysis} className="reanalyze-btn">
          Re-analyze
        </button>
      </div>
    </div>
  );
};

export default Analysis;
