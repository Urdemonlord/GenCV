import { CVData } from '@cv-generator/types';
import { renderToStaticMarkup } from 'react-dom/server';
import { ModernTemplate } from '../components/cv-preview/templates/modern-template';
import { ClassicTemplate } from '../components/cv-preview/templates/classic-template';
import { CreativeTemplate } from '../components/cv-preview/templates/creative-template';

export function generateHTML(cvData: CVData, template: string): string {
  const TemplateComponent =
    template === 'classic'
      ? ClassicTemplate
      : template === 'creative'
      ? CreativeTemplate
      : ModernTemplate;

  const markup = renderToStaticMarkup(<TemplateComponent data={cvData} />);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    body { font-family: 'Inter', sans-serif; }
    @page { size: A4; margin: 1cm; }
  </style>
</head>
<body>
  <div class="max-w-[21cm] mx-auto">
    ${markup}
  </div>
</body>
</html>`;
}
