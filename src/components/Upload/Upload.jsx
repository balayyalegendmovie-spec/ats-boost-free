import React, { useRef, useState, useEffect } from 'react';
import './Upload.css';

/*
  Props:
    - onResumeUpload(file)
    - onJobDescriptionUpload(file | string) - now accepts both file and text string
    - resumeFileName (string)
    - jdFileName (string)
    - invalidFeedback(msg)
*/

const Upload = ({ onResumeUpload, onJobDescriptionUpload, resumeFileName, jdFileName, invalidFeedback }) => {
  const resumeInputRef = useRef(null);
  const jdInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [jdInputMode, setJdInputMode] = useState('file'); // 'file' or 'text'
  const [jdText, setJdText] = useState('');

  useEffect(() => {
    // accessibility focus ring removal helper could go here
  }, []);

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
  ];

  const handleFilePick = async (e, kind) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    if (!allowedTypes.includes(file.type)) {
      invalidFeedback?.(`Unsupported ${kind} format. Upload PDF, DOC, DOCX, or TXT.`);
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      invalidFeedback?.(`${kind} file too large. Max 5MB.`);
      e.target.value = '';
      return;
    }

    if (kind === 'resume') {
      onResumeUpload?.(file);
    } else {
      onJobDescriptionUpload?.(file);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const onDrop = (e, kind) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const droppedFile = e.dataTransfer?.files?.[0];
    if (!droppedFile) return;

    if (!allowedTypes.includes(droppedFile.type)) {
      invalidFeedback?.(`Unsupported ${kind} format. Upload PDF, DOC, DOCX, or TXT.`);
      return;
    }

    if (droppedFile.size > 5 * 1024 * 1024) {
      invalidFeedback?.(`${kind} file too large. Max 5MB.`);
      return;
    }

    if (kind === 'resume') {
      onResumeUpload?.(droppedFile);
    } else {
      onJobDescriptionUpload?.(droppedFile);
    }
  };

  const handleJdTextChange = (e) => {
    setJdText(e.target.value);
  };

  const handleJdTextSubmit = () => {
    if (!jdText.trim()) {
      invalidFeedback?.('Job description text cannot be empty.');
      return;
    }
    // Pass the text as a special "text file" object
    onJobDescriptionUpload?.(jdText);
  };

  return (
    <div className="upload" role="region" aria-label="File Upload Section">
      {/* Resume Upload Section */}
      <div className="upload__group">
        <label className="upload__label">Resume</label>
        <div
          className={`dropzone ${dragOver ? 'is-over' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 'resume')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') resumeInputRef.current?.click(); }}
        >
          <p>{resumeFileName ? `Selected: ${resumeFileName}` : 'Drag & drop resume here or click to browse'}</p>
          <button type="button" className="btn btn--small" onClick={() => resumeInputRef.current?.click()}>
            Choose file
          </button>
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={(e) => handleFilePick(e, 'resume')}
            hidden
          />
        </div>
      </div>

      {/* Job Description Section with Toggle */}
      <div className="upload__group">
        <label className="upload__label">Job Description</label>
        
        {/* Mode Toggle Tabs */}
        <div className="jd-mode-toggle" role="tablist" aria-label="Job Description Input Mode">
          <button
            type="button"
            role="tab"
            aria-selected={jdInputMode === 'file'}
            aria-controls="jd-file-panel"
            className={`jd-mode-tab ${jdInputMode === 'file' ? 'active' : ''}`}
            onClick={() => setJdInputMode('file')}
          >
            📁 Upload File
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={jdInputMode === 'text'}
            aria-controls="jd-text-panel"
            className={`jd-mode-tab ${jdInputMode === 'text' ? 'active' : ''}`}
            onClick={() => setJdInputMode('text')}
          >
            📝 Paste Text
          </button>
        </div>

        {/* File Upload Panel */}
        {jdInputMode === 'file' && (
          <div
            id="jd-file-panel"
            role="tabpanel"
            aria-labelledby="jd-file-tab"
            className={`dropzone ${dragOver ? 'is-over' : ''}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, 'job description')}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') jdInputRef.current?.click(); }}
          >
            <p>{jdFileName ? `Selected: ${jdFileName}` : 'Drag & drop JD here or click to browse'}</p>
            <button type="button" className="btn btn--small" onClick={() => jdInputRef.current?.click()}>
              Choose file
            </button>
            <input
              ref={jdInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              onChange={(e) => handleFilePick(e, 'job description')}
              hidden
            />
          </div>
        )}

        {/* Text Input Panel */}
        {jdInputMode === 'text' && (
          <div id="jd-text-panel" role="tabpanel" aria-labelledby="jd-text-tab" className="jd-text-input-panel">
            <textarea
              className="jd-textarea"
              placeholder="Paste the job description text here...\n\nInclude:\n• Job title\n• Required skills and qualifications\n• Responsibilities\n• Experience requirements\n• Any other relevant details"
              value={jdText}
              onChange={handleJdTextChange}
              rows={12}
              aria-label="Job Description Text Input"
            />
            <button
              type="button"
              className="btn btn--primary btn--jd-submit"
              onClick={handleJdTextSubmit}
              disabled={!jdText.trim()}
            >
              Use This Job Description
            </button>
          </div>
        )}
      </div>

      <div className="upload__help">
        Supported: PDF, DOC, DOCX, TXT. Max 5MB each. Or paste job description text directly.
      </div>
    </div>
  );
};

export default Upload;
