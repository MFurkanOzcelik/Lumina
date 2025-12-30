import React from 'react';

export const PDFViewer = ({ file }) => {
  const fileURL = `file://${file.path}`;

  return (
    <iframe
      src={fileURL}
      title="PDF Viewer"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
};

export default PDFViewer;
