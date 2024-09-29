import React, { useState } from 'react';
import { getDocument } from 'pdfjs-dist/build/pdf.min.mjs';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs';
import { FilePond, FileStatus } from 'react-filepond';
import 'filepond/dist/filepond.min.css';

// Set the workerSrc globally
globalThis.pdfjsLib = { GlobalWorkerOptions: { workerSrc: pdfjsWorker } };

function PDFLocalUplaod({
    startScreenPlay
}) {
    console.log('FileStatus', FileStatus)
    const [files, setFiles] = useState([]);
  const handleFileChange = (file) => {
    // console.log('files', event)
    // const firstFile = event[0]
    // const file = firstFile && firstFile.file;

    console.log('fiel----', file)
    // const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();

      reader.onload = function () {
        const typedArray = new Uint8Array(this.result);

        getDocument(typedArray).promise.then(function (pdfDoc) {
          const numPages = pdfDoc.numPages;
          const textPromises = [];

          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            textPromises.push(
              pdfDoc.getPage(pageNum).then(function (page) {
                return page.getTextContent().then(function (textContent) {
                  return textContent.items
                    .map((item) => {
                      // Check if the item has an EOL and append a newline character
                      return item.str + (item.hasEOL ? '\n' : '');
                    })
                    .join('');
                });
              })
            );
          }

          Promise.all(textPromises).then(function (pagesText) {
            const screenPlayText = btoa(unescape(encodeURIComponent(pagesText.join('\n'))))
            // const screenPlayText = btoa(pagesText.join('\n'))
            startScreenPlay({ screenPlayText })
          });
        });
      };

      reader.readAsArrayBuffer(file);
    } else {
      alert('Please upload a valid PDF file.');
    }
  };

  return (
    // <div className="PDFLocalUplaod">
    //     <label for="pdfFile">
    //         <h1>Upload PDF and Extract Text</h1>
    //         <input type="file" id="pdfFile" onDrop={handleFileChange} onChange={handleFileChange} accept="application/pdf" className="invisible"/>
    //     </label>
    // </div>
    <FilePond
        // onupdatefiles={setFiles}
        // onupdatefiles={handleFileChange}
        // instantUpload={false}
        files={files}
        onupdatefiles={setFiles}  // Update local files array
        allowMultiple={true}
        maxFiles={5}
        name="files"
        labelIdle='Drag & Drop your files or <span class="filepond--label-action">Browse</span>'
        
        server={{
            process: (fieldName, file, metadata, load, error, progress, abort) => {
                console.log('processing', file)
              // Simulate an uploading process with progress
              const simulateProgress = (bytesUploaded) => {
                setTimeout(() => {
                  const totalBytes = file.size;
                  const newBytesUploaded = Math.min(bytesUploaded + totalBytes / 10, totalBytes);
                  progress(true, newBytesUploaded, totalBytes);
    
                  if (newBytesUploaded < totalBytes) {
                    simulateProgress(newBytesUploaded);
                  } else {
                    load(file.name); // Finish the "upload" successfully
                  }
                }, 300);
              };
    
              // Start the progress simulation
              simulateProgress(0);
              handleFileChange(file)
              // Provide an abort method
              return {
                abort: () => {
                  abort();
                },
              };
            },
            revert: null  // No need to handle reverting
          }}
  />
  );
}

export default PDFLocalUplaod;
