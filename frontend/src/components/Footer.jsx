import React from 'react';
import { Mail, Phone } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <img
              src="https://customer-assets.emergentagent.com/job_digiads-pro/artifacts/z10loxce_Header%20mawanads.svg"
              alt="Mawana Digital Services"
              className="h-12 w-auto mb-4 bg-white px-4 py-2 rounded-lg"
            />
            <p className="text-gray-400">
              Partner digital strategis untuk NGO, fundraising, dan brand.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Layanan
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('whitelist-detail')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Akun Whitelist
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Tentang Kami
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Paket
                </button>
              </li>
              <li>
                <button
                  onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  Kontak
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-4">Hubungi Kami</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Phone className="text-cyan-400" size={18} />
                <a
                  href="https://wa.me/6289655128024"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  +62 896-5512-8024
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="text-cyan-400" size={18} />
                <a
                  href="mailto:marissamarwahmadina@gmail.com"
                  className="text-gray-400 hover:text-cyan-400 transition-colors"
                >
                  marissamarwahmadina@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400">
            © {currentYear} Mawana Digital Services. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="/ketentuan-layanan" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Ketentuan Layanan</a>
            <a href="/kebijakan-privasi" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">Kebijakan Privasi</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;