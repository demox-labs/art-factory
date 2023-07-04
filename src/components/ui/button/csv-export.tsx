import React from 'react';
import Papa from 'papaparse';
import Button from './button';

interface Props<T> {
  data: T[];
  filename?: string;
}

const CSVExportButton = <T,>({ data, filename }: Props<T>) => {
  const handleExport = (): void => {
    const csv = Papa.unparse(data);
    const csvData = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(csvData);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || 'export.csv');
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      onClick={handleExport}
      className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7">
        Export CSV
    </Button>
  );

};

export default CSVExportButton;