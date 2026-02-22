import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle2 } from 'lucide-react';
import MetaPixel, { trackMetaEvent } from '../components/MetaPixel';

const AFFILIATOR_PIXELS = {
  'dimas': '2975682082624536',
  'aansopiyan': '4419483654961528',
  'default': '2975682082624536'
};

const AffiliateThankYou = () => {
  const { affiliator } = useParams();
  const pixelId = AFFILIATOR_PIXELS[affiliator?.toLowerCase()] || AFFILIATOR_PIXELS['default'];

  useEffect(() => {
    trackMetaEvent('Purchase', { value: 0, currency: 'IDR' });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <MetaPixel pixelId={pixelId} />
      <Card className="max-w-2xl w-full shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardContent className="p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="text-white" size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Pendaftaran Berhasil!</h2>
          <p className="text-lg text-gray-600 mb-8">
            Terima kasih atas minat Anda. Saya akan menghubungi Anda dalam 1x24 jam untuk sesi konsultasi gratis.
          </p>
          <Button onClick={() => window.open('https://wa.me/6287784094475', '_blank')} className="bg-green-500 hover:bg-green-600 text-white" size="lg">
            Chat WhatsApp Sekarang
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AffiliateThankYou;
