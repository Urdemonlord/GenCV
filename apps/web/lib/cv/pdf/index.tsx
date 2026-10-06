import { pdf } from '@react-pdf/renderer';
import type { CV } from '@/lib/cv/schema';
import { buildCvView } from '../format';
import type { TemplateId } from '../templates';
import { CvDocument } from './document';
import { registerFonts } from './fonts';

/** Client-side only; import lazily so react-pdf stays out of the initial bundle. */
export async function renderCvPdf(data: CV, template: TemplateId): Promise<Blob> {
  registerFonts();
  return pdf(<CvDocument view={buildCvView(data)} template={template} />).toBlob();
}
