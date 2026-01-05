import { Card, CardHeader, CardTitle, CardDescription } from '@cv-generator/ui';
import { Sparkles, LayoutTemplate, FileCheck2, Download } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Assisted Writing',
    description:
      'Generate and improve your CV content with smart suggestions powered by AI.',
  },
  {
    icon: LayoutTemplate,
    title: 'Customizable Templates',
    description:
      'Choose from professionally designed templates and tailor them to your style.',
  },
  {
    icon: FileCheck2,
    title: 'ATS Friendly',
    description:
      'Ensure your CV passes applicant tracking systems with optimized formatting.',
  },
  {
    icon: Download,
    title: 'Easy Export',
    description:
      'Download your CV in multiple formats ready for job applications.',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-center">Features</h2>
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
