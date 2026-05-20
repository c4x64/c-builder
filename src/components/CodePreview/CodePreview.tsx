import React, { useMemo, useState, useCallback } from 'react';
import { useStore } from '../../store/useStore';
import { generateCCode } from '../../generator/cGenerator';
import { Copy, Check } from 'lucide-react';

// Minimal C syntax highlighter — returns an array of {text, cls} spans
type Span = { text: string; cls: string };

const KEYWORDS = new Set([
  'int','float','double','char','void','bool','return','if','else','while',
  'for','do','break','continue','struct','typedef','include','define',
  'true','false','NULL',
]);

function tokenize(code: string): Span[] {
  const spans: Span[] = [];
  // Regex: comments, strings, numbers, identifiers, punctuation
  const re = /(\/\/[^\n]*)|(\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*")|(\b\d+\.?\d*\b)|([A-Za-z_]\w*)|([{}();,=<>!&|+\-*/%#])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    if (m.index > last) spans.push({ text: code.slice(last, m.index), cls: '' });
    const [full, comment, blockComment, str, num, ident, punct] = m;
    if (comment || blockComment) spans.push({ text: full, cls: 'c-comment' });
    else if (str) spans.push({ text: full, cls: 'c-string' });
    else if (num) spans.push({ text: full, cls: 'c-number' });
    else if (ident) spans.push({ text: full, cls: KEYWORDS.has(full) ? 'c-keyword' : '' });
    else if (punct) spans.push({ text: full, cls: 'c-punct' });
    last = m.index + full.length;
  }
  if (last < code.length) spans.push({ text: code.slice(last), cls: '' });
  return spans;
}

const CodePreview: React.FC = () => {
  const { widgets, nodes, edges, openProjectId, projects, uiLibrary } = useStore();
  const project = projects.find(p => p.id === openProjectId);
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => generateCCode(widgets, nodes, edges, project?.type as 'gui' | 'cli' | 'library' ?? 'gui', project?.plugin ?? 'none', uiLibrary), [widgets, nodes, edges, project?.type, project?.plugin, uiLibrary]);
  const spans = useMemo(() => tokenize(code), [code]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e', overflow: 'hidden' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid #3c3c3c',
        background: '#252526',
      }}>
        <span style={{ color: '#888', fontSize: '0.8rem' }}>main.c — Generated C Code</span>
        <button
          onClick={handleCopy}
          style={{
            background: copied ? '#28a745' : '#3c3c3c',
            color: 'white',
            border: '1px solid #555',
            borderRadius: 4,
            padding: '4px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.8rem',
            transition: 'background 0.2s',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
        <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6', color: '#d4d4d4' }}>
          <code>
            {spans.map((span, i) => (
              span.cls
                ? <span key={i} className={span.cls}>{span.text}</span>
                : span.text
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodePreview;
