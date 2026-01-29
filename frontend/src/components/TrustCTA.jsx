import React from 'react';
import { Button } from './ui/button';
import { Shield, ArrowRight } from 'lucide-react';

export const TrustCTA = () => {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-cyan-500 to-blue-600">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-8">
            <Shield className="text-white" size={40} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Trusted by NGO & Advertiser
          </h2>
          <p className="text-xl text-white/90 mb-10 leading-relaxed">
            Kami membantu klien menjalankan campaign digital dengan pendekatan yang aman, terukur, dan bisa dipertanggungjawabkan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={scrollToContact}
              size="lg"
              className="bg-white text-cyan-600 hover:bg-gray-100 text-lg px-8 py-6 shadow-xl"
            >
              Mulai Konsultasi Gratis
              <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button
              onClick={() => window.open('https://wa.me/6289655128024', '_blank')}
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-cyan-600 text-lg px-8 py-6"
            >
              Hubungi WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustCTA;