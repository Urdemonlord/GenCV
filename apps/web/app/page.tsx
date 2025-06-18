'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Download, Upload, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@cv-generator/ui';
import { CVWizard } from './components/cv-wizard';
import { CVPreview } from './components/cv-preview';
import { CVData } from '@cv-generator/types';
import { loadFromLocalStorage, saveToLocalStorage, exportToJSON, importFromJSON } from '@cv-generator/utils';

const initialCVData: CVData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    website: '',
  },
  professionalSummary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  experienceLevel: 'professional',
};

export default function HomePage() {
  const [cvData, setCVData] = useState<CVData>(() => {
    if (typeof window !== 'undefined') {
      return loadFromLocalStorage('cv-data') || initialCVData;
    }
    return initialCVData;
  });
  
  const [currentStep, setCurrentStep] = useState(0);
  const { theme, setTheme } = useTheme();

  const handleDataChange = (newData: CVData) => {
    setCVData(newData);
    saveToLocalStorage('cv-data', newData);
  };

  const handleExport = () => {
    const jsonString = exportToJSON(cvData);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cvData.personalInfo.fullName || 'CV'}-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const importedData = importFromJSON(content);
        if (importedData) {
          handleDataChange(importedData);
        } else {
          alert('Invalid JSON file format');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-card border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text">AI CV Generator</h1>
          </motion.div>

          <div className="flex items-center space-x-2">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-cv"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('import-cv')?.click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* CV Wizard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="glass-card p-6 rounded-xl">
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Create Your Professional CV</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Build a stunning resume with AI-powered content enhancement. Our intelligent system helps you craft compelling descriptions and optimize your CV for success.
              </p>
              
              <CVWizard
                cvData={cvData}
                onDataChange={handleDataChange}
                currentStep={currentStep}
                onStepChange={setCurrentStep}
              />
            </div>
          </motion.div>

          {/* CV Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="glass-card p-6 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
              <CVPreview cvData={cvData} />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}