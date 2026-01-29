import React from 'react';
import { AlertCircle, TrendingDown, Target, Ban } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export const ProblemSection = () => {
  const problems = [
    {
      icon: TrendingDown,
      title: 'Budget iklan besar, hasil tidak sebanding',
      description: 'Investasi tinggi tanpa ROI yang jelas'
    },
    {
      icon: Target,
      title: 'Campaign boros dan tidak tertarget',
      description: 'Iklan tidak sampai ke audience yang tepat'
    },
    {
      icon: Ban,
      title: 'Akun iklan rawan restricted atau banned',
      description: 'Campaign terhenti tiba-tiba, budget terbuang'
    },
    {
      icon: AlertCircle,
      title: 'Tim internal belum siap secara strategi dan teknis',
      description: 'Kurangnya expertise untuk menjalankan campaign optimal'
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Masalah yang Sering Terjadi di Campaign Digital
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <Card
                key={index}
                className="border-l-4 border-red-500 hover:shadow-lg transition-shadow duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                        <Icon className="text-red-600" size={24} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {problem.title}
                      </h3>
                      <p className="text-gray-600">{problem.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <p className="text-xl text-gray-700 font-medium">
            Jika ini yang kamu alami, kamu tidak sendirian. <br />
            <span className="text-cyan-600 font-semibold">Dan inilah alasan Mawana Digital Services hadir.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;