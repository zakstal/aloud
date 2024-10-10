import child_process from'child_process'
import Path from 'path';
import url from 'url';
import fs from 'fs'
import { logger } from "@v1/logger";

// const parse = fountain.parse





/**
 * Extract text from pdf using pdftotext external program
 * @param  String  pdf_path absolute path to pdf
 * @param  Object   options  {from: 1, to: 23}
 * @param  Function callback with params (err, output)
 * @return {[type]}            [description]
 */
export function process(pdf_path, options, callback) {
  const __filename = url.fileURLToPath(import.meta.url);
  const __dirname = Path.dirname(__filename);

  var pdf_path = "xpdf-wasm";
  const xpdf_path = Path.join(__dirname, pdf_path)
  fs.readdirSync(__dirname).forEach(file => {
    logger.info(file);
  });
  var args = [];
  if (typeof options !== 'function') {

    for (option in options) {
      //puse all provided options to the comand line arguments
      if (!isNaN(options[option]) && option != 'from' && option != 'to') {
        args.push('-' + option)
        args.push(options[option])
      }
    }

    //following two if statements and the from and to options 
    // should be deprecated - instead of from and to f and l should be used
    if (options && options.from && !isNaN(options.from)) {
      args.push('-f');
      args.push(options.from)
    };
    if (options && options.to && !isNaN(options.to)) {
      args.push('-l');
      args.push(options.to)
    };
  } else {
    callback = options;
  }



  args.push('-layout');
  args.push('-enc');
  args.push('UTF-8');
  args.push(pdf_path);
  args.push('-');

  console.log('args', args)

//   var child = child_process.exec('/Users/zakstallings/projects/script-to-speech/script-to-speech/src/xpdf-extract/lib/xpdf-wasm pdftotext -layout -enc UTF-8 /Users/zakstallings/projects/script-to-speech/script-to-speech/experiments/barbershop-wars-1.pdf -');
  var child = child_process.exec(`${xpdf_path} pdftotext ` + args.join(' '));
  var child = child_process.exec(`./xpdf-wasm pdftotext ` + args.join(' '));
//   var child = child_process.exec('/Users/zakstallings/projects/script-to-speech/script-to-speech/src/xpdf-extract/lib/xpdf-wasm pdftotext ' + args.join(' '));

  var stdout = child.stdout;
  var stderr = child.stderr;
  var output = '';
  var err;

  stdout.setEncoding('utf8');
  stderr.setEncoding('utf8');

  stderr.on('data', function(data) {
    err = true;
    return callback(data, null);
  });

  // buffer the stdout output
  stdout.on('data', function(data) {
    output += data;
  });

  stdout.on('close', function(code) {
    if (err) {
      return;
    }
    if (code) {
      return callback('pdftotext end with code ' + code, null);
    }
    callback(null, output);

  });
};