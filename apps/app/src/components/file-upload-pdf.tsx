'use client';
import { FilePond } from 'react-filepond';
import 'filepond/dist/filepond.min.css';

export default function FileUpload({ onprocessfile, onload, onerror, userId }) {
  return (
    <FilePond
      onprocessfile={onprocessfile}
      // server={{
      //   process: '/api/uploadpdf',
      //   load: '/screen-play',
      //   fetch: null,
      //   revert: null,
      // }}
      server={{
        process: {
          url: '/api/uploadpdf',
          method: 'POST',
          headers: {
            'x-customheader': userId,
          },
          onload: (response) => {
            onload && onload(JSON.parse(response))
          },
          onerror: (response) => {
            onerror && onerror(response)
          }
        }
      }}
    />
  );
}
