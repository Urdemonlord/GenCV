import { FileText, Edit3, Send } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Pilih Template',
    description: 'Temukan desain yang sesuai dengan bidang dan level kariermu.',
  },
  {
    icon: Edit3,
    title: 'Isi & Perbaiki',
    description: 'Masukkan data, lalu biarkan AI merapikan bahasa dan struktur.',
  },
  {
    icon: Send,
    title: 'Unduh & Lamar',
    description: 'Dapatkan CV siap kirim dan mulai melamar hari ini.',
  },
];

export default function Process() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center">Cara Kerja</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-500 text-white">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
