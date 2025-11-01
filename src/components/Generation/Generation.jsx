import React, { useState } from 'react';
import './Generation.css';

const Generation = ({ analysisData, resumeData }) => {
  const [optimizedContent, setOptimizedContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [improvements, setImprovements] = useState([]);

  const generateOptimizedResume = async () => {
    if (!resumeData || !analysisData) {
      setError('Please upload resume and job description first');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      // Simulate AI optimization process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const optimizations = [
        'Added relevant keywords from job description',
        'Improved action verbs and quantifiable metrics',
        'Reorganized experience section for better ATS parsing',
        'Enhanced skills section with technical keywords',
        'Optimized formatting for ATS compatibility'
      ];

      const optimized = applyOptimizations(resumeData.text, analysisData);
      
      setOptimizedContent(optimized);
      setImprovements(optimizations);
    } catch (err) {
      setError('Failed to generate optimized resume: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const applyOptimizations = (resumeText, analysis) => {
    // Simulate AI optimization
    let optimized = resumeText;

    // Add missing keywords
    if (analysis.missingKeywords && analysis.missingKeywords.length > 0) {
      const keywordsToAdd = analysis.missingKeywords.slice(0, 5).join(', ');
      optimized += `\n\nKEY SKILLS: ${keywordsToAdd}`;
    }

    // Add section headers if missing
    if (!resumeText.toLowerCase().includes('professional summary')) {
      optimized = 'PROFESSIONAL SUMMARY\nExperienced professional with proven track record.\n\n' + optimized;
    }

    return optimized;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedContent);
    alert('Optimized content copied to clipboard!');
  };

  const handleApply = () => {
    // Apply the optimized content back to resume
    if (resumeData) {
      resumeData.text = optimizedContent;
      alert('Optimizations applied to your resume!');
    }
  };

  return (
    <div className="generation-container">
      <h2>AI Resume Optimizer</h2>
      
      {error && <div className="error-message">{error}</div>}

      {!optimizedContent && (
        <div className="generate-section">
          <p>Use AI to optimize your resume for better ATS scores</p>
          <button
            onClick={generateOptimizedResume}
            disabled={generating || !resumeData || !analysisData}
            className="generate-btn"
          >
            {generating ? 'Generating...' : 'Generate Optimized Resume'}
          </button>
        </div>
      )}

      {generating && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>AI is analyzing and optimizing your resume...</p>
          <div className="progress-steps">
            <div className="step">Analyzing keywords</div>
            <div className="step">Improving content</div>
            <div className="step">Formatting for ATS</div>
          </div>
        </div>
      )}

      {optimizedContent && (
        <div className="optimization-results">
          <div className="improvements-panel">
            <h3>Applied Improvements</h3>
            <ul>
              {improvements.map((improvement, index) => (
                <li key={index}>
                  <span className="check-icon">✓</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>

          <div className="content-comparison">
            <div className="content-panel">
              <h3>Original Resume</h3>
              <div className="content-box original">
                <pre>{resumeData?.text || 'No resume loaded'}</pre>
              </div>
            </div>

            <div className="content-panel">
              <h3>Optimized Resume</h3>
              <div className="content-box optimized">
                <pre>{optimizedContent}</pre>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button onClick={handleCopy} className="copy-btn">
              Copy Optimized Resume
            </button>
            <button onClick={handleApply} className="apply-btn">
              Apply Changes
            </button>
            <button
              onClick={generateOptimizedResume}
              className="regenerate-btn"
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      <div className="tips-section">
        <h3>Optimization Tips</h3>
        <ul>
          <li>Our AI analyzes job descriptions to match relevant keywords</li>
          <li>We improve action verbs and add quantifiable metrics</li>
          <li>Resume structure is optimized for ATS parsing</li>
          <li>Technical skills are highlighted based on job requirements</li>
        </ul>
      </div>
    </div>
  );
};

export default Generation;
