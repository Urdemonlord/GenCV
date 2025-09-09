'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Sparkles, Download, Upload, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@cv-generator/ui';
import { CVWizard } from '../components/cv-wizard';
import { CVPreview } from '../components/cv-preview';
import { CVData } from '@cv-generator/types';
import { loadFromLocalStorage, saveToLocalStorage, exportToJSON, importFromJSON } from '@cv-generator/utils';
import Link from 'next/link';

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

export default function BuilderPage() {
  const [cvData, setCVData] = useState<CVData>(initialCVData);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Prevent hydration mismatch for theme-dependent rendering
  useEffect(() => {
    setMounted(true);
    // Load data from localStorage only after mounting to prevent hydration mismatch
    const savedData = loadFromLocalStorage('cv-data');
    if (savedData) {
      setCVData(savedData);
    }
  }, []);

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
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="flex items-center space-x-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold gradient-text">AI CV Generator</h1>
            </Link>
          </motion.div>

          <div className="flex items-center space-x-1 sm:space-x-2">
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
              className="text-xs sm:text-sm px-1.5 sm:px-3"
              onClick={() => document.getElementById('import-cv')?.click()}
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs sm:text-sm px-1.5 sm:px-3"
              onClick={handleExport}
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {mounted ? (
                theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
              ) : (
                <div className="h-4 w-4" /> // Placeholder to prevent layout shift
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8 max-w-7xl mx-auto">
          {/* CV Wizard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="glass-card p-4 sm:p-6 rounded-xl">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-semibold">Create Your Professional CV</h2>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
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
            <div className="glass-card p-4 sm:p-6 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Live Preview</h2>
                
                {/* Template Selection */}
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setSelectedTemplate('modern')}
                    className={`px-2 sm:px-3 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                      selectedTemplate === 'modern'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Modern
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('classic')}
                    className={`px-2 sm:px-3 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                      selectedTemplate === 'classic'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Classic
                  </button>
                  <button
                    onClick={() => setSelectedTemplate('creative')}
                    className={`px-2 sm:px-3 py-1 text-xs rounded-md transition-colors whitespace-nowrap ${
                      selectedTemplate === 'creative'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Creative
                  </button>
                </div>
              </div>
              <CVPreview cvData={cvData} template={selectedTemplate} />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}