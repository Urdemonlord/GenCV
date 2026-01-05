import { Card, CardHeader, CardTitle, CardDescription } from '@cv-generator/ui';
import { Sparkles, LayoutTemplate, FileCheck2, Download } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'Penulisan Dibantu AI',
    description:
      'Ubah deskripsi menjadi lebih kuat dan relevan dengan posisi yang kamu incar.',
  },
  {
    icon: LayoutTemplate,
    title: 'Template Profesional',
    description:
      'Pilih desain modern yang mudah disesuaikan tanpa mengorbankan keterbacaan.',
  },
  {
    icon: FileCheck2,
    title: 'ATS-Friendly',
    description:
      'Struktur rapi agar CV mudah dibaca sistem rekrutmen dan rekruter.',
  },
  {
    icon: Download,
    title: 'Ekspor Sekali Klik',
    description:
      'Unduh CV siap kirim dalam format yang dibutuhkan untuk melamar.',
  },
];

export default function Features() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center">Fitur Utama</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <feature.icon className="w-10 h-10 mx-auto text-purple-500" />
                <CardTitle className="mt-4 text-xl">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
