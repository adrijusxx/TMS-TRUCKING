/**
 * PDF Merge Service
 *
 * Merges multiple PDF buffers and/or images (PNG/JPG) into a single PDF document.
 * Uses pdf-lib for merging. Used by InvoiceDocumentBuilder to create combined
 * invoice packages (Invoice + Rate Con + POD + BOL).
 */

import { PDFDocument, PageSizes } from 'pdf-lib';

export interface DocumentInput {
  buffer: Uint8Array;
  mimeType: string; // 'application/pdf' | 'image/png' | 'image/jpeg'
  label: string; // For logging/ordering
}

export class PdfMergeService {
  /**
   * Merge multiple documents (PDFs and images) into a single PDF.
   * Documents are added in the order provided.
   */
  static async merge(documents: DocumentInput[]): Promise<Uint8Array> {
    if (documents.length === 0) {
      throw new Error('No documents provided for merging');
    }

    // If single PDF, return as-is
    if (documents.length === 1 && documents[0].mimeType === 'application/pdf') {
      return documents[0].buffer;
    }

    const mergedPdf = await PDFDocument.create();

    for (const doc of documents) {
      try {
        if (doc.mimeType === 'application/pdf') {
          await this.appendPdf(mergedPdf, doc.buffer);
        } else if (doc.mimeType === 'image/png' || doc.mimeType === 'image/jpeg') {
          await this.appendImage(mergedPdf, doc.buffer, doc.mimeType);
        } else {
          console.warn(`[PdfMergeService] Skipping unsupported type: ${doc.mimeType} (${doc.label})`);
        }
      } catch (error) {
        console.error(`[PdfMergeService] Failed to merge document "${doc.label}":`, error);
        // Add an error page instead of failing the entire merge
        await this.appendErrorPage(mergedPdf, doc.label, error);
      }
    }

    return mergedPdf.save();
  }

  /**
   * Copy all pages from a source PDF into the target PDF.
   */
  private static async appendPdf(target: PDFDocument, sourceBuffer: Uint8Array): Promise<void> {
    const sourcePdf = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
    const pageIndices = sourcePdf.getPageIndices();
    const copiedPages = await target.copyPages(sourcePdf, pageIndices);
    for (const page of copiedPages) {
      target.addPage(page);
    }
  }

  /**
   * Embed an image (PNG or JPG) as a new page in the PDF.
   * The page is sized to fit the image within letter-size bounds.
   */
  private static async appendImage(
    target: PDFDocument,
    imageBuffer: Uint8Array,
    mimeType: string
  ): Promise<void> {
    const image =
      mimeType === 'image/png'
        ? await target.embedPng(imageBuffer)
        : await target.embedJpg(imageBuffer);

    const imgWidth = image.width;
    const imgHeight = image.height;

    // Scale to fit within letter-size page with margins
    const maxWidth = PageSizes.Letter[0] - 40; // 20px margin each side
    const maxHeight = PageSizes.Letter[1] - 40;
    const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);

    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    // Page sized to letter or image size (whichever is larger)
    const pageWidth = Math.max(scaledWidth + 40, PageSizes.Letter[0]);
    const pageHeight = Math.max(scaledHeight + 40, PageSizes.Letter[1]);

    const page = target.addPage([pageWidth, pageHeight]);

    // Center the image on the page
    const x = (pageWidth - scaledWidth) / 2;
    const y = (pageHeight - scaledHeight) / 2;

    page.drawImage(image, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  /**
   * Add a placeholder error page when a document fails to merge.
   */
  private static async appendErrorPage(
    target: PDFDocument,
    label: string,
    error: unknown
  ): Promise<void> {
    const page = target.addPage(PageSizes.Letter);
    const { height } = page.getSize();
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';

    page.drawText(`Failed to include: ${label}`, {
      x: 50,
      y: height - 100,
      size: 14,
    });
    page.drawText(`Error: ${errorMsg}`, {
      x: 50,
      y: height - 130,
      size: 10,
    });
  }
}
