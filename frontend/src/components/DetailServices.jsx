import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, Megaphone, Shield, Share2, Palette } from 'lucide-react';

export const DetailServices = () => {
  return (
    <section id="detail-services" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Detail Layanan Kami
          </h2>
        </div>

        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="ads" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8">
              <TabsTrigger value="ads">Optimasi Iklan</TabsTrigger>
              <TabsTrigger value="whitelist">Akun Whitelist</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="creative">Creative</TabsTrigger>
            </TabsList>

            <TabsContent value="ads">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Megaphone className="text-cyan-600" size={28} />
                    <span>Optimasi Iklan Digital</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Manajemen iklan Meta & Google</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Funnel strategy & conversion optimization</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Creative copy & visual ads berbasis data</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Reporting & data analytics komprehensif</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whitelist">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Shield className="text-cyan-600" size={28} />
                    <span>Akun Whitelist Meta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Akun lebih stabil & minim risiko banned</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Lebih hemat pajak Meta</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Cocok untuk NGO dan advertiser dengan spending rutin</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Proses setup dan compliance assistance</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Share2 className="text-cyan-600" size={28} />
                    <span>Optimasi Social Media Organic</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Content planner strategis</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Creative copywriting yang engaging</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Template & sistem konten yang efisien</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Reporting performa social media</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="creative">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <Palette className="text-cyan-600" size={28} />
                    <span>Creative & Content Production</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Konten berbasis campaign & goal</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Visual relevan, bukan sekadar estetik</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Copy yang menjual tanpa menipu</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                      <span className="text-gray-700">Multi-format content (video, image, carousel)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default DetailServices;