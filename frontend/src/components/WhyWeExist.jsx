import React from 'react';
import { XCircle, TrendingDown, AlertTriangle, FileX } from 'lucide-react';

export const WhyWeExist = () => {
  const reasons = [
    {
      icon: TrendingDown,
      text: 'Funnel tidak jelas'
    },
    {
      icon: AlertTriangle,
      text: 'Akun iklan tidak siap compliance'
    },
    {
      icon: XCircle,
      text: 'Creative tidak berbasis data'
    },
    {
      icon: FileX,
      text: 'Tidak ada evaluasi & reporting yang sehat'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-red-50 to-orange-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Kenapa Banyak Campaign Digital Gagal?
            </h2>
            <p className="text-xl text-gray-700 mb-8">
              Karena dijalankan tanpa fondasi yang kuat:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {reasons.map((reason, index) => {
              const Icon = reason.icon;
              return (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Icon className="text-red-600" size={24} />
                    </div>
                  </div>
                  <p className="text-gray-800 font-medium text-lg">{reason.text}</p>
                </div>
              );
            })}
          </div>

          <div className="text-center bg-white rounded-2xl p-8 shadow-lg">
            <div className="inline-block bg-red-100 rounded-full p-4 mb-4">
              <AlertTriangle className="text-red-600" size={40} />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              Iklan jalan, uang habis, growth tidak kelihatan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyWeExist;