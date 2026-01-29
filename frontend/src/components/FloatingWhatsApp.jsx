import React, { useState } from 'react';

export const FloatingWhatsApp = () => {
  const [isHovered, setIsHovered] = useState(false);
  const whatsappNumber = '6289655128024';
  const message = 'Halo Mawana Digital Services, saya ingin konsultasi.';

  const handleClick = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="fixed bottom-6 right-6 z-50 cursor-pointer group"
      style={{
        transition: 'all 0.3s ease',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      {/* WhatsApp Button dengan gambar */}
      <div className="relative">
        <img
          src="https://customer-assets.emergentagent.com/job_digiads-pro/artifacts/5nlo2zmg_image.png"
          alt="WhatsApp"
          className="w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl hover:shadow-green-500/50 transition-all duration-300"
          style={{
            filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
          }}
        />
        
        {/* Pulse animation ring */}
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></div>
        
        {/* Tooltip */}
        <div
          className={`absolute right-full mr-4 top-1/2 transform -translate-y-1/2 bg-white px-4 py-2 rounded-lg shadow-lg whitespace-nowrap transition-all duration-300 ${
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
          }`}
        >
          <p className="text-sm font-semibold text-gray-900">Chat dengan CS Kami</p>
          <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-white"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .animate-ping {
          animation: pulse-ring 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default FloatingWhatsApp;
