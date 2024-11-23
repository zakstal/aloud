// import pdfUtil from './xpdf-extract';

// /**
//  * Requires brew install xpdf
//  * 
//  * @param {String} pdfPath - absolute path to pdf
//  * @returns 
//  */
// export const getTextFromPdf = (pdfPath) => {
//     return new Promise((resolve, reject) => {
//         pdfUtil.pdfToText(pdfPath, function(err, data) {
//             if (err) reject(err);
//             resolve(data)
//         });
//     })
// }

import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import path from 'path';
import { execSync } from 'child_process';

// // Function to send PDF
// export const getTextFromPdf = async (pdfFilePath) => {
//   // Create a FormData instance
//   const form = new FormData();

//   // Append the PDF file to the form
//   form.append('file', fs.createReadStream(pdfFilePath), path.basename(pdfFilePath));

//   // Make the POST request with node-fetch
//   try {
//     const response = await fetch('https://starfish-app-wsluw.ondigitalocean.app/extract', {
//       mthod: 'POST',
//       body: form,
//       headers: form.getHeaders(), // Important to include form-data headers
//     });

//     // Check response status
//     if (response.ok) {
//       const result = await response.text();
//       console.log('File uploaded successfully:', result);
//       return result

//     } else {
//       console.log('Failed to upload file:', response.statusText);
//     }
//   } catch (error) {
//     console.error('Error uploading file:', error);
//   }
// };


export const getTextFromPdf = (pdfFilePath) => {
  try {
    // Construct the curl command with the file path
    const curlCommand = `curl -X POST -F 'pdf=@${pdfFilePath}' https://starfish-app-wsluw.ondigitalocean.app/extract`;

    // Execute the command using execSync
    const result = execSync(curlCommand, { encoding: 'utf-8' });

    // Output the result of the curl command
    console.log('Response:', result);
    return result
  } catch (error) {
    console.error('Error executing curl command:', error.message);
  }
};