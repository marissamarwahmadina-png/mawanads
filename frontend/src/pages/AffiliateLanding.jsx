import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { CheckCircle2, Building, TrendingUp, MessageSquare, User, DollarSign, Mail, Phone, ShieldCheck, BarChart3, Zap, Target, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import MetaPixel, { trackPurchase } from '../components/MetaPixel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AFFILIATOR_PIXELS = {
  'dimas': '2975682082624536',
  'aansopiyan': '4419483654961528',
  'default': '2975682082624536'
};

export const AffiliateLanding = () => {
  const { affiliator } = useParams();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', organization: '', monthly_ad_spend: '', message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const pixelId = AFFILIATOR_PIXELS[affiliator?.toLowerCase()] || AFFILIATOR_PIXELS['default'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = { ...formData, affiliator: affiliator || 'direct' };
      const response = await axios.post(`${BACKEND_URL}/api/affiliate-lead`, submitData);
      if (response.data.success) {
        trackPurchase();
        setIsSuccess(true);
        toast.success('Terima kasih!', { description: 'Tim kami akan segera menghubungi Anda.' });
        setFormData({ name: '', email: '', phone: '', organization: '', monthly_ad_spend: '', message: '' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      toast.error('Gagal mengirim', { description: error.response?.data?.detail || 'Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl border-0 bg-white/95 backdrop-blur">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <CheckCircle2 className="text-white" size={48} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pendaftaran Berhasil!</h2>
            <p className="text-lg text-gray-600 mb-8">
              Terima kasih atas minat Anda. Saya akan menghubungi Anda dalam 1x24 jam untuk sesi konsultasi gratis.
            </p>
            <div className="space-y-4">
              <Button onClick={() => window.open('https://wa.me/6287784094475', '_blank')} className="bg-green-500 hover:bg-green-600 text-white" size="lg">
                Chat WhatsApp Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {/* Problem & Solution Section */}
      <section className="bg-slate-800/50 border-y border-slate-700/30">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-8 md:p-10 mb-10">
              <p className="text-slate-300 text-lg leading-relaxed mb-6">
                Banyak bisnis sudah <span className="text-white font-semibold">besar dari sisi budget</span>,
                tapi belum kuat dari sisi <span className="text-cyan-400 font-semibold">struktur dan risk management</span>.
              </p>
              <p className="text-slate-400 mb-8">Di sesi ini, kita akan membahas:</p>

              <div className="space-y-4">
                {[
                  'Struktur akun & risiko banned',
                  'Celah pemborosan budget',
                  'Cara scaling tanpa memicu sistem',
                  'Optimasi performa tanpa gambling',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={14} className="text-cyan-400" />
                    </div>
                    <span className="text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-slate-500 text-sm mb-1">Tanpa komitmen. Tanpa kewajiban kerja sama.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section ref={formRef} className="py-16 md:py-20" id="form-section">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-cyan-400 mb-3">
                <Mail size={18} />
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
                    <Label htmlFor="email" className="flex items-center space-x-2 text-slate-700">
                      <Mail size={15} /><span>Email *</span>
                    </Label>
                    <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="email@example.com" className="mt-2" data-testid="input-email" />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center space-x-2 text-slate-700">
                      <Phone size={15} /><span>Nomor WhatsApp *</span>
                    </Label>
                    <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder="08xx-xxxx-xxxx" className="mt-2" data-testid="input-phone" />
                  </div>
                  <div>
                    <Label htmlFor="organization" className="flex items-center space-x-2 text-slate-700">
                      <Building size={15} /><span>Nama Bisnis/Perusahaan *</span>
                    </Label>
                    <Input id="organization" name="organization" value={formData.organization} onChange={handleChange} required placeholder="Nama bisnis atau perusahaan Anda" className="mt-2" data-testid="input-org" />
                  </div>
                  <div>
                    <Label htmlFor="monthly_ad_spend" className="flex items-center space-x-2 text-slate-700">
                      <DollarSign size={15} /><span>Jumlah Spent Ads Per Bulan *</span>
                    </Label>
                    <Input id="monthly_ad_spend" name="monthly_ad_spend" value={formData.monthly_ad_spend} onChange={handleChange} required placeholder="Contoh: Rp 500 juta" className="mt-2" data-testid="input-spend" />
                  </div>
                  <div>
                    <Label htmlFor="message" className="flex items-center space-x-2 text-slate-700">
                      <MessageSquare size={15} /><span>Pesan/Kebutuhan Anda *</span>
                    </Label>
                    <Textarea id="message" name="message" value={formData.message} onChange={handleChange} required placeholder="Ceritakan kebutuhan campaign digital Anda..." rows={4} className="mt-2" data-testid="input-message" />
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
