import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { TrendingUp, User, DollarSign, Phone, ShieldCheck, BarChart3, Zap, Target, ArrowDown, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import MetaPixel, { trackMetaEvent } from '../components/MetaPixel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AFFILIATOR_PIXELS = {
  'dimas': '2975682082624536',
  'aansopiyan': '4419483654961528',
  'default': '2975682082624536'
};

export const AffiliateLanding = () => {
  const { affiliator } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', monthly_ad_spend: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pixelId = AFFILIATOR_PIXELS[affiliator?.toLowerCase()] || AFFILIATOR_PIXELS['default'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    trackMetaEvent('Lead');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = { ...formData, affiliator: affiliator || 'direct' };
      const response = await axios.post(`${BACKEND_URL}/api/affiliate-lead`, submitData);
      if (response.data.success) {
        toast.success('Terima kasih!', { description: 'Tim kami akan segera menghubungi Anda.' });
        navigate(`/affiliate/${affiliator}/thankyou`);
      }
    } catch (error) {
      toast.error('Gagal mengirim', { description: error.response?.data?.detail || 'Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <MetaPixel pixelId={pixelId} />

      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700/50 py-4">
        <div className="container mx-auto px-4 h-10">
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-5 py-2 mb-8" data-testid="hero-badge">
              <Zap size={16} className="text-cyan-400" />
              <span className="text-cyan-300 text-sm font-semibold tracking-wide">Konsultasi Ads Gratis</span>
              <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full">Khusus High Spender</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight" data-testid="hero-title">
              Konsultasi Ads <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Gratis</span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl text-slate-300">Khusus High Spender</span>
            </h1>

            <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Saya membuka sesi konsultasi gratis terbatas untuk bisnis yang memiliki
              <span className="text-white font-semibold"> spent iklan Miliaran rupiah Per Bulan </span>
              dan ingin:
            </p>

            {/* Pain Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
              {[
                { icon: ShieldCheck, text: 'Lebih jarang terkena banned / restriction' },
                { icon: DollarSign, text: 'Biaya iklan lebih efisien' },
                { icon: BarChart3, text: 'Performa campaign lebih konsisten dan scalable' },
                { icon: Target, text: 'Scaling tanpa memicu sistem' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-800/60 border border-slate-700/50 rounded-xl px-5 py-4 text-left">
                  <item.icon size={20} className="text-cyan-400 flex-shrink-0" />
                  <span className="text-slate-200 text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={scrollToForm}
              size="lg"
              data-testid="hero-cta-btn"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-10 py-6 text-lg rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40"
            >
              Dapatkan Konsultasi Gratis
              <ArrowDown className="ml-2 animate-bounce" size={20} />
            </Button>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section ref={formRef} className="py-16 md:py-20" id="form-section">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-cyan-400 mb-3">
                <Phone size={18} />
                <span className="text-sm font-semibold tracking-wider uppercase">Dapatkan Konsultasi Gratis</span>
              </div>
              <p className="text-slate-400">
                Isi form di bawah ini dan Saya pribadi akan segera menghubungi
              </p>
            </div>

            <Card className="shadow-2xl border-0 bg-white/[0.97] backdrop-blur" data-testid="affiliate-form-card">
              <CardContent className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-5" data-testid="affiliate-form">
                  <div>
                    <Label htmlFor="name" className="flex items-center space-x-2 text-slate-700">
                      <User size={15} /><span>Nama Lengkap *</span>
                    </Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Nama Anda" className="mt-2" data-testid="input-name" />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center space-x-2 text-slate-700">
                      <Phone size={15} /><span>Nomor WA Aktif *</span>
                    </Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="08xx-xxxx-xxxx" className="mt-2" data-testid="input-phone" />
                  </div>
                  <div>
                    <Label htmlFor="monthly_ad_spend" className="flex items-center space-x-2 text-slate-700">
                      <DollarSign size={15} /><span>Spent Bulanan *</span>
                    </Label>
                    <Input id="monthly_ad_spend" name="monthly_ad_spend" value={formData.monthly_ad_spend} onChange={handleChange} required placeholder="Contoh: Rp 500 juta" className="mt-2" data-testid="input-spend" />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    data-testid="submit-btn"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-6 text-base rounded-xl shadow-lg shadow-cyan-500/20"
                    size="lg"
                  >
                    {isSubmitting ? 'Mengirim...' : (
                      <>Kirim & Dapatkan Konsultasi Gratis<TrendingUp className="ml-2" size={18} /></>
                    )}
                  </Button>

                  <p className="text-xs text-center text-slate-400 mt-4">
                    Dengan mengirim form ini, Anda setuju untuk dihubungi oleh tim kami
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AffiliateLanding;
