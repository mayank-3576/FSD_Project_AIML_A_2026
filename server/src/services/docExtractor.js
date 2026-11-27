import { createRequire } from 'module';
import path from 'path';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts plain text from an uploaded buffer (PDF, DOCX, or TXT)
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {Promise<{ text: string, wordCount: number, format: string }>}
 */
export async function extractDocumentText(buffer, originalName = '', mimeType = '') {
  const ext = path.extname(originalName).toLowerCase();
  let extracted = '';
  let format = 'text';

  try {
    if (ext === '.pdf' || mimeType.includes('pdf')) {
      format = 'pdf';
      const pdfData = await pdfParse(buffer);
      extracted = pdfData.text || '';
    } else if (ext === '.docx' || mimeType.includes('wordprocessingml') || mimeType.includes('docx')) {
      format = 'docx';
      const result = await mammoth.extractRawText({ buffer });
      extracted = result.value || '';
    } else {
      // Default to UTF-8 text (TXT / markdown / etc)
      format = 'txt';
      extracted = buffer.toString('utf8');
    }
  } catch (err) {
    console.error('Document extraction error:', err);
    throw new Error(`Failed to parse ${format.toUpperCase()} document: ${err.message}`);
  }

  // Clean and normalize whitespace
  const cleaned = extracted
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const words = cleaned ? cleaned.split(/\s+/).filter(Boolean) : [];

  return {
    text: cleaned,
    wordCount: words.length,
    format,
  };
}

export default {
  extractDocumentText,
};
