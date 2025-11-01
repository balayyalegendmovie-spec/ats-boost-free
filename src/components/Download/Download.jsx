import React, { useState } from 'react';
import './Download.css';

const Download = ({ resumeData, analysisData }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async (format) => {
    setDownloading(true);
    setError('');

    try {
      let content, filename, mimeType;

      switch (format) {
        case 'pdf':
          // In a real app, use a library like jsPDF
          content = generatePDFContent();
          filename = 'resume_optimized.pdf';
          mimeType = 'application/pdf';
          break;

        case 'docx':
          // In a real app, use a library like docx
          content = generateDocxContent();
          filename = 'resume_optimized.docx';
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;

        case 'txt':
          content = generateTextContent();
          filename = 'resume_optimized.txt';
          mimeType = 'text/plain';
          break;

        case 'json':
          content = JSON.stringify(analysisData, null, 2);
          filename = 'analysis_report.json';
          mimeType = 'application/json';
          break;

        default:
          throw new Error('Unsupported format');
      }

      downloadFile(content, filename, mimeType);
    } catch (err) {
      setError('Failed to download file: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const generatePDFContent = () => {
    // Simplified PDF generation (in production, use jsPDF)
    return new Blob([resumeData?.text || 'Resume content'], { type: 'application/pdf' });
  };

  const generateDocxContent = () => {
    // Simplified DOCX generation (in production, use docx library)
    return new Blob([resumeData?.text || 'Resume content'], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
  };

  const generateTextContent = () => {
    return resumeData?.text || 'Resume content';
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = typeof content === 'string' 
      ? new Blob([content], { type: mimeType })
      : content;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(resumeData?.text || '');
      alert('Resume content copied to clipboard!');
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  return (
    <div className="download-container">
      <h2>Export Options</h2>
      
      {error && <div className="error-message">{error}</div>}

      <div className="export-options">
        <div className="format-selector">
          <h3>Select Format</h3>
          <div className="format-buttons">
            <button
              className={exportFormat === 'pdf' ? 'active' : ''}
              onClick={() => setExportFormat('pdf')}
            >
              PDF
            </button>
            <button
              className={exportFormat === 'docx' ? 'active' : ''}
              onClick={() => setExportFormat('docx')}
            >
              DOCX
            </button>
            <button
              className={exportFormat === 'txt' ? 'active' : ''}
              onClick={() => setExportFormat('txt')}
            >
              TXT
            </button>
            <button
              className={exportFormat === 'json' ? 'active' : ''}
              onClick={() => setExportFormat('json')}
            >
              JSON (Report)
            </button>
          </div>
        </div>

        <div className="download-actions">
          <button
            onClick={() => handleDownload(exportFormat)}
            disabled={downloading || !resumeData}
            className="download-btn"
          >
            {downloading ? 'Downloading...' : `Download ${exportFormat.toUpperCase()}`}
          </button>

          <button
            onClick={copyToClipboard}
            disabled={!resumeData}
            className="copy-btn"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>

      {analysisData && (
        <div className="export-summary">
          <h3>What's included:</h3>
          <ul>
            <li>✓ Optimized resume content</li>
            <li>✓ ATS score: {analysisData.overallScore}</li>
            <li>✓ Keyword improvements</li>
            <li>✓ Formatting recommendations</li>
          </ul>
        </div>
      )}

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-grid">
          <button 
            onClick={() => handleDownload('pdf')}
            disabled={downloading || !resumeData}
          >
            📄 Export as PDF
          </button>
          <button 
            onClick={() => handleDownload('docx')}
            disabled={downloading || !resumeData}
          >
            📝 Export as DOCX
          </button>
          <button 
            onClick={() => handleDownload('json')}
            disabled={downloading || !analysisData}
          >
            📊 Download Report
          </button>
          <button onClick={copyToClipboard} disabled={!resumeData}>
            📋 Copy Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default Download;
