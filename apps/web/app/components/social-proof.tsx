import { Card, CardHeader, CardTitle, CardDescription } from '@cv-generator/ui';

const proofPoints = [
  {
    title: '10k+ CV dibuat',
    description: 'Digunakan oleh pencari kerja di lebih dari 30 industri.',
  },
  {
    title: '95% lolos ATS',
    description: 'Format CV dioptimalkan agar mudah dibaca sistem rekrutmen.',
  },
  {
    title: '4.9/5 rating pengguna',
    description: 'Rata-rata kepuasan tinggi dari pengguna aktif mingguan.',
  },
];

export default function SocialProof() {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center">
          Dipercaya oleh ribuan profesional
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          Bukti nyata bahwa CV kamu siap bersaing di proses rekrutmen.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {proofPoints.map((point) => (
            <Card key={point.title} className="text-center">
              <CardHeader>
                <CardTitle className="text-2xl">{point.title}</CardTitle>
                <CardDescription>{point.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
