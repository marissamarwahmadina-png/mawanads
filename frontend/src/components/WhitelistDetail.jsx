import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, Shield, TrendingUp, DollarSign, Clock, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export const WhitelistDetail = () => {
  const platforms = [
    {
      id: 'meta',
      name: 'Meta Whitelist',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg',
      color: 'from-blue-500 to-blue-700',
      features: [
        {
          icon: Shield,
          title: 'Akun Stabil',
          description: 'Risiko restricted atau banned jauh lebih rendah'
        },
        {
          icon: DollarSign,
          title: 'Lebih Hemat PPN',
          description: 'Pembayaran lebih efisien dengan sistem perpajakan yang menguntungkan'
        },
        {
          icon: Lock,
          title: 'Compliance Assistance',
          description: 'Bantuan khusus memastikan iklan comply dengan policy Meta'
        },
        {
          icon: TrendingUp,
          title: 'Skalabilitas Tinggi',
          description: 'Akses ke limit budget lebih besar untuk campaign skala enterprise'
        },
        {
          icon: Clock,
          title: 'Support Priority',
          description: 'Akses ke Meta support dengan respons time lebih cepat'
        }
      ],
      ideal: ['NGO & Yayasan', 'Platform Fundraising', 'Brand dengan spending >10 juta/bulan', 'Agency dengan multiple clients']
    },
    {
      id: 'google',
      name: 'Google Whitelist',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
      color: 'from-red-500 to-yellow-500',
      features: [
        {
          icon: Shield,
          title: 'Akun Stabil',
          description: 'Perlindungan extra dari suspension dan policy strikes'
        },
        {
          icon: DollarSign,
          title: 'Lebih Hemat PPN',
          description: 'Budget allocation yang lebih fleksibel dan efisien'
        },
        {
          icon: Lock,
          title: 'Compliance Assistance',
          description: 'Panduan khusus untuk memastikan compliance dengan Google Ads policy'
        },
        {
          icon: TrendingUp,
          title: 'Skalabilitas Tinggi',
          description: 'Quality score lebih baik dengan cost per click lebih efisien'
        },
        {
          icon: Clock,
          title: 'Support Priority',
          description: 'Google account manager untuk konsultasi strategi'
        }
      ],
      ideal: ['E-commerce dengan spending tinggi', 'Brand awareness campaigns', 'Lead generation campaigns', 'Multi-regional campaigns']
    },
    {
      id: 'tiktok',
      name: 'TikTok Whitelist',
      logo: 'https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg',
      color: 'from-pink-500 to-cyan-500',
      features: [
        {
          icon: Shield,
          title: 'Akun Stabil',
          description: 'Status whitelist memberikan kepercayaan lebih dan stabilitas akun'
        },
        {
          icon: DollarSign,
          title: 'Lebih Hemat PPN',
          description: 'Harga cost per mille yang lebih kompetitif untuk budget efficiency'
        },
        {
          icon: Lock,
          title: 'Compliance Assistance',
          description: 'Perlindungan dari false positive content moderation'
        },
        {
          icon: TrendingUp,
          title: 'Skalabilitas Tinggi',
          description: 'Potensi performa algoritma yang lebih optimal untuk reach'
        },
        {
          icon: Clock,
          title: 'Support Priority',
          description: 'Review dan approval iklan lebih cepat untuk test creative'
        }
      ],
      ideal: ['Brand targeting Gen Z & Millennials', 'Viral marketing campaigns', 'Product launching', 'Influencer collaboration ads']
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: 'Minimalisir Risiko',
      description: 'Campaign tidak tiba-tiba stop karena akun di-suspend atau restricted'
    },
    {
      icon: TrendingUp,
      title: 'Performance Lebih Stabil',
      description: 'Performa campaign lebih konsisten dan predictable'
    },
    {
      icon: DollarSign,
      title: 'Budget Lebih Efisien',
      description: 'ROI lebih baik karena tidak buang budget gara-gara akun bermasalah'
    },
    {
      icon: Clock,
      title: 'Save Time & Energy',
      description: 'Fokus ke strategi dan creative, bukan troubleshooting masalah akun'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-6">
            <Shield className="text-white" size={40} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Akun Whitelist: Investasi Strategis untuk Campaign Digital
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Akun whitelist bukan sekadar "akun istimewa". Ini adalah fondasi untuk campaign digital yang aman, stabil, dan scalable. Mari kita lihat detail keuntungan untuk setiap platform.
          </p>
        </div>

        {/* Platform Tabs */}
        <div className="max-w-6xl mx-auto mb-16">
          <Tabs defaultValue="meta" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="meta" className="text-base">
                Meta Whitelist
              </TabsTrigger>
              <TabsTrigger value="google" className="text-base">
                Google Whitelist
              </TabsTrigger>
              <TabsTrigger value="tiktok" className="text-base">
                TikTok Whitelist
              </TabsTrigger>
            </TabsList>

            {platforms.map((platform) => (
              <TabsContent key={platform.id} value={platform.id}>
                <Card className="border-2 border-cyan-100">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-4 text-2xl">
                      <div className={`w-16 h-16 bg-white rounded-xl flex items-center justify-center p-3 border-2 border-gray-100`}>
                        <img 
                          src={platform.logo} 
                          alt={platform.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span>{platform.name}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {/* Features */}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Fitur & Keuntungan Utama:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {platform.features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                              <div
                                key={index}
                                className="flex items-start space-x-4 p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl hover:shadow-md transition-shadow duration-300"
                              >
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                                    <Icon className="text-white" size={20} />
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-1">
                                    {feature.title}
                                  </h4>
                                  <p className="text-sm text-gray-600">{feature.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Ideal For */}
                      <div className="bg-white rounded-xl p-6 border-2 border-cyan-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Cocok Untuk:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {platform.ideal.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <CheckCircle2 className="text-cyan-600 flex-shrink-0" size={20} />
                              <span className="text-gray-700">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Why Whitelist Matters */}
        <div className="max-w-5xl mx-auto mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Kenapa Akun Whitelist Penting untuk Bisnis Anda?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-l-4 border-cyan-500 hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Icon className="text-white" size={24} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-2">
                          {benefit.title}
                        </h4>
                        <p className="text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-12 text-white">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Siap Upgrade Campaign Digital Anda?
            </h3>
            <p className="text-lg text-white/90 mb-8">
              Konsultasi gratis untuk menentukan akun whitelist platform mana yang paling cocok untuk kebutuhan bisnis Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-cyan-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                Konsultasi Sekarang
              </button>
              <button
                onClick={() => window.open('https://wa.me/6289655128024', '_blank')}
                className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-cyan-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300"
              >
                Chat WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhitelistDetail;
