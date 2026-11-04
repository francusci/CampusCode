import { Fragment, useState, type ReactNode } from 'react';
import katex from 'katex';
import { Check, Copy } from '@phosphor-icons/react';

function CopyButton({ text, label = 'Copiar' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2 py-1 text-[11px] font-medium text-white/80 transition hover:bg-white/15 hover:text-white focus-ring"
      aria-label={`${label} bloque de código`}
    >
      {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
      {copied ? 'Copiado' : label}
    </button>
  );
}

function renderMath(expression: string, displayMode = false) {
  try {
    const html = katex.renderToString(expression, {
      throwOnError: false,
      displayMode,
      trust: false,
      strict: false,
    });
    return <span className={displayMode ? 'block overflow-x-auto py-1' : 'inline-block px-0.5'} dangerouslySetInnerHTML={{ __html: html }} />;
  } catch {
    return <code>{expression}</code>;
  }
}

function inline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|`[^`\n]+`|\$[^$\n]+\$|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  const parts = text.split(pattern).filter((part) => part !== '');
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (/^`[^`]+`$/.test(part)) return <code key={key}>{part.slice(1, -1)}</code>;
    if (/^\$[^$]+\$$/.test(part)) return <Fragment key={key}>{renderMath(part.slice(1, -1))}</Fragment>;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return (
        <a key={key} href={link[2]} target="_blank" rel="noreferrer noopener">
          {link[1]}
        </a>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

function Paragraph({ text, keyPrefix }: { text: string; keyPrefix: string }) {
  return <p>{inline(text, keyPrefix)}</p>;
}

function Block({ block, index }: { block: string; index: number }) {
  const trimmed = block.trim();
  if (!trimmed) return null;
  if (/^###?\s+/.test(trimmed)) {
    return <h3>{inline(trimmed.replace(/^###?\s+/, ''), `h-${index}`)}</h3>;
  }
  if (trimmed.startsWith('> ')) {
    return <blockquote>{inline(trimmed.replace(/^>\s?/gm, ''), `q-${index}`)}</blockquote>;
  }
  if (/^\$\$[\s\S]+\$\$$/.test(trimmed)) {
    return <div>{renderMath(trimmed.slice(2, -2), true)}</div>;
  }
  const lines = trimmed.split('\n');
  if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
    return (
      <ul>
        {lines.map((line, lineIndex) => (
          <li key={lineIndex}>{inline(line.replace(/^\s*[-*]\s+/, ''), `li-${index}-${lineIndex}`)}</li>
        ))}
      </ul>
    );
  }
  if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
    return (
      <ol>
        {lines.map((line, lineIndex) => (
          <li key={lineIndex}>{inline(line.replace(/^\s*\d+[.)]\s+/, ''), `ol-${index}-${lineIndex}`)}</li>
        ))}
      </ol>
    );
  }
  return <Paragraph text={trimmed.replace(/\n/g, ' ')} keyPrefix={`p-${index}`} />;
}

export function Markdown({ content }: { content: string }) {
  const segments = content.split(/```(\w*)\n?([\s\S]*?)```/g);
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < segments.length) {
    const text = segments[index];
    const language = segments[index + 1];
    const code = segments[index + 2];
    if (code !== undefined) {
      nodes.push(
        <div key={`code-${index}`} className="overflow-hidden rounded-xl border border-[#1e3150] bg-[#07152c]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">{language || 'código'}</span>
            <CopyButton text={code.replace(/\n$/, '')} />
          </div>
          <pre className="!rounded-none !border-0 !bg-transparent !p-3.5">
            <code>{code.replace(/\n$/, '')}</code>
          </pre>
        </div>,
      );
      index += 3;
      continue;
    }
    const blocks = text.split(/\n{2,}/);
    blocks.forEach((block, blockIndex) => {
      if (block.trim()) nodes.push(<Block key={`b-${index}-${blockIndex}`} block={block} index={blockIndex} />);
    });
    index += 1;
  }

  return <div className="markdown">{nodes}</div>;
}

export { CopyButton };
