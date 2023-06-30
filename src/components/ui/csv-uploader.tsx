import React, { ChangeEvent } from 'react';
import { parse } from 'papaparse';

interface CSVUploaderProps<T> {
  bulkAddData: (data: T[]) => void;
}

const CSVUploader = <T,>({ bulkAddData }: CSVUploaderProps<T>): JSX.Element => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) 
      parse<T>(files[0], {
        header: true,
        complete: (results) => {
          if (results.errors.length === 0) {
            bulkAddData(results.data);
          } else {
            console.error(results.errors);
          }
        },
      });
  };

  return (
    <>
      <input type="file" accept=".csv" onChange={handleChange} />
    </>
  );
};

export default CSVUploader;