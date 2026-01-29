import React from 'react';
import { Award, Target, Heart } from 'lucide-react';

export const AboutSection = () => {
  const values = [
    {
      icon: Award,
      title: 'Professionalism',
      description: 'Standar kerja yang tinggi dan konsisten'
    },
    {
      icon: Target,
      title: 'Data Driven',
      description: 'Setiap keputusan berbasis data dan insight'
    },
    {
      icon: Heart,
      title: 'Satisfaction Guarantee',
      description: 'Komitmen pada hasil dan kepuasan klien'
    }
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Tentang Mawana Digital Services
            </h2>
          </div>

          <div className="prose prose-lg max-w-none mb-16">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Mawana Digital Services lahir dari realitas di lapangan—khususnya di dunia NGO dan fundraising—di mana banyak campaign digital berjalan tanpa arah, boros anggaran, dan berisiko tinggi.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Kami hadir sebagai partner strategis, bukan sekadar vendor. Fokus kami adalah membantu klien tumbuh secara aman, terukur, dan berkelanjutan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl bg-gradient-to-b from-cyan-50 to-white border border-cyan-100 hover:border-cyan-300 transition-colors duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;