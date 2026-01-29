import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { CheckCircle2, Sparkles, Rocket } from 'lucide-react';

export const PricingSection = () => {
  const packages = [
    {
      name: 'Paket Optimasi Starter',
      icon: Sparkles,
      price: 'Mulai dari IDR 1.000.000',
      note: 'Biaya setup disesuaikan dengan kompleksitas kebutuhan',
      features: [
        'Optimasi Media Sosial',
        'Optimasi Iklan (Meta/Google)'
      ],
      optional: [
        'Content Production',
        'SEO Optimization'
      ]
    },
    {
      name: 'Paket Optimasi Growth',
      icon: Rocket,
      price: 'Mulai dari IDR 1.500.000',
      note: 'Biaya setup disesuaikan dengan kompleksitas kebutuhan',
      features: [
        'Optimasi Media Sosial',
        'Optimasi Iklan (Meta/Google)',
        'Optimasi Website & Marketplace'
      ],
      optional: [
        'Content Production',
        'SEO Optimization'
      ],
      featured: true
    }
  ];

  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Paket Layanan
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Pilih paket yang sesuai dengan kebutuhan bisnis Anda
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {packages.map((pkg, index) => {
            const Icon = pkg.icon;
            return (
              <Card
                key={index}
                className={`relative ${
                  pkg.featured
                    ? 'border-2 border-cyan-500 shadow-xl'
                    : 'border border-gray-200 shadow-lg'
                }`}
              >
                {pkg.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                      Populer
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="text-white" size={32} />
                  </div>
                  <CardTitle className="text-2xl mb-4">{pkg.name}</CardTitle>
                  <div className="text-3xl font-bold text-cyan-600 mb-2">
                    {pkg.price}
                  </div>
                  <p className="text-sm text-gray-500 italic">{pkg.note}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Termasuk:</h4>
                      <ul className="space-y-3">
                        {pkg.features.map((feature, fIndex) => (
                          <li key={fIndex} className="flex items-start space-x-3">
                            <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Opsional:</h4>
                      <ul className="space-y-3">
                        {pkg.optional.map((option, oIndex) => (
                          <li key={oIndex} className="flex items-start space-x-3">
                            <CheckCircle2 className="text-gray-400 flex-shrink-0 mt-1" size={20} />
                            <span className="text-gray-600">{option}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Button
                    onClick={scrollToContact}
                    className={`w-full mt-8 ${
                      pkg.featured
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700'
                        : 'bg-cyan-500 hover:bg-cyan-600'
                    } text-white`}
                    size="lg"
                  >
                    Konsultasi Sekarang
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;