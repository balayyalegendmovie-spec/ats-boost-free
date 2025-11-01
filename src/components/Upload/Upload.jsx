import React, { useState, useRef } from 'react';
import './Upload.css';

const Upload = ({ onResumeUpload, onJDUpload }) => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const resumeInputRef = useRef(null);
  const jdInputRef = useRef(null);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document for resume');
      return;
    }

    setResumeFile(file);
    setError('');
    setSuccess('Resume uploaded successfully!');
    
    if (onResumeUpload) {
      setUploading(true);
      try {
        await onResumeUpload(file);
      } catch (err) {
        setError('Failed to process resume: ' + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleJDUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, Word, or text document for job description');
      return;
    }

    setJdFile(file);
    setError('');
    setSuccess('Job description uploaded successfully!');
    
    if (onJDUpload) {
      setUploading(true);
      try {
        await onJDUpload(file);
      } catch (err) {
        setError('Failed to process job description: ' + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleJDTextSubmit = () => {
    if (!jdText.trim()) {
      setError('Please enter a job description');
      return;
    }

    setError('');
    setSuccess('Job description submitted successfully!');
    
    if (onJDUpload) {
      setUploading(true);
      try {
        onJDUpload(jdText);
      } catch (err) {
        setError('Failed to process job description: ' + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Resume & Job Description</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="upload-section">
        <h3>Resume Upload</h3>
        <div className="upload-box">
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeUpload}
            disabled={uploading}
            id="resume-input"
          />
          <label htmlFor="resume-input" className="upload-label">
            {resumeFile ? resumeFile.name : 'Click to upload resume (PDF, DOC, DOCX)'}
          </label>
          {resumeFile && (
            <div className="file-info">
              <span>✓ {resumeFile.name}</span>
              <button
                onClick={() => {
                  setResumeFile(null);
                  if (resumeInputRef.current) resumeInputRef.current.value = '';
                }}
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="upload-section">
        <h3>Job Description</h3>
        <div className="jd-tabs">
          <button className="tab-btn">Upload File</button>
          <button className="tab-btn">Paste Text</button>
        </div>
        
        <div className="upload-box">
          <input
            ref={jdInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleJDUpload}
            disabled={uploading}
            id="jd-input"
          />
          <label htmlFor="jd-input" className="upload-label">
            {jdFile ? jdFile.name : 'Click to upload job description (PDF, DOC, DOCX, TXT)'}
          </label>
          {jdFile && (
            <div className="file-info">
              <span>✓ {jdFile.name}</span>
              <button
                onClick={() => {
                  setJdFile(null);
                  if (jdInputRef.current) jdInputRef.current.value = '';
                }}
                disabled={uploading}
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="text-input-box">
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Or paste job description here..."
            disabled={uploading}
            rows="8"
          />
          <button
            onClick={handleJDTextSubmit}
            disabled={uploading || !jdText.trim()}
            className="submit-btn"
          >
            {uploading ? 'Processing...' : 'Submit Text'}
          </button>
        </div>
      </div>

      {uploading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Processing files...</p>
        </div>
      )}
    </div>
  );
};

export default Upload;
