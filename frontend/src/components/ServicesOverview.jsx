import React from 'react';
import { Megaphone, Shield, TrendingUp, Share2, BarChart3 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

export const ServicesOverview = () => {
  const services = [
    {
      icon: Megaphone,
      title: 'Optimasi Iklan',
      subtitle: '(Meta & Google)',
      description: 'Strategi iklan berbasis data untuk hasil maksimal'
    },
    {
      icon: Shield,
      title: 'Akun Whitelist Meta',
      subtitle: 'Lebih Stabil & Aman',
      description: 'Akun iklan dengan perlakuan khusus dari Meta'
    },
    {
      icon: TrendingUp,
      title: 'Funnel Strategy',
      subtitle: '& Conversion',
      description: 'Optimasi perjalanan customer untuk konversi tinggi'
    },
    {
      icon: Share2,
      title: 'Optimasi Social Media',
      subtitle: 'Organic',
      description: 'Pertumbuhan organik melalui konten strategis'
    },
    {
      icon: BarChart3,
      title: 'Reporting',
      subtitle: '& Data Analytics',
      description: 'Laporan lengkap dan insight actionable'
    }
  ];

  const scrollToDetailServices = () => {
    const element = document.getElementById('detail-services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Layanan Utama Kami
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-xl transition-all duration-300 border-t-4 border-cyan-500 group"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="text-white" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {service.title}
                  </h3>
                  <p className="text-sm text-cyan-600 font-medium mb-3">
                    {service.subtitle}
                  </p>
                  <p className="text-gray-600">{service.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            onClick={scrollToDetailServices}
            size="lg"
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-8"
          >
            Lihat Detail Layanan
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesOverview;