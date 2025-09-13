'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@cv-generator/ui';
import { CVData } from '@cv-generator/types';
import { loadFromLocalStorage } from '@cv-generator/utils/browser';
import { Download, ArrowLeft, Share2, FileJson, Upload, FileText } from 'lucide-react';
import Link from 'next/link';
import { CVPreview } from '../components/cv-preview';

export default function ResultPage() {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  useEffect(() => {
    const loadedData = loadFromLocalStorage('cv-data');
    if (loadedData) {
      setCvData(loadedData);
    }
  }, []);

  const handleDownloadPDF = async () => {
    if (!cvData) return;
    
    try {
      // Gunakan API endpoint dari backend terpisah
      console.log('Starting PDF download...');
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

      // Use fetch with explicit blob response type to preserve binary data
      const response = await fetch(`${apiUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
        body: JSON.stringify({ cvData, template: selectedTemplate }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      console.log('Content-Disposition header:', contentDisposition);

      let serverFilename = '';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          serverFilename = filenameMatch[1];
        }
      }
      
      // Get response as blob to preserve binary integrity
      const blob = await response.blob();
      console.log('PDF blob received:', {
        size: blob.size,
        type: blob.type,
        sizeInKB: Math.round(blob.size / 1024)
      });

      const firstBytes = await blob.slice(0, 5).arrayBuffer();
      const signature = new Uint8Array(firstBytes);
      let signatureText = '';
      for (let i = 0; i < signature.length; i++) {
        signatureText += String.fromCharCode(signature[i]);
      }
      console.log('PDF signature check:', signatureText);

      if (signatureText !== '%PDF-' || blob.type !== 'application/pdf') {
        throw new Error(`Invalid PDF format (signature: ${signatureText}, type: ${blob.type})`);
      }
      
      // Validate blob size - should be at least 1KB to avoid empty responses
      if (blob.size < 1000) {
        throw new Error(`PDF file too small (${blob.size} bytes), likely corrupted or error response`);
      }
      
      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const fallbackName = `${cvData.personalInfo?.fullName || 'cv'}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = serverFilename || fallbackName;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('PDF download completed successfully');
      
    } catch (error) {
      console.error('PDF download failed:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownloadDOCX = async () => {
    if (!cvData) return;

    try {
      const response = await fetch(`/api/generate-docx`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
        body: JSON.stringify({ cvData, template: selectedTemplate }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error ${response.status}: ${errorText}`);
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let serverFilename = '';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          serverFilename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const fallbackName = `${cvData.personalInfo?.fullName || 'cv'}.docx`.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = serverFilename || fallbackName;

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('DOCX download completed successfully');
    } catch (error) {
      console.error('DOCX download failed:', error);
      alert(`Failed to download DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExport = () => {
    if (!cvData) return;
    
    const dataStr = JSON.stringify(cvData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `cv-data-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          if (!importedData.personalInfo) {
            throw new Error('Invalid CV data format');
          }
          
          setCvData(importedData);
          localStorage.setItem('cv-data', JSON.stringify(importedData));
        } catch (error) {
          alert('Invalid file format. Please select a valid CV data JSON file.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  const handleShareCV = () => {
    if (navigator.share) {
      navigator.share({
        title: `${cvData?.personalInfo?.fullName || 'My'} CV`,
        text: 'Check out my CV created with AI CV Generator',
        url: window.location.href,
      }).catch(err => console.error('Failed to share:', err));
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => alert('Link copied to clipboard!'))
        .catch(err => console.error('Failed to copy:', err));
    }
  };

  if (!cvData) {
    return (
      <div className="container mx-auto py-16 px-4">
        <Card>
          <CardContent className="py-16 text-center">
            <h2 className="text-2xl font-bold mb-4">No CV data found</h2>
            <p className="mb-8">You haven&apos;t created a CV yet or your data was lost.</p>
            <Link href="/builder" passHref>
              <Button>Create New CV</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your CV is Ready! 🎉</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Choose Template</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              <div
                className={`border p-4 rounded cursor-pointer flex-shrink-0 ${selectedTemplate === 'modern' ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'}`}
                onClick={() => setSelectedTemplate('modern')}
              >
                <div className="h-20 w-32 bg-gradient-to-r from-blue-500 to-purple-500 rounded mb-2"></div>
                <p className="text-center text-sm">Modern</p>
              </div>
              <div
                className={`border p-4 rounded cursor-pointer flex-shrink-0 ${selectedTemplate === 'classic' ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'}`}
                onClick={() => setSelectedTemplate('classic')}
              >
                <div className="h-20 w-32 bg-gray-100 border border-gray-300 rounded mb-2"></div>
                <p className="text-center text-sm">Classic</p>
              </div>
              <div
                className={`border p-4 rounded cursor-pointer flex-shrink-0 ${selectedTemplate === 'creative' ? 'border-primary ring-2 ring-primary/30' : 'border-gray-200'}`}
                onClick={() => setSelectedTemplate('creative')}
              >
                <div className="h-20 w-32 bg-gradient-to-br from-pink-400 to-orange-500 rounded mb-2"></div>
                <p className="text-center text-sm">Creative</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-8">
            <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button onClick={handleDownloadDOCX} className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Download DOCX
            </Button>
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2">
              <FileJson className="w-4 h-4" />
              Export Data
            </Button>
            <Button onClick={handleImport} variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import Data
            </Button>
            <Button onClick={handleShareCV} variant="outline" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Share CV
            </Button>
          </div>

          <CVPreview cvData={cvData} template={selectedTemplate} />
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Link href="/builder" passHref>
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Create New CV
          </Button>
        </Link>
      </div>
    </div>
  );
}
