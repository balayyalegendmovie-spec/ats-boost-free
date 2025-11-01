/**
 * Text extraction utilities for PDF and DOCX files
 * Supports extracting text content from resumes in various formats
 */

import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extract text from a PDF file
 * @param {Buffer} fileBuffer - The PDF file buffer
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromPDF(fileBuffer) {
  try {
    const data = await pdfParse(fileBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Extract text from a DOCX file
 * @param {Buffer} fileBuffer - The DOCX file buffer
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractTextFromDOCX(fileBuffer) {
  try {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from DOCX:', error);
    throw new Error(`Failed to extract text from DOCX: ${error.message}`);
  }
}

/**
 * Extract text from a file based on its MIME type
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractText(fileBuffer, mimeType) {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(fileBuffer);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return extractTextFromDOCX(fileBuffer);
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Extract text from a resume file
 * @param {File|Buffer} file - The file object or buffer
 * @param {string} [mimeType] - Optional MIME type (will be inferred from file if not provided)
 * @returns {Promise<string>} - Extracted text content
 */
export async function extractResumeText(file, mimeType) {
  try {
    let buffer;
    let type = mimeType;

    // Handle File object (from browser)
    if (file instanceof File || (file && file.arrayBuffer)) {
      buffer = Buffer.from(await file.arrayBuffer());
      type = type || file.type;
    } else if (Buffer.isBuffer(file)) {
      buffer = file;
    } else {
      throw new Error('Invalid file input');
    }

    if (!type) {
      throw new Error('MIME type is required');
    }

    return await extractText(buffer, type);
  } catch (error) {
    console.error('Error extracting resume text:', error);
    throw error;
  }
}
