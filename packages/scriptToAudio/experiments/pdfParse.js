import { getTextFromPdf } from '../src/pdfToText.js'
import { parse } from '../src/scriptParsers/fountainParser.js'
// import { __dirname } from '../src/audioUtils.js';

import url from 'url';
import Path from 'path'
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

var pdf_path = "barbershop-wars-1.pdf";
const path = Path.join(__dirname, pdf_path)

const text = await getTextFromPdf(path)

const output = parse(text)

console.log("text", text)
console.log("output", output.dialog)
console.log("output", output.output.tokens)