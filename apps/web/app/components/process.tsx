import { FileText, Edit3, Send } from 'lucide-react';

const steps = [
  {
    icon: FileText,
    title: 'Choose Template',
    description: 'Select a professional design that suits your industry and style.',
  },
  {
    icon: Edit3,
    title: 'Customize Content',
    description: 'Fill in your details and let AI polish your language and format.',
  },
  {
    icon: Send,
    title: 'Download & Apply',
    description: 'Export your CV and start applying to your dream jobs right away.',
  },
];

export default function Process() {
  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center">How It Works</h2>
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

