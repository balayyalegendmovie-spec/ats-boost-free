import React, { useState, useRef } from 'react';
import './Upload.css';

const Upload = ({ onResumeUpload, onJDUpload, onAnalyze }) => {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const resumeInputRef = useRef(null);
  const jdInputRef = useRef(null);

  // Auto-dismiss messages after 5 seconds
  const showMessage = (setter, message) => {
    setter(message);
    setTimeout(() => setter(''), 5000);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      showMessage(setError, 'Please upload a PDF or Word document for resume');
      return;
    }

    setResumeFile(file);
    setError('');
    showMessage(setSuccess, 'Resume uploaded successfully! Now add a job description to analyze.');
    
    if (onResumeUpload) {
      setUploading(true);
      try {
        await onResumeUpload(file);
      } catch (err) {
        showMessage(setError, 'Failed to process resume: ' + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleJDUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      showMessage(setError, 'Please upload a PDF, Word, or text document for job description');
      return;
    }

    setJdFile(file);
    setError('');
    showMessage(setSuccess, 'Job description uploaded successfully! Click "Analyze Resume" to continue.');
    
    if (onJDUpload) {
      setUploading(true);
      try {
        await onJDUpload(file);
      } catch (err) {
        showMessage(setError, 'Failed to process job description: ' + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleJDTextSubmit = async () => {
    if (!jdText.trim()) {
      showMessage(setError, 'Please enter job description text');
      return;
    }

    setError('');
    showMessage(setSuccess, 'Job description added successfully! Click "Analyze Resume" to continue.');
    
    if (onJDUpload) {
      setUploading(true);
      try {
        await onJDUpload(jdText);
      } catch (err) {
        showMessage(setError, 'Failed to process job description: ' + err.message);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAnalyze = () => {
    if (!resumeFile) {
      showMessage(setError, 'Please upload a resume first');
      return;
    }
    if (!jdFile && !jdText.trim()) {
      showMessage(setError, 'Please upload or paste a job description');
      return;
    }
    
    if (onAnalyze) {
      onAnalyze();
    }
  };

  const canAnalyze = resumeFile && (jdFile || jdText.trim());

  return (
    <div className="upload-container">
      <h2 style={{ color: '#1a1a1a', fontWeight: '600' }}>Upload Your Documents</h2>
      
      {/* Error Message */}
      {error && (
        <div className="alert alert-error" role="alert" style={{
          backgroundColor: '#fee',
          color: '#c00',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #fcc',
          fontWeight: '500'
        }}>
          <span style={{ marginRight: '8px' }}>⚠️</span>
          {error}
        </div>
      )}
      
      {/* Success Message */}
      {success && (
        <div className="alert alert-success" role="alert" style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          border: '1px solid #c3e6cb',
          fontWeight: '500'
        }}>
          <span style={{ marginRight: '8px' }}>✓</span>
          {success}
        </div>
      )}

      <div className="upload-section">
        <h3 style={{ color: '#2d2d2d', fontWeight: '600' }}>Resume</h3>
        <div className="upload-box">
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeUpload}
            disabled={uploading}
            id="resume-input"
            style={{ display: 'none' }}
          />
          <label htmlFor="resume-input" className="upload-label" style={{
            cursor: uploading ? 'not-allowed' : 'pointer',
            color: '#1a1a1a',
            fontWeight: '500'
          }}>
            {resumeFile ? resumeFile.name : 'Click to upload resume (PDF, DOC, DOCX)'}
          </label>
          {resumeFile && (
            <div className="file-info" style={{ color: '#2d2d2d', fontWeight: '500' }}>
              <span>✓ {resumeFile.name}</span>
              <button
                onClick={() => {
                  setResumeFile(null);
                  if (resumeInputRef.current) resumeInputRef.current.value = '';
                }}
                disabled={uploading}
                style={{
                  color: '#c00',
                  fontWeight: '500',
                  opacity: uploading ? 0.5 : 1
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="upload-section">
        <h3 style={{ color: '#2d2d2d', fontWeight: '600' }}>Job Description</h3>
        <div className="upload-box">
          <input
            ref={jdInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleJDUpload}
            disabled={uploading}
            id="jd-input"
            style={{ display: 'none' }}
          />
          <label htmlFor="jd-input" className="upload-label" style={{
            cursor: uploading ? 'not-allowed' : 'pointer',
            color: '#1a1a1a',
            fontWeight: '500'
          }}>
            {jdFile ? jdFile.name : 'Click to upload job description (PDF, DOC, DOCX, TXT)'}
          </label>
          {jdFile && (
            <div className="file-info" style={{ color: '#2d2d2d', fontWeight: '500' }}>
              <span>✓ {jdFile.name}</span>
              <button
                onClick={() => {
                  setJdFile(null);
                  if (jdInputRef.current) jdInputRef.current.value = '';
                }}
                disabled={uploading}
                style={{
                  color: '#c00',
                  fontWeight: '500',
                  opacity: uploading ? 0.5 : 1
                }}
              >
                Remove
              </button>
            </div>
          )}
        </div>
        
        <div className="divider" style={{ color: '#666', fontWeight: '500' }}>OR</div>
        
        <div className="text-input-box">
          <textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste job description here... (Make sure text is clearly readable)"
            disabled={uploading}
            rows="8"
            style={{
              color: '#1a1a1a',
              fontWeight: '400',
              '::placeholder': {
                color: '#666',
                fontWeight: '400'
              }
            }}
          />
          <button
            onClick={handleJDTextSubmit}
            disabled={uploading || !jdText.trim()}
            className="submit-btn"
            style={{
              backgroundColor: (uploading || !jdText.trim()) ? '#ccc' : '#4CAF50',
              color: '#fff',
              fontWeight: '600',
              opacity: (uploading || !jdText.trim()) ? 0.6 : 1
            }}
          >
            {uploading ? 'Processing...' : 'Submit Text'}
          </button>
        </div>
      </div>

      {/* Analyze Button */}
      <div className="analyze-section" style={{ marginTop: '24px' }}>
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || uploading}
          className="analyze-btn"
          style={{
            backgroundColor: (!canAnalyze || uploading) ? '#ccc' : '#2196F3',
            color: '#fff',
            fontWeight: '600',
            fontSize: '16px',
            padding: '14px 32px',
            borderRadius: '8px',
            border: 'none',
            cursor: (!canAnalyze || uploading) ? 'not-allowed' : 'pointer',
            opacity: (!canAnalyze || uploading) ? 0.6 : 1,
            transition: 'all 0.3s ease',
            width: '100%'
          }}
        >
          {uploading ? (
            <span>
              <span className="spinner-small" style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid #fff',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginRight: '8px'
              }}></span>
              Processing...
            </span>
          ) : (
            'Analyze Resume'
          )}
        </button>
      </div>

      {/* Loading Overlay */}
      {uploading && (
        <div className="loading-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div className="loading-content" style={{
            backgroundColor: '#fff',
            padding: '32px',
            borderRadius: '12px',
            textAlign: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
          }}>
            <div className="spinner" style={{
              width: '48px',
              height: '48px',
              border: '4px solid #f3f3f3',
              borderTopColor: '#2196F3',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#1a1a1a', fontWeight: '600', margin: 0 }}>Processing files...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
