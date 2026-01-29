import React from 'react';
import { CheckCircle2, Users, Shield, BarChart3, Clock, Zap } from 'lucide-react';

export const SolutionSection = () => {
  const solutions = [
    {
      icon: Users,
      text: 'Tim ahli digital marketing & creative'
    },
    {
      icon: Shield,
      text: 'Akun whitelist Meta yang lebih aman dan stabil'
    },
    {
      icon: BarChart3,
      text: 'Strategi campaign dari perencanaan hingga laporan'
    },
    {
      icon: Zap,
      text: 'Risiko banned lebih rendah, performa lebih terkontrol'
    },
    {
      icon: Clock,
      text: 'Support responsif dan terukur'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Mawana Digital Services Hadir Sebagai <span className="text-cyan-600">Partner Strategis</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {solutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                      <Icon className="text-white" size={24} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium text-lg">{solution.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 text-white">
            <CheckCircle2 className="mx-auto mb-4" size={48} />
            <p className="text-2xl font-semibold">
              Kami tidak sekadar menjalankan iklan. <br />Kami memastikan iklanmu bekerja.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;