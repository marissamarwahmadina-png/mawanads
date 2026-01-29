import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md py-3' : 'bg-white/95 backdrop-blur-sm py-4'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="https://customer-assets.emergentagent.com/job_digiads-pro/artifacts/spgbqpn7_mawana%20digital%20services.png"
              alt="Mawana Digital Services"
              className="h-12 w-auto"
            />
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('services')}
              className="text-gray-700 hover:text-cyan-600 transition-colors duration-200 font-medium"
            >
              Layanan
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-gray-700 hover:text-cyan-600 transition-colors duration-200 font-medium"
            >
              Tentang
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-gray-700 hover:text-cyan-600 transition-colors duration-200 font-medium"
            >
              Paket
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="text-gray-700 hover:text-cyan-600 transition-colors duration-200 font-medium"
            >
              Kontak
            </button>
            <Button
              onClick={() => window.open('https://wa.me/6289655128024', '_blank')}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              WhatsApp
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-700 hover:text-cyan-600 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 space-y-3">
            <button
              onClick={() => scrollToSection('services')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 rounded transition-colors"
            >
              Layanan
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 rounded transition-colors"
            >
              Tentang
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 rounded transition-colors"
            >
              Paket
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 rounded transition-colors"
            >
              Kontak
            </button>
            <Button
              onClick={() => window.open('https://wa.me/6289655128024', '_blank')}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              WhatsApp
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;