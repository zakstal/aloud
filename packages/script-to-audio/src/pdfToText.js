import pdfUtil from './xpdf-extract';

/**
 * Requires brew install xpdf
 * 
 * @param {String} pdfPath - absolute path to pdf
 * @returns 
 */
export const getTextFromPdf = (pdfPath) => {
    return new Promise((resolve, reject) => {
        pdfUtil.pdfToText(pdfPath, function(err, data) {
            if (err) reject(err);
            resolve(data)
        });
    })
}