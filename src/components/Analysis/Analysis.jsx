import React from 'react';
import './Analysis.css';

/*
  Props:
    - loading (bool)
    - result ({ score, coverage, matchedKeywords, missingKeywords, insights })
    - resumeText (string)
    - jdText (string)
*/
const Analysis = ({ loading, result, resumeText, jdText }) => {
  const downloadText = (name, text) => {
    const blob = new Blob([text || ''], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="analysis">
      {loading && (
        <div className="analysis__loading">
          <div className="spinner" />
          <p>Analyzing your resume against the job description…</p>
        </div>
      )}

      {!loading && result && (
        <div className="analysis__result">
          <div className="scorecard">
            <div className="scorecard__score">{result.score}%</div>
            <div className="scorecard__meta">ATS Match Score</div>
            <div className="scorecard__coverage">Keyword coverage: {result.coverage}%</div>
          </div>

          <div className="insights">
            <h4>Insights</h4>
            <ul>
              {(result.insights || []).map((i, idx) => <li key={idx}>{i}</li>)}
            </ul>
          </div>

          <div className="keywords">
            <div className="keywords__block">
              <h4>Matched Keywords ({result.matchedKeywords?.length || 0})</h4>
              <div className="chips">
                {(result.matchedKeywords || []).map((k, i) => <span key={i} className="chip chip--ok">{k}</span>)}
              </div>
            </div>
            <div className="keywords__block">
              <h4>Missing Keywords ({result.missingKeywords?.length || 0})</h4>
              <div className="chips">
                {(result.missingKeywords || []).map((k, i) => <span key={i} className="chip chip--warn">{k}</span>)}
              </div>
            </div>
          </div>

          <div className="export">
            <button className="btn" onClick={() => downloadText('resume.txt', resumeText)}>Download analyzed resume</button>
            <button className="btn btn--secondary" onClick={() => downloadText('job-description.txt', jdText)}>Download job description</button>
            <button className="btn btn--secondary" onClick={() => downloadText('analysis.json', JSON.stringify(result, null, 2))}>Export analysis JSON</button>
          </div>
        </div>
      )}

      {!loading && !result && (
        <div className="empty">
          <p>No analysis yet. Upload files and click Analyze to view results.</p>
        </div>
      )}
    </div>
  );
};

export default Analysis;
