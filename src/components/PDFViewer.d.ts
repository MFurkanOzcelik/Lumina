import type React from 'react';

export interface PDFViewerProps {
  file: { path: string };
}

export const PDFViewer: React.FC<PDFViewerProps>;
export default PDFViewer;
