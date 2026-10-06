'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@cv-generator/ui';
import { CV } from '@/lib/cv/schema';
import { loadFromLocalStorage, saveToLocalStorage } from '@cv-generator/utils';
import { Download, ArrowLeft, Share2, FileJson, Upload, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { CVPreview } from '../components/cv-preview';
import { useToast } from '@/hooks/use-toast';
import { downloadCvDocx, downloadCvJson, downloadCvPdf } from '@/lib/cv/download';
import { isCvLike, normalizeCV } from '@/lib/cv/normalize';
import { toTemplateId } from '@/lib/cv/templates';

export default function ResultPage() {
  const [cvData, setCvData] = useState<CV | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [exporting, setExporting] = useState<'PDF' | 'DOCX' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadedData = loadFromLocalStorage('cv-data');
    if (loadedData) {
      setCvData(normalizeCV(loadedData));
    }
  }, []);

  const runExport = async (format: 'PDF' | 'DOCX') => {
    if (!cvData) return;
    setExporting(format);
    try {
      const templateId = toTemplateId(selectedTemplate);
      await (format === 'PDF' ? downloadCvPdf(cvData, templateId) : downloadCvDocx(cvData, templateId));
    } catch (error) {
      console.error(`${format} export failed:`, error);
      toast({
        variant: 'destructive',
        title: `Could not create the ${format}`,
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setExporting(null);
    }
  };

  const handleExport = () => {
    if (cvData) downloadCvJson(cvData);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed: unknown = JSON.parse(String(event.target?.result ?? ''));
          if (!isCvLike(parsed)) throw new Error('Invalid CV data format');
          const importedData = normalizeCV(parsed);
          setCvData(importedData);
          saveToLocalStorage('cv-data', importedData);
        } catch {
          toast({
            variant: 'destructive',
            title: 'Invalid file',
            description: 'Please select a CV data JSON file exported from GenCV.',
          });
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
                className={`border p-4 rounded cursor-pointer flex-shrink-0 ${selectedTemplate === 'modern' ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                onClick={() => setSelectedTemplate('modern')}
              >
                <div className="h-20 w-32 bg-white border border-border border-t-4 border-t-blue-700 rounded mb-2"></div>
                <p className="text-center text-sm">Modern</p>
              </div>
              <div
                className={`border p-4 rounded cursor-pointer flex-shrink-0 ${selectedTemplate === 'classic' ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                onClick={() => setSelectedTemplate('classic')}
              >
                <div className="h-20 w-32 bg-white border border-border border-t-2 border-t-gray-900 rounded mb-2"></div>
                <p className="text-center text-sm">Classic</p>
              </div>
              <div
                className={`border p-4 rounded cursor-pointer flex-shrink-0 ${selectedTemplate === 'creative' ? 'border-primary ring-2 ring-primary/30' : 'border-border'}`}
                onClick={() => setSelectedTemplate('creative')}
              >
                <div className="h-20 w-32 bg-white border border-border border-t-[24px] border-t-violet-700 rounded mb-2"></div>
                <p className="text-center text-sm">Creative</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-8">
            <Button onClick={() => runExport('PDF')} disabled={exporting !== null} className="flex items-center gap-2">
              {exporting === 'PDF' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </Button>
            <Button onClick={() => runExport('DOCX')} disabled={exporting !== null} className="flex items-center gap-2">
              {exporting === 'DOCX' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
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
