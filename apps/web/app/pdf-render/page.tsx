'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CVData } from '@cv-generator/types';
import { CVPreview } from '../components/cv-preview';

export default function PDFRenderPage() {
  const searchParams = useSearchParams();
  const [cvData, setCvData] = useState<CVData | null>(null);
  const template = searchParams.get('template') || 'modern';

  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(dataParam)) as CVData;
        setCvData(parsedData);
      } catch (error) {
        console.error('Failed to parse CV data:', error);
      }
    }
  }, [searchParams]);

  if (!cvData) {
    return <div className="p-8">Loading CV data...</div>;
  }

  return (
    <div className="p-8 max-w-[21cm] mx-auto bg-white">
      <CVPreview cvData={cvData} template={template} />
    </div>
  );
}
