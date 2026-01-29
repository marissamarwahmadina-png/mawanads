import React from 'react';

export const OurClients = () => {
  // Logo clients dan partners
  const clients = [
    {
      name: 'Your Need In Turkey',
      logo: 'https://yourneedinturkey.com/wp-content/uploads/2024/11/cropped-LOGO-YNIT-192x192.png'
    },
    {
      name: 'Sharing Happiness',
      logo: 'https://sharinghappiness.org/wp-content/uploads/2024/10/Logo-SH-Utuh-1-150x150.png'
    },
    {
      name: 'Salurkan Kebaikan',
      logo: 'https://salurkankebaikan.org/wp-content/uploads/2024/08/Logo-Salurkan-Kebaikan-Baru.svg'
    },
    {
      name: 'Siaga Teknik',
      logo: 'https://siagateknik.com/wp-content/uploads/2024/03/SIAGATEKNIK-LOGO-FULL-2.png'
    },
    {
      name: 'Pure Hands',
      logo: 'https://purehands.id/wp-content/uploads/2023/06/logo-pure-hands-200x200.png'
    },
    {
      name: 'Blessing MOA',
      logo: 'https://blessingmoa.id/wp-content/uploads/2024/11/Logo-BM-1536x1536.png'
    }
  ];

  // Duplicate array untuk seamless loop
  const duplicatedClients = [...clients, ...clients];

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Dipercaya oleh <span className="text-cyan-600">Client & Partner</span> Terbaik
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Kami bangga telah berkolaborasi dengan berbagai organisasi dan brand terkemuka
          </p>
        </div>

        {/* Marquee Container */}
        <div className="relative">
          <div className="marquee-wrapper">
            <div className="marquee-content">
              {duplicatedClients.map((client, index) => (
                <div
                  key={index}
                  className="marquee-item flex items-center justify-center p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-300"
                >
                  <img
                    src={client.logo}
                    alt={client.name}
                    className="max-h-24 w-auto object-contain filter grayscale hover:grayscale-0 transition-all duration-300"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="100"%3E%3Crect fill="%23e5e7eb" width="200" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" fill="%236b7280" font-family="Arial" font-size="14"%3E' + client.name + '%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .marquee-wrapper {
          overflow: hidden;
          position: relative;
        }

        .marquee-content {
          display: flex;
          animation: marquee 30s linear infinite;
          will-change: transform;
        }

        .marquee-item {
          flex-shrink: 0;
          width: 280px;
          margin: 0 20px;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .marquee-content:hover {
          animation-play-state: paused;
        }

        @media (max-width: 768px) {
          .marquee-item {
            width: 220px;
            margin: 0 15px;
          }
        }
      `}</style>
    </section>
  );
};

export default OurClients;
