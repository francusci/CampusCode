import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(root, 'docs', 'INFORME.md');
const outputPath = path.join(root, 'docs', 'INFORME.html');

const markdown = fs.readFileSync(sourcePath, 'utf8').replace(/\r\n/g, '\n');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function inline(value) {
  const codes = [];
  let text = String(value).replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\u0000${codes.length - 1}\u0000`;
  });

  text = escapeHtml(text);

  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const safeUrl = /^(https?:|mailto:|#|\/)/i.test(url) ? url : '#';
    return `<a href="${escapeHtml(safeUrl)}">${label}</a>`;
  });

  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');

  return text.replace(/\u0000(\d+)\u0000/g, (_, index) => `<code>${escapeHtml(codes[Number(index)])}</code>`);
}

function splitTableRow(line) {
  let value = line.trim();
  if (value.startsWith('|')) value = value.slice(1);
  if (value.endsWith('|')) value = value.slice(0, -1);
  return value.split('|').map((cell) => cell.trim());
}

function isTableSeparator(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function renderBlocks(lines) {
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const language = fence[1] || '';
      const code = [];
      index += 1;
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      html.push(
        `<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>${escapeHtml(code.join('\n'))}</code></pre>`,
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      html.push(`<h${level} id="${slugify(text)}">${inline(text)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      html.push('<hr>');
      index += 1;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      html.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`);
      continue;
    }

    if (line.includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const header = splitTableRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      const head = header.map((cell) => `<th>${inline(cell)}</th>`).join('');
      const body = rows
        .map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`)
        .join('');
      html.push(`<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*[-*]\s+/, ''));
        index += 1;
      }
      html.push(`<ul>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index += 1;
      }
      html.push(`<ol>${items.map((item) => `<li>${inline(item)}</li>`).join('')}</ol>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,6})\s+/.test(lines[index]) &&
      !/^```/.test(lines[index]) &&
      !/^\s*>\s?/.test(lines[index]) &&
      !/^\s*[-*]\s+/.test(lines[index]) &&
      !/^\s*\d+\.\s+/.test(lines[index]) &&
      !/^\s*---+\s*$/.test(lines[index]) &&
      !(lines[index].includes('|') && index + 1 < lines.length && isTableSeparator(lines[index + 1]))
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${inline(paragraph.join(' '))}</p>`);
  }

  return html.join('\n');
}

const bodyMarker = '## Ficha rápida';
const markerIndex = markdown.indexOf(bodyMarker);
const coverMarkdown = markerIndex >= 0 ? markdown.slice(0, markerIndex) : '';
const bodyMarkdown = markerIndex >= 0 ? markdown.slice(markerIndex) : markdown;

const coverHtml = renderBlocks(coverMarkdown.split('\n'));
const bodyHtml = renderBlocks(bodyMarkdown.split('\n'));

const tocItems = [...bodyMarkdown.matchAll(/^##\s+(.+)$/gm)].map((match) => {
  const text = match[1].trim();
  return { text, id: slugify(text) };
});

const tocHtml = tocItems
  .map((item) => `<li><a href="#${item.id}">${inline(item.text)}</a></li>`)
  .join('');

const document = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>CampusCode · Informe de presentación</title>
<style>
  @page {
    size: A4;
    margin: 17mm 15mm 17mm 15mm;
  }

  :root {
    --navy: #07152c;
    --blue: #2563eb;
    --muted: #64748b;
    --line: #dbe3ef;
    --paper: #ffffff;
    --soft: #f8fafc;
  }

  * { box-sizing: border-box; }

  html {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    margin: 0;
    font-family: "Segoe UI", "Instrument Sans", Arial, sans-serif;
    font-size: 10.1pt;
    line-height: 1.55;
    color: #1f2937;
    background: var(--paper);
  }

  .cover {
    page-break-after: always;
    padding-top: 28mm;
  }

  .cover h1 {
    margin: 0 0 5mm;
    font-size: 44pt;
    line-height: 1;
    letter-spacing: -1.6px;
    color: var(--navy);
  }

  .cover h2 {
    margin: 0 0 11mm;
    padding: 0;
    border: 0;
    font-size: 19pt;
    font-weight: 500;
    color: var(--blue);
  }

  .cover p {
    margin: 1.6mm 0;
    font-size: 10.4pt;
    text-align: left;
  }

  .cover strong { color: var(--navy); }

  .cover hr {
    width: 42mm;
    margin: 12mm 0;
    border: 0;
    border-top: 2.5px solid var(--blue);
  }

  .cover blockquote {
    margin-top: 16mm;
    padding: 6mm 7mm;
    border-left: 4px solid var(--blue);
    background: var(--soft);
    color: #475569;
    font-size: 9.4pt;
  }

  .cover blockquote p { margin: 0; }

  .toc {
    page-break-after: always;
  }

  .toc h2 {
    margin-top: 0;
    border-bottom: 2px solid var(--navy);
    padding-bottom: 3mm;
  }

  .toc ol {
    margin: 5mm 0 0 6mm;
    padding: 0;
    font-size: 10.2pt;
  }

  .toc li {
    margin: 0 0 2.1mm;
    padding-left: 2mm;
  }

  .toc a {
    color: #1f2937;
    text-decoration: none;
  }

  h2 {
    margin: 9mm 0 3.5mm;
    padding-bottom: 1.8mm;
    border-bottom: 1.5px solid var(--line);
    font-size: 15.5pt;
    line-height: 1.2;
    color: var(--navy);
    page-break-after: avoid;
  }

  h3 {
    margin: 6.5mm 0 2mm;
    font-size: 11.8pt;
    color: var(--navy);
    page-break-after: avoid;
  }

  h4 {
    margin: 5mm 0 1.8mm;
    font-size: 10.6pt;
    color: var(--navy);
    page-break-after: avoid;
  }

  p {
    margin: 0 0 2.8mm;
    text-align: justify;
  }

  ul, ol {
    margin: 0 0 3mm 5mm;
    padding-left: 5mm;
  }

  li {
    margin-bottom: 1.1mm;
  }

  blockquote {
    margin: 3.5mm 0;
    padding: 3mm 4mm;
    border-left: 3px solid #93c5fd;
    background: var(--soft);
    color: #334155;
  }

  blockquote p { margin: 0; }

  table {
    width: 100%;
    margin: 3mm 0 5mm;
    border-collapse: collapse;
    font-size: 8.25pt;
    line-height: 1.38;
  }

  thead { display: table-header-group; }

  tr { page-break-inside: avoid; }

  th {
    padding: 2mm 2.2mm;
    border: 1px solid var(--navy);
    background: var(--navy);
    color: #ffffff;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 1.8mm 2.2mm;
    border: 1px solid var(--line);
    vertical-align: top;
  }

  tbody tr:nth-child(even) { background: #f8fafc; }

  code {
    padding: 0.3mm 1.2mm;
    border-radius: 2px;
    background: #eef2f7;
    font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
    font-size: 8.5pt;
  }

  pre {
    margin: 2.5mm 0 4mm;
    padding: 3.5mm 4mm;
    border-radius: 2mm;
    background: #0b1220;
    color: #e2e8f0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    page-break-inside: avoid;
    font-size: 8.2pt;
    line-height: 1.45;
  }

  pre code {
    padding: 0;
    background: transparent;
    color: inherit;
    font-size: inherit;
  }

  a {
    color: #1d4ed8;
    text-decoration: none;
  }

  hr {
    margin: 5mm 0;
    border: 0;
    border-top: 1px solid var(--line);
  }

  strong { color: #0f172a; }

  .toc, main { max-width: 100%; }
</style>
</head>
<body>
  <section class="cover">
    ${coverHtml}
  </section>
  <section class="toc">
    <h2>Contenido</h2>
    <ol>${tocHtml}</ol>
  </section>
  <main>
    ${bodyHtml}
  </main>
</body>
</html>`;

fs.writeFileSync(outputPath, document, 'utf8');
console.log(`HTML generado: ${path.relative(root, outputPath)}`);
