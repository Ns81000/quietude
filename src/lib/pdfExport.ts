/**
 * PDF Export utilities for Quietude
 * Creates beautifully formatted PDFs using browser print functionality
 * Uses the current site theme colors
 */

import type { Note } from '@/store/notes';

/**
 * Get computed CSS variable value and convert HSL to hex
 */
function getCSSVariable(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) return '';
  
  // Parse HSL values like "30 50% 97%"
  const parts = value.split(' ').map(p => p.replace('%', ''));
  if (parts.length >= 3) {
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    return hslToHex(h, s, l);
  }
  return value;
}

/**
 * Convert HSL to Hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Get current theme colors
 */
function getThemeColors() {
  return {
    bg: getCSSVariable('--bg') || '#faf8f5',
    bg2: getCSSVariable('--bg-2') || '#f0ebe3',
    surface: getCSSVariable('--surface') || '#ffffff',
    border: getCSSVariable('--border') || '#ddd5c8',
    text: getCSSVariable('--text') || '#2d2418',
    textSoft: getCSSVariable('--text-soft') || '#6b5d4d',
    textMuted: getCSSVariable('--text-muted') || '#a89e8f',
    accent: getCSSVariable('--accent') || '#c56a3d',
    accentText: getCSSVariable('--accent-text') || '#ffffff',
  };
}

/**
 * Generate PDF-ready HTML for a note
 */
