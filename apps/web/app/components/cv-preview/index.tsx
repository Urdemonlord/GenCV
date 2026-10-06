'use client';

import { useState } from 'react';
import { Download, Eye, FileText, Loader2 } from 'lucide-react';
import { CVData } from '@cv-generator/types';
import { Button, Card, CardContent, Progress } from '@cv-generator/ui';
import { calculateCVScore } from '@cv-generator/utils';
import { useToast } from '@/hooks/use-toast';
import { downloadCvPdf } from '@/lib/cv/download';
import { buildCvView } from '@/lib/cv/format';
import { toTemplateId } from '@/lib/cv/templates';
import { PdfPreview } from './pdf-preview';

interface CVPreviewProps {
  cvData: CVData;
  template?: string;
}

export function CVPreview({ cvData, template }: CVPreviewProps) {
  const templateId = toTemplateId(template);
  const [showScore, setShowScore] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();
  const cvScore = calculateCVScore(cvData);
  // Preview anything the user has entered, not only CVs that already have a name.
  const view = buildCvView(cvData);
  const hasContent = Boolean(
    view.name || view.summary || view.experience.length || view.education.length || view.skills.length || view.projects.length
  );

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadCvPdf(cvData, templateId);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Could not create the PDF',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* CV Score Panel */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium">CV Completeness Score</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowScore(!showScore)}>
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
                      <span>{Math.round(score)}%</span>
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
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Preview
            </h3>
            <Button onClick={handleDownload} size="sm" disabled={!hasContent || downloading}>
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download PDF
            </Button>
          </div>

          {hasContent ? (
            <PdfPreview data={cvData} template={templateId} />
          ) : (
            <div className="text-center text-gray-500 py-12 bg-white rounded border">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start filling out your information to see the preview</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
