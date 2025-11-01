import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

/**
 * Export content to PDF using jsPDF
 * @param {string} content - The text content to export
 * @param {string} filename - The name of the file (without extension)
 */
export const exportToPDF = (content, filename = 'document') => {
  try {
    const doc = new jsPDF();
    
    // Split content into lines and add to PDF
    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 15, 15);
    
    // Save the PDF
    doc.save(`${filename}.pdf`);
    
    return { success: true, message: 'PDF exported successfully' };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, message: 'Failed to export PDF', error };
  }
};

/**
 * Export content to DOCX using docx and file-saver
 * @param {string} content - The text content to export
 * @param {string} filename - The name of the file (without extension)
 */
export const exportToDOCX = async (content, filename = 'document') => {
  try {
    // Split content into paragraphs
    const paragraphs = content.split('\n').map(
      line => new Paragraph({
        children: [new TextRun(line)],
      })
    );
    
    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragraphs,
      }],
    });
    
    // Generate and save DOCX file
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
    
    return { success: true, message: 'DOCX exported successfully' };
  } catch (error) {
    console.error('Error exporting to DOCX:', error);
    return { success: false, message: 'Failed to export DOCX', error };
  }
};

/**
 * Export content in the specified format
 * @param {string} content - The text content to export
 * @param {string} format - The format to export ('pdf' or 'docx')
 * @param {string} filename - The name of the file (without extension)
 */
export const exportFile = async (content, format, filename = 'document') => {
  if (format === 'pdf') {
    return exportToPDF(content, filename);
  } else if (format === 'docx') {
    return await exportToDOCX(content, filename);
  } else {
    return { success: false, message: `Unsupported format: ${format}` };
  }
};
