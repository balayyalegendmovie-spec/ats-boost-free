import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Analysis.css';

/*
  Notes for integrators:
  - For real PDF text extraction in the parent layer, use one of:
    * pdf-parse (Node/Server): const data = await pdfParse(buffer); text = data.text
    * pdfjs-dist (Web): const pdf = await getDocument(url|Uint8Array).promise; iterate pages and page.getTextContent()
    * Fallbacks below attempt to sanitize when PDFs were incorrectly parsed as XML/gibberish
  - This component is UI + client logic. Pass already-extracted resumeText/jdText via props.

  Props:
    - loading (bool)
    - result ({ score, coverage, matchedKeywords, missingKeywords, insights, requiredKeywords, optionalKeywords, sectionScores, experienceMatch })
    - resumeText (string)
    - jdText (string)
    - error (string)
    - onOptimize (function(text): void) optional
    - onGenerateCoverLetter (function({resumeText, jdText}): void) optional

  Accessibility:
    - Landmarks, ARIA labels, keyboard trap safe modals, focus management
*/

const sanitizeExtractedText = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw
    // Remove XML/HTML tags if pdf got dumped as XML
    .replace(/<[^>]+>/g, ' ')
    // Remove excessive unicode control chars
    .replace(/[\u0000-\u001F\u007F-\u009F]+/g, ' ')
    // Collapse multiple spaces/newlines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  // If words are broken with spaces between letters, attempt simple fix: "E x p e r i e n c e" -> "Experience"
  text = text.replace(/(?:\b(?:[A-Za-z]\s){2,}[A-Za-z]\b)/g, (m) => m.replace(/\s/g, ''));
  return text;
};

const computeATSScore = (data) => {
  if (!data) return 0;
  const matched = Number(data?.matchedKeywords?.length || 0);
  const missing = Number(data?.missingKeywords?.length || 0);
  const keywordTotal = matched + missing || 1;
  const keywordRate = matched / keywordTotal; // 0..1

  const sectionAvg = (() => {
    const sec = data?.sectionScores || {};
    const vals = Object.values(sec).map(Number).filter((v) => !Number.isNaN(v));
    if (!vals.length) return 0;
    // assume provided as 0..100
    return vals.reduce((a, b) => a + b, 0) / vals.length / 100;
  })();

  const experience = Math.max(0, Math.min(1, Number(data?.experienceMatch || 0))); // expect 0..1

  // Weighted composite
  const score = (keywordRate * 0.4 + sectionAvg * 0.3 + experience * 0.3) * 100;
  return Math.round(score);
};

const persistKey = 'ats_analysis_history_v1';

const usePersistentHistory = (result) => {
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem(persistKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(history));
    } catch {
      // ignore quota errors
    }
  }, [history]);

  useEffect(() => {
    if (!result) return;
    const computed = computeATSScore(result);
    // Keep compact history of last 10 entries
    setHistory((prev) => {
      const next = [
        {
          ts: Date.now(),
          score: computed,
          matched: result?.matchedKeywords?.length || 0,
          missing: result?.missingKeywords?.length || 0,
        },
        ...prev,
      ].slice(0, 10);
      return next;
    });
  }, [result]);

  return history;
};

const InsightItem = ({ item, icon, title }) => (
  <li className="insight-item" role="listitem">
    <span aria-hidden="true" className="insight-icon">{icon}</span>
    <div className="insight-content">
      <div className="insight-title">{title}</div>
      <div className="insight-text">{item}</div>
    </div>
  </li>
);

const Modal = ({ open, title, onClose, children }) => {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (open) {
      const first = dialogRef.current?.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      first?.focus();
    }
  }, [open]);
  if (!open) return null;
  const onKeyDown = (e) => {
    if (e.key === 'Escape') onClose?.();
  };
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onKeyDown={onKeyDown}>
      <div className="modal" ref={dialogRef}>
        <header className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button className="icon-btn" aria-label="Close dialog" onClick={onClose}>✕</button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
};

const Chips = ({ items = [], variant = 'default', ariaLabel }) => (
  <ul className={`chips chips--${variant}`} role="list" aria-label={ariaLabel}>
    {items.map((t, idx) => (
      <li key={`${t}-${idx}`} className="chip" role="listitem">
        <span className="chip__dot" aria-hidden="true"></span>
        {t}
      </li>
    ))}
  </ul>
);

const Section = ({ title, subtitle, right, children, ariaLabel }) => (
  <section className="card" role="region" aria-label={ariaLabel || title}>
    <header className="card__header">
      <div>
        <h2 className="card__title">{title}</h2>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </div>
      <div className="card__right">{right}</div>
    </header>
    <div className="card__body">{children}</div>
  </section>
);

