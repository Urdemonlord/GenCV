import { Card, CardContent, CardHeader, CardTitle } from '@cv-generator/ui';

const faqs = [
  {
    question: 'Apakah CV saya ramah ATS?',
    answer:
      'Ya. Template kami dirancang dengan struktur yang mudah dibaca ATS, termasuk penggunaan heading yang jelas dan format yang konsisten.',
  },
  {
    question: 'Format ekspor apa saja yang tersedia?',
    answer:
      'Anda dapat mengekspor CV ke PDF untuk pengiriman lamaran dan ke DOCX untuk pengeditan lanjutan.',
  },
  {
    question: 'Bagaimana dengan privasi data saya?',
    answer:
      'Data Anda disimpan dengan aman dan tidak dibagikan tanpa izin. Anda tetap memiliki kontrol penuh atas informasi yang dimasukkan.',
  },
  {
    question: 'Apakah saya wajib menggunakan AI?',
    answer:
      'Tidak. AI bersifat opsional sebagai bantuan penyusunan. Anda tetap dapat menulis atau mengedit semua konten secara manual.',
  },
  {
    question: 'Apakah saya bisa mengubah hasil setelah ekspor?',
    answer:
      'Bisa. Simpan CV Anda dalam format DOCX untuk pengeditan lebih lanjut, lalu ekspor ulang kapan saja.',
  },
];

export default function FAQ() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center">
          Pertanyaan yang Sering Diajukan
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardHeader>
                <CardTitle className="text-xl">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {faq.answer}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
