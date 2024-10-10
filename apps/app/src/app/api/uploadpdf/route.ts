import { NextRequest, NextResponse } from 'next/server'; // To handle the request and response
import { promises as fs } from 'fs'; // To save the file temporarily
import { v4 as uuidv4 } from 'uuid'; // To generate a unique filename
import { createScreenPlay } from "@v1/supabase/mutations";
import { getUser } from "@v1/supabase/queries";
import { parse } from "@v1/script-to-audio/parsers";
import { getTextFromPdf } from "@v1/script-to-audio/pdfToText";

//TODO make sure route is behind auth
export async function POST(req: NextRequest, res: NextResponse) {
  const formData: FormData = await req.formData();
  const session  = await getUser()
  const userId = session.data.user.id
  const uploadedFiles = formData.getAll('filepond');
  let fileName = '';
  let parsedText = '';

  if (uploadedFiles && uploadedFiles.length > 0) {
    const uploadedFile = uploadedFiles[1];

    // Check if uploadedFile is of type File
    // if (uploadedFile instanceof 'File') {
      // Generate a unique filename
      fileName = uuidv4();

      // Convert the uploaded file into a temporary file
      const tempFilePath = `/tmp/${fileName}.pdf`;

      // Convert ArrayBuffer to Buffer
      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

      // Save the buffer as a file
      await fs.writeFile(tempFilePath, fileBuffer);

      parsedText = await getTextFromPdf(tempFilePath)

    } else {
      // console.log('Uploaded file is not in the expected format.');
    }
      
    const parsed = await parse(parsedText)

    const screenRes = await createScreenPlay(
        userId,
        {
            title: parsed?.dialog && parsed.dialog[0]?.text?.toLowerCase() || '', 
            dialog: parsed?.output.tokens,
            type: 'movie', 
            characters: (parsed?.characterGenders?.length ? parsed?.characterGenders : parsed?.characterGenders) || [], 
            total_lines: 0, 
            screen_play_text:  parsed?.output && parsed.output?.html?.script || '',
            screen_play_fountain:  parsed?.output && parsed.output.tokens
        }
    )

  const response = new NextResponse(JSON.stringify({id: screenRes?.id, parsedText }));
  response.headers.set('FileName', fileName);
  return response;
}
