import type { CV } from '@/lib/cv/schema';
import { cvFileBaseName } from './format';
import type { TemplateId } from './templates';

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking synchronously can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadCvPdf(data: CV, template: TemplateId) {
  const { renderCvPdf } = await import('./pdf');
  saveBlob(await renderCvPdf(data, template), `${cvFileBaseName(data)}.pdf`);
}

export async function downloadCvDocx(data: CV, template: TemplateId) {
  const { renderCvDocx } = await import('./docx');
  saveBlob(await renderCvDocx(data, template), `${cvFileBaseName(data)}.docx`);
}

export function downloadCvJson(data: CV) {
  saveBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `${cvFileBaseName(data)}-data.json`);
}
