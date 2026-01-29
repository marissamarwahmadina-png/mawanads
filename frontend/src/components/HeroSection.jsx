import React from 'react';
import { Button } from './ui/button';
import { ArrowRight, MessageCircle } from 'lucide-react';

export const HeroSection = () => {
  const scrollToContact = () => {
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1704652070195-61e76e1466db?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHwyfHx0ZWFtJTIwd29ya3NwYWNlfGVufDB8fHx8MTc2OTY4MjkzOXww&ixlib=rb-4.1.0&q=85"
          alt="Professional Team"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900/90 via-cyan-900/85 to-navy-800/90" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Iklan Jalan. Akun Aman. <span className="text-cyan-400">Growth Terukur.</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
            Mawana Digital Services adalah partner digital strategis untuk NGO, fundraising, dan brand yang ingin bertumbuh melalui iklan dan media sosial—tanpa drama banned, tanpa buang budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={scrollToContact}
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-600 text-white text-lg px-8 py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Konsultasi Gratis
              <ArrowRight className="ml-2" size={20} />
            </Button>
            <Button
              onClick={() => window.open('https://wa.me/6289655128024', '_blank')}
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-cyan-600 text-lg px-8 py-6 rounded-lg shadow-lg transition-all duration-300"
            >
              <MessageCircle className="mr-2" size={20} />
              Hubungi via WhatsApp
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/70 rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;