const Progress = ({ value }) => (
  <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label="ATS score">
    <div className="progress__bar" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

const Analysis = ({ loading, result, resumeText, jdText, error, onOptimize, onGenerateCoverLetter }) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewType, setPreviewType] = useState('resume'); // 'resume' | 'jd'
  const [optOpen, setOptOpen] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);

  const cleanResume = useMemo(() => sanitizeExtractedText(resumeText), [resumeText]);
  const cleanJD = useMemo(() => sanitizeExtractedText(jdText), [jdText]);

  const computedScore = useMemo(() => (result?.score ? Number(result.score) : computeATSScore(result)), [result]);
  const history = usePersistentHistory(result ? { ...result, score: computedScore } : null);

  const actionableTips = useMemo(() => {
    const tips = [];
    const missing = result?.missingKeywords || [];
    const required = result?.requiredKeywords || [];
    const sections = result?.sectionScores || {};

    // Keyword guidance
    missing.forEach((kw) => {
      // Custom per keyword
      tips.push(`Add a concrete bullet using "${kw}" with measurable impact (e.g., increased X by Y%).`);
      tips.push(`Place "${kw}" in both Summary and Experience sections to pass ATS term frequency checks.`);
    });

    // Required keywords
    required
      .filter((kw) => !result?.matchedKeywords?.includes(kw))
      .forEach((kw) => tips.push(`Mark as Required: ensure "${kw}" appears verbatim at least once.`));

    // Section completeness
    Object.entries(sections).forEach(([name, val]) => {
      const v = Number(val || 0);
      if (v < 70) tips.push(`Strengthen ${name}: add 2-3 bullets with quantified results and relevant tools.`);
    });

    // Experience match
    if ((result?.experienceMatch ?? 0) < 0.6)
      tips.push('Align experience: mirror JD responsibilities with action verbs and matching scope/scale.');

    // De-duplicate and cap
    const unique = Array.from(new Set(tips));
    return unique.slice(0, 20);
  }, [result]);

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

  const ScoreBadge = () => (
    <div className="score-badge" aria-label={`ATS score ${computedScore} out of 100`}>
      <span className="score-badge__value">{computedScore}</span>
      <span className="score-badge__label">ATS</span>
    </div>
  );

  return (
    <div className="analysis" role="main" aria-label="ATS Analysis">
      {/* Header / Actions */}
      <div className="toolbar" role="region" aria-label="Actions">
        <div className="toolbar__left">
          <ScoreBadge />
          <div className="toolbar__history" aria-label="Previous scores" role="list">
            {history.map((h) => (
              <span key={h.ts} className="history-dot" role="listitem" title={`Score ${h.score}`}>{h.score}</span>
            ))}
          </div>
        </div>
        <div className="toolbar__right">
          <button className="btn" onClick={() => setOptOpen(true)} aria-haspopup="dialog">Optimize Resume</button>
          <button className="btn btn--secondary" onClick={() => setCoverOpen(true)} aria-haspopup="dialog">Generate Cover Letter</button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              setShowPreview(true);
              setPreviewType('resume');
            }}
            aria-haspopup="dialog"
          >Preview</button>
        </div>
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div className="state state--loading" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true" />
          Analyzing resume…
        </div>
      )}

      {error && !loading && (
        <div className="state state--error" role="alert">
          <span className="state__icon" aria-hidden>⚠️</span>
          {error}
        </div>
      )}

      {/* Grid Layout */}
      {!loading && !error && result && (
        <div className="grid">
          <Section title="ATS Score" subtitle="Keyword coverage, sections, experience" right={<Progress value={computedScore} />} ariaLabel="ATS score">
            <div className="score-sections">
              <div className="score-row">
                <span>Keywords</span>
                <span>{(result?.matchedKeywords?.length || 0)}/{((result?.matchedKeywords?.length || 0) + (result?.missingKeywords?.length || 0)) || 0}</span>
              </div>
              <div className="score-row">
                <span>Section completeness</span>
                <span>{Math.round((Object.values(result?.sectionScores || {}).reduce((a, b) => Number(a) + Number(b), 0) || 0) / Math.max(1, Object.keys(result?.sectionScores || {}).length))}%</span>
              </div>
              <div className="score-row">
                <span>Experience alignment</span>
                <span>{Math.round((Number(result?.experienceMatch || 0)) * 100)}%</span>
              </div>
            </div>
          </Section>

          <Section title="Matched Keywords" subtitle="What your resume already covers" ariaLabel="Matched keywords">
            <Chips items={result?.matchedKeywords || []} variant="success" ariaLabel="Matched keywords list" />
          </Section>

          <Section title="Missing Keywords" subtitle="Add these to improve your score" ariaLabel="Missing keywords">
            <Chips items={result?.missingKeywords || []} variant="warning" ariaLabel="Missing keywords list" />
          </Section>

          <Section title="Actionable Insights" subtitle="Smart suggestions based on gaps" ariaLabel="Actionable insights">
            {actionableTips.length ? (
              <ul className="insights" role="list">
                {actionableTips.map((t, i) => (
                  <InsightItem key={i} item={t} icon="💡" title="Suggested improvement" />
                ))}
              </ul>
            ) : (
              <p>Great job! Minimal gaps detected.</p>
            )}
          </Section>

          <Section title="Sections" subtitle="Resume section health" ariaLabel="Section scores" right={null}>
            <ul className="sections" role="list">
              {Object.entries(result?.sectionScores || {}).map(([name, val]) => (
                <li key={name} className="section-row" role="listitem">
                  <span className="section-row__name">{name}</span>
                  <div className="section-row__meter">
                    <div className="section-row__bar" style={{ width: `${Math.max(0, Math.min(100, Number(val || 0)))}%` }} />
                  </div>
                  <span className="section-row__value">{Math.round(Number(val || 0))}%</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Exports" subtitle="Download your content" ariaLabel="Export options">
            <div className="export-buttons">
              <button className="btn" onClick={() => downloadText('resume.txt', cleanResume)} disabled={!cleanResume}>Download Resume Text</button>
              <button className="btn btn--secondary" onClick={() => downloadText('job-description.txt', cleanJD)} disabled={!cleanJD}>Download Job Description</button>
              <button className="btn btn--secondary" onClick={() => downloadText('analysis.json', JSON.stringify(result || {}, null, 2))} disabled={!result}>Export Analysis JSON</button>
            </div>
          </Section>
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && !error && (
        <div className="empty" role="status">
          <div className="empty__icon" aria-hidden>