function generateNoteHTML(note: Note): string {
  const formattedDate = new Date(note.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get current theme colors
  const colors = getThemeColors();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${note.topic_title} - Quietude Notes</title>
  <style>
    @page {
      margin: 1in;
      size: A4;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.7;
      color: ${colors.text};
      background: ${colors.surface};
      padding: 0.5in;
    }
    
    .header {
      border-bottom: 2px solid ${colors.accent};
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    .subject-badge {
      display: inline-block;
      background: ${colors.accent};
      color: ${colors.accentText};
      font-size: 9pt;
      font-weight: 600;
      padding: 4px 14px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .date {
      font-size: 9pt;
      color: ${colors.textMuted};
      font-style: italic;
    }
    
    .title {
      font-family: 'Georgia', serif;
      font-size: 24pt;
      font-weight: 700;
      color: ${colors.text};
      margin: 0;
      line-height: 1.3;
    }
    
    .content {
      margin-top: 20px;
    }
    
    .content h1 {
      font-size: 18pt;
      font-weight: 700;
      color: ${colors.accent};
      margin-top: 30px;
      margin-bottom: 14px;
      padding-bottom: 6px;
      border-bottom: 1px solid ${colors.border};
    }
    
    .content h2 {
      font-size: 15pt;
      font-weight: 600;
      color: ${colors.accent};
      margin-top: 24px;
      margin-bottom: 12px;
    }
    
    .content h3 {
      font-size: 12pt;
      font-weight: 600;
      color: ${colors.textSoft};
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .content p {
      margin-bottom: 14px;
      text-align: justify;
    }
    
    .content ul,
    .content ol {
      margin-bottom: 14px;
      padding-left: 28px;
    }
    
    .content li {
      margin-bottom: 6px;
    }
    
    .content strong {
      font-weight: 700;
      color: ${colors.text};
    }
    
    .content em {
      font-style: italic;
    }
    
    .content blockquote {
      border-left: 3px solid ${colors.accent};
      padding-left: 20px;
      margin: 20px 0;
      font-style: italic;
      color: ${colors.textSoft};
      background: ${colors.bg2};
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid ${colors.border};
      text-align: center;
      font-size: 8pt;
      color: ${colors.textMuted};
    }
    
    .footer .brand {
      font-weight: 600;
      color: ${colors.accent};
    }
    
    /* Page break handling */
    h1, h2, h3 {
      page-break-after: avoid;
    }
    
    p, li {
      orphans: 3;
      widows: 3;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-meta">
      <span class="subject-badge">${escapeHtml(note.subject)}</span>
      <span class="date">${formattedDate}</span>
    </div>
    <h1 class="title">${escapeHtml(note.topic_title)}</h1>
  </header>
  
  <main class="content">
    ${note.content_html}
  </main>
  
  <footer class="footer">
    <p>Generated with <span class="brand">Quietude</span> — Your Personal Learning Companion</p>
  </footer>
</body>
</html>
  `.trim();
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Export a note to PDF using browser print dialog
 */
export function exportNoteToPDF(note: Note): void {
  const html = generateNoteHTML(note);
  
  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  
  doc.open();
  doc.write(html);
  doc.close();
  
  let printCalled = false;
  
  const doPrint = () => {
    if (printCalled) return;
    printCalled = true;
    iframe.contentWindow?.print();
    // Clean up after print dialog closes
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };
  
  // Wait for content to load, then print
  iframe.contentWindow?.addEventListener('load', () => {
    // Small delay to ensure styles are applied
    setTimeout(doPrint, 250);
  });
  
  // Fallback for immediate load (some browsers don't fire load event)
  setTimeout(() => {
    if (document.body.contains(iframe) && !printCalled) {
      doPrint();
    }
  }, 500);
}

/**
 * Export multiple notes as a combined PDF
 */
export function exportNotesBulkToPDF(notes: Note[], subject?: string): void {
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  const title = subject 
    ? `${subject} Study Notes` 
    : 'Study Notes Collection';

  // Get current theme colors
  const colors = getThemeColors();
  
  const notesContent = sortedNotes.map((note, index) => `
    <article class="note-article ${index > 0 ? 'page-break' : ''}">
      <div class="note-header">
        <span class="note-badge">${escapeHtml(note.subject)}</span>
        <span class="note-date">${new Date(note.created_at).toLocaleDateString()}</span>
      </div>
      <h2 class="note-title">${escapeHtml(note.topic_title)}</h2>
      <div class="note-content">
        ${note.content_html}
      </div>
    </article>
  `).join('\n');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Quietude</title>
  <style>
    @page {
      margin: 0.75in;
      size: A4;
    }
    
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 10pt;
      line-height: 1.6;
      color: ${colors.text};
      background: ${colors.surface};
    }
    
    .cover {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
    }
    
    .cover-title {
      font-size: 28pt;
      font-weight: 700;
      color: ${colors.accent};
      margin-bottom: 16px;
    }
    
    .cover-subtitle {
      font-size: 12pt;
      color: ${colors.textSoft};
      margin-bottom: 40px;
    }
    
    .cover-meta {
      font-size: 10pt;
      color: ${colors.textMuted};
    }
    
    .note-article {
      padding: 20px 0;
    }
    
    .note-article.page-break {
      page-break-before: always;
    }
    
    .note-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    
    .note-badge {
      display: inline-block;
      background: ${colors.accent};
      color: ${colors.accentText};
      font-size: 8pt;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 12px;
      text-transform: uppercase;
    }
    
    .note-date {
      font-size: 9pt;
      color: ${colors.textMuted};
    }
    
    .note-title {
      font-size: 18pt;
      font-weight: 700;
      color: ${colors.text};
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid ${colors.accent};
    }
    
    .note-content h1 {
      font-size: 14pt;
      font-weight: 700;
      color: ${colors.accent};
      margin-top: 20px;
      margin-bottom: 10px;
    }
    
    .note-content h2 {
      font-size: 12pt;
      font-weight: 600;
      color: ${colors.accent};
      margin-top: 16px;
      margin-bottom: 8px;
    }
    
    .note-content h3 {
      font-size: 11pt;
      font-weight: 600;
      color: ${colors.textSoft};
      margin-top: 14px;
      margin-bottom: 6px;
    }
    
    .note-content p {
      margin-bottom: 10px;
      text-align: justify;
    }
    
    .note-content ul,
    .note-content ol {
      margin-bottom: 10px;
      padding-left: 24px;
    }
    
    .note-content li {
      margin-bottom: 4px;
    }
    
    .note-content blockquote {
      border-left: 3px solid ${colors.accent};
      padding-left: 16px;
      margin: 14px 0;
      font-style: italic;
      color: ${colors.textSoft};
      background: ${colors.bg2};
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
    }
    
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 8pt;
      color: ${colors.textMuted};
    }
    
    .footer .brand {
      color: ${colors.accent};
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="cover">
    <h1 class="cover-title">${escapeHtml(title)}</h1>
    <p class="cover-subtitle">${sortedNotes.length} Notes Compiled</p>
    <p class="cover-meta">Generated on ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</p>
  </div>
  
  ${notesContent}
  
  <footer class="footer">
    <p>Generated with <span class="brand">Quietude</span> — Your Personal Learning Companion</p>
  </footer>
</body>
</html>
  `.trim();
  
  // Create a hidden iframe for printing
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }
  
  doc.open();
  doc.write(html);
  doc.close();
  
  // Wait for content to load, then print
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  }, 500);
}
