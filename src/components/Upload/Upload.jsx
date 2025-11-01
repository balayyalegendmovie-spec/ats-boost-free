import React, { useRef, useState, useEffect } from 'react';
import './Upload.css';

/*
  Props:
    - onResumeUpload(file)
    - onJobDescriptionUpload(file)
    - resumeFileName (string)
    - jdFileName (string)
    - invalidFeedback(msg)
*/
const Upload = ({ onResumeUpload, onJobDescriptionUpload, resumeFileName, jdFileName, invalidFeedback }) => {
  const resumeInputRef = useRef(null);
  const jdInputRef = useRef(null);

  const [dragOver, setDragOver] = useState(false);

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
    const file = e.target.files?.[0];
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      invalidFeedback?.(`Unsupported ${kind} format. Upload PDF, DOC, DOCX, or TXT.`);
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      invalidFeedback?.(`${kind} is too large. Max 5MB.`);
      e.target.value = '';
      return;
    }
    if (kind === 'resume') onResumeUpload?.(file);
    else onJobDescriptionUpload?.(file);
  };

  const onDrop = (ev, kind) => {
    ev.preventDefault();
    setDragOver(false);
    const file = ev.dataTransfer.files?.[0];
    if (!file) return;
    const fakeEvent = { target: { files: [file], value: '' } };
    handleFilePick(fakeEvent, kind);
  };

  const onDragOver = (ev) => {
    ev.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);

  return (
    <div className="upload">
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
          <button type="button" className="btn btn--small" onClick={() => resumeInputRef.current?.click()}>Choose file</button>
          <input
            ref={resumeInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={(e) => handleFilePick(e, 'resume')}
            hidden
          />
        </div>
      </div>

      <div className="upload__group">
        <label className="upload__label">Job Description</label>
        <div
          className={`dropzone ${dragOver ? 'is-over' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, 'job description')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') jdInputRef.current?.click(); }}
        >
          <p>{jdFileName ? `Selected: ${jdFileName}` : 'Drag & drop JD here or click to browse'}</p>
          <button type="button" className="btn btn--small" onClick={() => jdInputRef.current?.click()}>Choose file</button>
          <input
            ref={jdInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={(e) => handleFilePick(e, 'job description')}
            hidden
          />
        </div>
      </div>

      <div className="upload__help">Supported: PDF, DOC, DOCX, TXT. Max 5MB each.</div>
    </div>
  );
};

export default Upload;
