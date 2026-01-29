import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Shield, Users, Building, TrendingUp } from 'lucide-react';

export const WhitelistEducation = () => {
  const targetAudience = [
    {
      icon: Building,
      title: 'NGO & Yayasan',
      description: 'Organisasi non-profit dengan campaign fundraising'
    },
    {
      icon: TrendingUp,
      title: 'Fundraising Platform',
      description: 'Platform donasi dan crowdfunding'
    },
    {
      icon: Users,
      title: 'Brand dengan Spending Rutin',
      description: 'Brand yang konsisten beriklan dengan budget signifikan'
    },
    {
      icon: Shield,
      title: 'Agency & Advertiser Profesional',
      description: 'Agency yang mengelola multiple client accounts'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Apa Itu Akun Whitelist Meta?
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Akun whitelist adalah akun iklan dengan perlakuan khusus dari Meta sehingga lebih stabil, risiko restricted lebih rendah, dan sistem pembayaran lebih lancar.
            </p>
          </div>

          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Siapa yang Cocok Menggunakan Whitelist?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {targetAudience.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="p-6 bg-white rounded-xl border-2 border-cyan-100 hover:border-cyan-300 transition-colors duration-300"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                          <Icon className="text-white" size={24} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">
                          {item.title}
                        </h4>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-cyan-50 rounded-2xl p-8">
            <p className="text-xl text-center text-gray-800 font-semibold">
              Whitelist bukan soal kebal, tapi soal <span className="text-cyan-600">kepatuhan dan stabilitas</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhitelistEducation;