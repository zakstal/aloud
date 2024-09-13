import { NextRequest, NextResponse } from 'next/server'; // To handle the request and response
import { promises as fs } from 'fs'; // To save the file temporarily
import { v4 as uuidv4 } from 'uuid'; // To generate a unique filename
import PDFParser from 'pdf2json'; // To parse the pdf
import { createScreenPlay } from "@v1/supabase/mutations";
// import { getServerSession } from "next-auth/next"
// import { authOptions } from "./auth/[...nextauth]"
import { consoleIntegration } from '@sentry/nextjs';

  

export async function POST(req: NextRequest, res: NextResponse) {
  // const session = await getServerSession(req, res)
  // console.log('session-------', session)
  const formData: FormData = await req.formData();
  const uploadedFiles = formData.getAll('filepond');
  let fileName = '';
  let parsedText = '';

  // TODO fix this
  const userId = req.headers.get("x-customheader") as string;
  console.log("userId--------", userId)
  if (uploadedFiles && uploadedFiles.length > 0) {
    const uploadedFile = uploadedFiles[1];
    console.log('Uploaded file:', uploadedFile);

    // Check if uploadedFile is of type File
    console.log("here 1")
    // if (uploadedFile instanceof 'File') {
      console.log("here 2")
      // Generate a unique filename
      fileName = uuidv4();

      // Convert the uploaded file into a temporary file
      const tempFilePath = `/tmp/${fileName}.pdf`;

      // Convert ArrayBuffer to Buffer
      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

      // Save the buffer as a file
      await fs.writeFile(tempFilePath, fileBuffer);

      // Parse the pdf using pdf2json. See pdf2json docs for more info.

      // The reason I am bypassing type checks is because
      // the default type definitions for pdf2json in the npm install
      // do not allow for any constructor arguments.
      // You can either modify the type definitions or bypass the type checks.
      // I chose to bypass the type checks.
      const pdfParser = new (PDFParser as any)(null, 1);

      // See pdf2json docs for more info on how the below works.
      const res = await new Promise((resolve, reject) => {

        pdfParser.on('pdfParser_dataError', (errData: any) => {
            reject(errData.parserError)
        });
        
        pdfParser.on('pdfParser_dataReady', () => {
          parsedText = (pdfParser as any)?.getRawTextContent()
          resolve(parsedText)
        });

        pdfParser.loadPDF(tempFilePath);
      })

      console.log('here-----------')


    } else {
      console.log('Uploaded file is not in the expected format.');
    }
  // } else {
  //   console.log('No files found.');
  // }

    const screenRes = await createScreenPlay(
      userId,
    {
      title: '', 
      type: 'movie', 
      characters: [], 
      total_lines: 0, 
      screen_play_text: parsedText
    }
  )

  console.log("screenRes-------", screenRes)

  console.log("parsedText----------", parsedText)
  const response = new NextResponse(JSON.stringify({id: screenRes?.id, parsedText }));
  response.headers.set('FileName', fileName);
  return response;
}
