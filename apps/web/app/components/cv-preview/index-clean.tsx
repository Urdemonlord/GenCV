'use client';

import { useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { CVData } from '@cv-generator/types';
import { Button, Card, CardContent, Progress } from '@cv-generator/ui';
import { calculateCVScore } from '@cv-generator/utils';
import { ModernTemplate } from './templates/modern-template';
import { ClassicTemplate } from './templates/classic-template';
import { CreativeTemplate } from './templates/creative-template';

interface CVPreviewProps {
  cvData: CVData;
  template?: string;
}

export function CVPreview({ cvData, template = 'modern' }: CVPreviewProps) {
  const [showScore, setShowScore] = useState(false);
  const cvScore = calculateCVScore(cvData);
  
  const handleDownload = async () => {
    try {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://gencvbackend-web.vercel.app').replace(/\/$/, '');

      console.log('Starting PDF download from CV Preview...');

      const response = await fetch(`${apiUrl}/api/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          cvData,
          template: template === 'preview' ? 'modern' : template
        }),
      });
      
      console.log('PDF Response status:', response.status);
      console.log('PDF Response headers:', Object.fromEntries(response.headers.entries()));
      
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
      
      const blob = await response.blob();
      console.log('PDF blob received:', {
        size: blob.size,
        type: blob.type,
        sizeInKB: Math.round(blob.size / 1024)
      });
      
      // Check for PDF signature
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
      
      if (blob.size < 1000) {
        throw new Error(`PDF file too small (${blob.size} bytes), likely corrupted`);
      }
      
      const url = URL.createObjectURL(blob);
      const fallbackName = `${cvData.personalInfo?.fullName || 'cv'}.pdf`.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = serverFilename || fallbackName;
      
      // Debug option: Uncomment to open PDF in new tab for verification
      // window.open(url, '_blank');
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up the DOM element only - URL will be cleaned up automatically when page closes
      setTimeout(() => {
        document.body.removeChild(link);
        console.log('PDF download completed - DOM cleanup done');
      }, 100);
      
      console.log('PDF download completed successfully');
      
    } catch (error) {
      console.error('PDF download failed:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // If we're just rendering a template (for PDF), render the template directly
  if (template && template !== 'preview') {
    const TemplateComponent = template === 'classic' ? ClassicTemplate : 
                             template === 'creative' ? CreativeTemplate : 
                             ModernTemplate;
    
    return <TemplateComponent data={cvData} />;
  }

  return (
    <div className="space-y-4">
      {/* CV Score Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">CV Completeness Score</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScore(!showScore)}
            >
              {showScore ? 'Hide Details' : 'View Details'}
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Score</span>
              <span className="font-medium">{cvScore.overall}%</span>
            </div>
            <Progress value={cvScore.overall} className="h-2" />
          </div>

          {showScore && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {Object.entries(cvScore.sections).map(([section, score]) => (
                  <div key={section} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="capitalize">{section.replace(/([A-Z])/g, ' $1')}</span>
                      <span>{score}%</span>
                    </div>
                    <Progress value={score} className="h-1" />
                  </div>
                ))}
              </div>
              
              {cvScore.suggestions.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded text-xs">
                  <h4 className="font-medium mb-1">Suggestions:</h4>
                  <ul className="space-y-0.5">
                    {cvScore.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CV Preview */}
      <Card className="min-h-[600px]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </h3>
            <Button onClick={handleDownload} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {/* CV Content - Using Template Component for consistency */}
          <div className="rounded border">
            {!cvData.personalInfo.fullName ? (
              <div className="text-center text-gray-500 py-12 bg-white rounded">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start filling out your information to see the preview</p>
              </div>
            ) : (
              <ModernTemplate data={cvData} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
