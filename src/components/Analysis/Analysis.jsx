import React, { useState } from 'react';
import './Analysis.css';

/*
  Props:
    - loading (bool)
    - result ({ score, coverage, matchedKeywords, missingKeywords, insights, requiredKeywords, optionalKeywords, sectionScores, experienceMatch })
    - resumeText (string) - properly parsed text, not DOCX/XML gibberish
    - jdText (string) - properly parsed text
    - error (string) - error message if upload/parsing fails
    - onOptimize (function) - callback to AI optimizer if available
    - onGenerateCoverLetter (function) - callback to cover letter service if available
*/

const Analysis = ({ 
  loading, 
  result, 
  resumeText, 
  jdText, 
  error,
  onOptimize,
  onGenerateCoverLetter 
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState('resume'); // 'resume' or 'jd'

  // Download helper with error handling
  const downloadText = (name, text) => {
    try {
      if (!text) {
        alert('No content available to download.');
        return;
      }
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file. Please try again.');
    }
  };

  // Compute ATS score using correct heuristic
  const computeATSScore = (data) => {
    if (!data) return 0;
    
    // Weighted scoring:
    // - Keyword match: 40%
    // - Section completeness: 30%
    // - Experience match: 30%
    
    const keywordScore = data.coverage || 0;
    const sectionScore = data.sectionScores?.overall || 0;
    const experienceScore = data.experienceMatch || 0;
    
    return Math.round(
      (keywordScore * 0.4) + 
      (sectionScore * 0.3) + 
      (experienceScore * 0.3)
    );
  };

  // Get score color for accessibility
  const getScoreColor = (score) => {
    if (score >= 80) return '#0f5132'; // Dark green for high contrast
    if (score >= 60) return '#664d03'; // Dark yellow-brown
    return '#842029'; // Dark red
  };

  // Get score background for accessibility
  const getScoreBgColor = (score) => {
    if (score >= 80) return '#d1e7dd'; // Light green
    if (score >= 60) return '#fff3cd'; // Light yellow
    return '#f8d7da'; // Light red
  };

  // Preview modal handler
  const togglePreview = (type) => {
    setPreviewType(type);
    setShowPreview(!showPreview);
  };

  const actualScore = result ? computeATSScore(result) : result?.score || 0;

  return (
    <div className="analysis" role="region" aria-label="Resume Analysis Results">
      {/* Error State */}
      {error && (
        <div className="analysis__error" role="alert" aria-live="assertive">
          <svg className="icon-error" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <h3>Analysis Error</h3>
            <p>{error}</p>
            <p className="error-hint">Please ensure your files are valid documents (PDF, DOCX, or TXT) and try again.</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="analysis__loading" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true"></div>
          <p>Analyzing your resume against the job description…</p>
        </div>
      )}

      {/* Results State */}
      {!loading && result && !error && (
        <div className="analysis__result">
          {/* Scorecard with improved accessibility */}
          <div 
            className="scorecard" 
            style={{
              backgroundColor: getScoreBgColor(actualScore),
              borderLeft: `4px solid ${getScoreColor(actualScore)}`
            }}
          >
            <div 
              className="scorecard__score" 
              style={{ color: getScoreColor(actualScore) }}
              aria-label={`ATS Match Score: ${actualScore} percent`}
            >
              {actualScore}%
            </div>
            <div className="scorecard__meta">ATS Match Score</div>
            <div className="scorecard__coverage">
              Keyword coverage: {result.coverage || 0}%
            </div>
            {result.sectionScores && (
              <div className="scorecard__sections">
                Section completeness: {result.sectionScores.overall || 0}%
              </div>
            )}
            {result.experienceMatch !== undefined && (
              <div className="scorecard__experience">
                Experience match: {result.experienceMatch || 0}%
              </div>
            )}
          </div>

          {/* Actionable Insights */}
          {result.insights && result.insights.length > 0 && (
            <div className="insights" role="region" aria-label="Improvement Insights">
              <h3>💡 Actionable Insights & Improvement Tips</h3>
              <ul>
                {result.insights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Keywords Breakdown with Required/Optional */}
          <div className="keywords" role="region" aria-label="Keyword Analysis">
            {/* Matched Keywords */}
            <div className="keywords__block">
              <h3>
                ✓ Matched Keywords ({result.matchedKeywords?.length || 0})
              </h3>
              <div className="chips" role="list">
                {(result.matchedKeywords || []).map((keyword, i) => (
                  <span 
                    key={i} 
                    className="chip chip--ok" 
                    role="listitem"
                    style={{
                      backgroundColor: '#d1e7dd',
                      color: '#0f5132',
                      border: '1px solid #0f5132'
                    }}
                  >
                    {keyword}
                  </span>
                ))}
                {result.matchedKeywords?.length === 0 && (
                  <p className="empty-state">No matched keywords found.</p>
                )}
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="keywords__block">
              <h3>
                ⚠ Missing Keywords ({result.missingKeywords?.length || 0})
              </h3>
              <div className="chips" role="list">
                {(result.missingKeywords || []).map((keyword, i) => (
                  <span 
                    key={i} 
                    className="chip chip--warn" 
                    role="listitem"
                    style={{
                      backgroundColor: '#f8d7da',
                      color: '#842029',
                      border: '1px solid #842029'
                    }}
                  >
                    {keyword}
                  </span>
                ))}
                {result.missingKeywords?.length === 0 && (
                  <p className="empty-state">Great! All important keywords are present.</p>
                )}
              </div>
            </div>

            {/* Required vs Optional Keywords */}
            {(result.requiredKeywords || result.optionalKeywords) && (
              <>
                <div className="keywords__block">
                  <h3>
                    🔴 Required Keywords ({result.requiredKeywords?.length || 0})
                  </h3>
                  <div className="chips" role="list">
                    {(result.requiredKeywords || []).map((keyword, i) => (
                      <span 
                        key={i} 
                        className="chip chip--required" 
                        role="listitem"
                        style={{
                          backgroundColor: '#fff3cd',
                          color: '#664d03',
                          border: '1px solid #664d03',
                          fontWeight: 'bold'
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="keywords__block">
                  <h3>
                    🟡 Optional/Nice-to-Have Keywords ({result.optionalKeywords?.length || 0})
                  </h3>
                  <div className="chips" role="list">
                    {(result.optionalKeywords || []).map((keyword, i) => (
                      <span 
                        key={i} 
                        className="chip chip--optional" 
                        role="listitem"
                        style={{
                          backgroundColor: '#cfe2ff',
                          color: '#084298',
                          border: '1px solid #084298'
                        }}
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Resume Preview Section */}
          <div className="preview-section" role="region" aria-label="Document Preview">
            <h3>📄 Document Preview</h3>
            <div className="preview-buttons">
              <button 
                className="btn btn--secondary" 
                onClick={() => togglePreview('resume')}
                aria-expanded={showPreview && previewType === 'resume'}
              >
                Preview Resume Text
              </button>
              <button 
                className="btn btn--secondary" 
                onClick={() => togglePreview('jd')}
                aria-expanded={showPreview && previewType === 'jd'}
              >
                Preview Job Description
              </button>
            </div>
            
            {showPreview && (
              <div className="preview-modal" role="dialog" aria-label="Document Preview">
                <div className="preview-header">
                  <h4>{previewType === 'resume' ? 'Resume Text' : 'Job Description'}</h4>
                  <button 
                    className="btn-close" 
                    onClick={() => setShowPreview(false)}
                    aria-label="Close preview"
                  >
                    ✕
                  </button>
                </div>
                <pre className="preview-content">
                  {previewType === 'resume' ? resumeText || 'No content available' : jdText || 'No content available'}
                </pre>
              </div>
            )}
          </div>

          {/* AI Services Integration */}
          {(onOptimize || onGenerateCoverLetter) && (
            <div className="ai-services" role="region" aria-label="AI Services">
              <h3>🤖 AI-Powered Services</h3>
              <div className="ai-buttons">
                {onOptimize && (
                  <button 
                    className="btn btn--primary" 
                    onClick={() => onOptimize(resumeText, jdText, result)}
                  >
                    ✨ Optimize Resume with AI
                  </button>
                )}
                {onGenerateCoverLetter && (
                  <button 
                    className="btn btn--primary" 
                    onClick={() => onGenerateCoverLetter(resumeText, jdText, result)}
                  >
                    📝 Generate Cover Letter
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="export" role="region" aria-label="Export Options">
            <h3>💾 Export & Download</h3>
            <div className="export-buttons">
              <button 
                className="btn" 
                onClick={() => downloadText('resume.txt', resumeText)}
                disabled={!resumeText}
              >
                Download Resume Text
              </button>
              <button 
                className="btn btn--secondary" 
                onClick={() => downloadText('job-description.txt', jdText)}
                disabled={!jdText}
              >
                Download Job Description
              </button>
              <button 
                className="btn btn--secondary" 
                onClick={() => downloadText('analysis.json', JSON.stringify(result, null, 2))}
                disabled={!result}
              >
                Export Analysis JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !result && !error && (
        <div className="empty" role="status">
          <svg className="icon-upload" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <h3>No analysis yet</h3>
          <p>Upload your resume and job description, then click Analyze to view detailed results.</p>
        </div>
      )}
    </div>
  );
};

export default Analysis;
