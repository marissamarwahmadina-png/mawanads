import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
  Brain, Target, TrendingUp, Users, Clock, CheckCircle2, ArrowDown,
  Zap, ShieldCheck, Award, MessageSquare, ChevronDown, ChevronUp,
  Heart, BarChart3, User, Mail, Phone, Building, Gift, BookOpen, Star, Lightbulb
} from 'lucide-react';
import MetaPixel from '../components/MetaPixel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WEBINAR_PIXEL_ID = '925288323242595';

function Countdown({ targetDate }) {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) return setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000)
      });
    };
    calc();
    const i = setInterval(calc, 1000);
    return () => clearInterval(i);
  }, [targetDate]);
  return (
    <div className="flex gap-3 justify-center">
      {[
        { val: time.days, label: 'Hari' },
        { val: time.hours, label: 'Jam' },
        { val: time.minutes, label: 'Menit' },
        { val: time.seconds, label: 'Detik' },
      ].map((b, i) => (
        <div key={i} className="bg-[#0D234A] rounded-xl px-4 py-3 min-w-[70px] text-center">
          <div className="text-2xl md:text-3xl font-bold text-white tabular-nums">{String(b.val).padStart(2, '0')}</div>
          <div className="text-xs text-cyan-200 mt-1">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-cyan-200/50 rounded-xl overflow-hidden bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-cyan-50/50 transition-colors">
        <span className="text-[#0D234A] font-medium pr-4">{q}</span>
        {open ? <ChevronUp size={20} className="text-[#00A2C1] flex-shrink-0" /> : <ChevronDown size={20} className="text-[#00A2C1] flex-shrink-0" />}
      </button>
      {open && <div className="px-6 pb-4 text-gray-600 leading-relaxed">{a}</div>}
    </div>
  );
}

const WebinarLanding = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ full_name: '', email: '', whatsapp: '', role: '', ticket_type: 'individu' });
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/webinar/events/psikologi-sedekah`)
      .then(res => { setEvent(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/webinar/register`, { ...formData, event_id: event.id });
      if (res.data.success) {
        toast.success('Pendaftaran berhasil!');
        navigate(`/webinar/psikologi-sedekah/pembayaran?invoice=${res.data.data.invoice_id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mendaftar');
    } finally {
      setSubmitting(false);
    }
  };

  const prices = event?.ticket_prices || {};
  const seatsRemaining = event?.seats_remaining ?? 100;

  const roles = [
    'Fundraiser / Penggalang Dana', 'Marketing NGO / Yayasan', 'Copywriter',
    'Tim Digital Campaign', 'Pimpinan Lembaga Amal', 'Konsultan Fundraising', 'Lainnya'
  ];

  const faqs = [
    { q: 'Apakah webinar ini akan direkam?', a: 'Ya, rekaman akan dikirimkan kepada peserta yang sudah membayar melalui email dan WhatsApp setelah acara selesai.' },
    { q: 'Apakah ada sertifikat?', a: 'Ya, setiap peserta yang hadir akan mendapatkan e-certificate yang bisa diunduh.' },
    { q: 'Bagaimana jika saya tidak bisa hadir?', a: 'Anda tetap akan mendapatkan akses rekaman dan semua materi.' },
    { q: 'Apakah materi ini cocok untuk pemula?', a: 'Sangat cocok! Materi dirancang untuk semua level, dari pemula hingga berpengalaman.' },
    { q: 'Bagaimana cara pembayaran?', a: 'Setelah mengisi form, Anda akan diarahkan ke halaman pembayaran dengan berbagai metode (Transfer Bank, QRIS, E-Wallet, dll).' },
    { q: 'Apakah berlaku untuk 1 lembaga lebih dari 3 orang?', a: 'Paket lembaga mencakup 3 orang. Untuk lebih dari 3, silakan hubungi admin via WhatsApp.' },
  ];

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-white flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-[#00C0D8] border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8F8FA] via-white to-[#E8F8FA]">
      <MetaPixel pixelId={WEBINAR_PIXEL_ID} />

      {/* Header */}
      <div className="bg-white border-b border-cyan-100 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <img src="https://customer-assets.emergentagent.com/job_digiads-pro/artifacts/z10loxce_Header%20mawanads.svg" alt="Mawana Digital Services" className="h-8 md:h-10 w-auto" />
          <div className="text-xs text-gray-500 hidden md:block">Kajian Fundraising Ramadan</div>
        </div>
      </div>

      {/* ===== A. HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00C0D8]/10 via-transparent to-[#0D234A]/5" />
        <div className="container mx-auto px-4 py-14 md:py-20 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-[#0D234A] rounded-full px-5 py-2 mb-6" data-testid="hero-badge">
              <BookOpen size={16} className="text-[#FFD700]" />
              <span className="text-white text-sm font-semibold">Kajian Fundraising Ramadan</span>
              <span className="text-xs bg-[#FFD700] text-[#0D234A] px-2 py-0.5 rounded-full font-bold">Kuota Terbatas</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-[#0D234A]" data-testid="hero-title">
              Psikologi Sedekah:
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00A2C1] to-[#00C0D8]">Rahasia CTA Donasi yang Menyentuh Hati</span>
            </h1>

            <p className="text-base md:text-lg text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Pelajari <strong className="text-[#0D234A]">9 tipe donor</strong>, <strong className="text-[#0D234A]">7 trigger psikologis</strong>, dan formula copywriting yang meningkatkan konversi donasi hingga <strong className="text-[#00A2C1]">300%</strong> — strategi teruji dari 500+ campaign amal
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button onClick={scrollToForm} size="lg" data-testid="hero-cta"
                className="bg-[#FFD700] hover:bg-[#E6C200] text-[#0D234A] px-10 py-6 text-lg rounded-xl shadow-lg shadow-yellow-500/20 font-bold">
                Simpan Kursi Saya Sekarang <ArrowDown className="ml-2 animate-bounce" size={20} />
              </Button>
              <Button onClick={() => window.open('https://wa.me/6289655128024?text=Halo,%20saya%20tertarik%20webinar%20Psikologi%20Sedekah', '_blank')}
                variant="outline" size="lg" className="border-[#00A2C1] text-[#00A2C1] hover:bg-[#00A2C1]/10 px-8 py-6 text-lg rounded-xl">
                Tanya Admin via WhatsApp
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Clock size={14} className="text-[#00A2C1]" /> 11 Maret 2026, 10.00 WIB</span>
              <span className="flex items-center gap-1"><MessageSquare size={14} className="text-[#00A2C1]" /> Online via Google Meet</span>
              <span className="flex items-center gap-1"><Users size={14} className="text-[#00A2C1]" /> Sisa {seatsRemaining} kursi</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SPEAKERS ===== */}
      <section className="py-14 bg-white border-y border-cyan-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-center text-[#0D234A] mb-10">Bersama Pembicara</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-[#E8F8FA] to-white border border-cyan-100 rounded-2xl p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#00A2C1] to-[#0D234A] rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={40} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#0D234A]">Aan Sopiyan, S. Psi., C. HT.</h3>
              <p className="text-[#00A2C1] font-semibold text-sm mt-1">Digital Fundraiser Expert</p>
              <div className="flex justify-center gap-2 mt-3">
                <span className="bg-[#00A2C1]/10 text-[#00A2C1] px-3 py-1 rounded-full text-xs font-medium">Psikologi</span>
                <span className="bg-[#00A2C1]/10 text-[#00A2C1] px-3 py-1 rounded-full text-xs font-medium">Fundraising</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[#E8F8FA] to-white border border-cyan-100 rounded-2xl p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#00A2C1] to-[#0D234A] rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={40} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#0D234A]">Rizki Putra Utama, S.E., C. DMP</h3>
              <p className="text-[#00A2C1] font-semibold text-sm mt-1">CEO Mawanads</p>
              <p className="text-gray-500 text-xs mt-0.5">Certified Digital Marketer</p>
              <div className="flex justify-center gap-2 mt-3">
                <span className="bg-[#00A2C1]/10 text-[#00A2C1] px-3 py-1 rounded-full text-xs font-medium">Digital Ads</span>
                <span className="bg-[#00A2C1]/10 text-[#00A2C1] px-3 py-1 rounded-full text-xs font-medium">Marketing</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== B. PAIN-AGITATE-SOLUTION ===== */}
      <section className="py-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center text-[#0D234A] mb-8">Apakah Anda Mengalami Ini?</h2>
          <div className="space-y-3 mb-10">
            {[
              'CTA donasi sudah dibuat, tapi konversi tetap rendah',
              'Donor hanya datang sekali dan tidak pernah kembali',
              'Campaign viral tapi donasi tidak sebanding dengan reach',
              'Tim copywriting sudah kerja keras, tapi hasilnya stagnan',
              'Tidak tahu harus pakai pendekatan emosional atau rasional',
            ].map((pain, i) => (
              <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-200/50 rounded-xl px-5 py-4">
                <span className="text-red-400 mt-0.5 font-bold">x</span>
                <span className="text-gray-700">{pain}</span>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-[#00A2C1]/10 to-[#E8F8FA] border border-[#00A2C1]/20 rounded-2xl p-8 text-center">
            <Lightbulb className="mx-auto mb-4 text-[#FFD700]" size={32} />
            <p className="text-base text-gray-700 leading-relaxed">
              Semua masalah ini bukan soal <em>effort</em> — tapi soal <strong className="text-[#0D234A]">memahami psikologi donor</strong>.
              Di webinar ini, Anda akan belajar pendekatan ilmiah yang sudah terbukti meningkatkan konversi donasi secara <strong className="text-[#00A2C1]">etis dan berkelanjutan</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ===== C. WHAT YOU'LL LEARN ===== */}
      <section className="py-14 bg-white border-y border-cyan-100">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-center text-[#0D234A] mb-3">Yang Akan Anda Pelajari</h2>
          <p className="text-gray-500 text-center mb-10">Materi berbasis riset dan studi kasus nyata</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Brain, text: '7 trigger psikologis yang membuat donor langsung bertindak' },
              { icon: Users, text: '9 archetype/tipe donor dan cara mendekati masing-masing' },
              { icon: Heart, text: 'Identifiable Victim Effect — kenapa cerita 1 orang lebih kuat dari statistik' },
              { icon: BarChart3, text: 'Social proof & urgency yang etis untuk meningkatkan konversi' },
              { icon: ShieldCheck, text: 'Loss aversion — bagaimana "takut kehilangan" mendorong donasi' },
              { icon: Target, text: 'Formula copywriting CTA donasi: headline, body, CTA' },
              { icon: Award, text: 'Case study: campaign yang berhasil naik 300% konversinya' },
              { icon: TrendingUp, text: 'Framework evaluasi campaign agar terus improve setiap cycle' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-[#E8F8FA]/50 border border-cyan-100 rounded-xl px-5 py-4">
                <item.icon size={22} className="text-[#00A2C1] flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BENEFITS ===== */}
      <section className="py-14">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center text-[#0D234A] mb-8">Benefit untuk Peserta</h2>
          <div className="space-y-4">
            {[
              { icon: Gift, text: 'Free Coaching Fundraising senilai Rp 5.000.000,- selama 3 bulan', highlight: true },
              { icon: Users, text: 'Grup Eksklusif khusus peserta webinar' },
              { icon: Star, text: 'Free Akses Networking ke pelaku NGO Nasional' },
              { icon: ShieldCheck, text: 'Free Pendampingan intensif untuk Fundraising sampai berhasil' },
              { icon: BookOpen, text: 'Sharing Session rutin belajar base on case bersama expertise' },
            ].map((b, i) => (
              <div key={i} className={`flex items-start gap-4 rounded-xl px-6 py-4 ${b.highlight ? 'bg-[#FFD700]/10 border-2 border-[#FFD700]/30' : 'bg-white border border-cyan-100'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${b.highlight ? 'bg-[#FFD700]/20' : 'bg-[#00A2C1]/10'}`}>
                  <b.icon size={20} className={b.highlight ? 'text-[#B8960F]' : 'text-[#00A2C1]'} />
                </div>
                <span className={`text-sm leading-relaxed mt-2 ${b.highlight ? 'text-[#0D234A] font-semibold' : 'text-gray-700'}`}>{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== E. SOCIAL PROOF ===== */}
      <section className="py-14 bg-white border-y border-cyan-100">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="grid grid-cols-3 gap-6 mb-10">
            {[
              { num: '500+', label: 'Campaign Terkelola' },
              { num: '300%', label: 'Avg. Peningkatan Konversi' },
              { num: '50+', label: 'Lembaga Partner' },
            ].map((s, i) => (
              <div key={i} className="bg-gradient-to-br from-[#E8F8FA] to-white border border-cyan-100 rounded-xl p-6">
                <div className="text-3xl font-bold text-[#00A2C1]">{s.num}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { text: '"Setelah webinar ini, conversion rate campaign kami naik 2.5x dalam 2 bulan. Materinya sangat aplikatif!"', name: 'Tim Fundraising - Yayasan A' },
              { text: '"Akhirnya paham kenapa CTA kami selama ini kurang efektif. Approach psikologinya game-changer."', name: 'Head of Marketing - NGO B' },
            ].map((t, i) => (
              <div key={i} className="bg-[#E8F8FA]/50 border border-cyan-100 rounded-xl p-6 text-left">
                <p className="text-gray-600 italic mb-3">{t.text}</p>
                <p className="text-sm text-[#00A2C1] font-semibold">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== F. URGENCY + COUNTDOWN ===== */}
      <section className="py-14 bg-gradient-to-b from-[#0D234A] to-[#0A1B38]">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Webinar Dimulai Dalam</h2>
          <p className="text-cyan-200 mb-8">Kuota terbatas: <strong className="text-[#FFD700]">{seatsRemaining} kursi tersisa</strong> dari 100</p>
          {event?.start_datetime && <Countdown targetDate={event.start_datetime} />}
          <div className="mt-8 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl px-6 py-4 inline-block">
            <p className="text-[#FFD700] text-sm font-semibold">Bonus: Template CTA + Checklist Psikologi Donor (gratis untuk pendaftar sebelum 9 Maret 2026)</p>
          </div>
        </div>
      </section>

      {/* ===== G. TICKET FORM ===== */}
      <section ref={formRef} className="py-14 md:py-20" id="daftar">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#0D234A] mb-2">Pilih Tiket & Daftar Sekarang</h2>
            <p className="text-gray-500">Investasi kecil untuk impact besar pada campaign Anda</p>
          </div>

          {/* Ticket Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {Object.entries(prices).map(([key, tier]) => (
              <button key={key} onClick={() => setFormData(p => ({ ...p, ticket_type: key }))}
                data-testid={`ticket-${key}`}
                className={`rounded-xl p-5 text-left transition-all border-2 ${
                  formData.ticket_type === key
                    ? 'border-[#00A2C1] bg-[#E8F8FA] shadow-lg shadow-cyan-500/10'
                    : 'border-gray-200 bg-white hover:border-cyan-200'
                }`}>
                <div className="text-sm text-gray-500 mb-1 font-medium">{tier.label}</div>
                <div className="text-gray-400 line-through text-sm">Rp {tier.original_price?.toLocaleString('id-ID')}</div>
                <div className="text-2xl font-bold text-[#0D234A]">Rp {tier.price?.toLocaleString('id-ID')}</div>
                <div className="text-xs text-[#00A2C1] mt-1 font-medium">{tier.persons} orang</div>
              </button>
            ))}
          </div>

          {/* Form */}
          <Card className="border border-cyan-100 bg-white shadow-xl" data-testid="register-form-card">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
                <div>
                  <Label htmlFor="full_name" className="flex items-center gap-2 text-[#0D234A]"><User size={15} /> Nama Lengkap *</Label>
                  <Input id="full_name" value={formData.full_name} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} required placeholder="Nama lengkap Anda" className="mt-2 border-cyan-200 focus:border-[#00A2C1]" data-testid="input-fullname" />
                </div>
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 text-[#0D234A]"><Mail size={15} /> Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required placeholder="email@example.com" className="mt-2 border-cyan-200 focus:border-[#00A2C1]" data-testid="input-email" />
                </div>
                <div>
                  <Label htmlFor="whatsapp" className="flex items-center gap-2 text-[#0D234A]"><Phone size={15} /> WhatsApp *</Label>
                  <Input id="whatsapp" type="tel" value={formData.whatsapp} onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))} required placeholder="08xx-xxxx-xxxx" className="mt-2 border-cyan-200 focus:border-[#00A2C1]" data-testid="input-whatsapp" />
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-[#0D234A]"><Building size={15} /> Peran / Jabatan *</Label>
                  <Select onValueChange={v => setFormData(p => ({ ...p, role: v }))} value={formData.role}>
                    <SelectTrigger className="mt-2 border-cyan-200" data-testid="input-role"><SelectValue placeholder="Pilih peran Anda" /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={submitting || !formData.role} size="lg" data-testid="submit-register"
                  className="w-full bg-[#FFD700] hover:bg-[#E6C200] text-[#0D234A] py-6 text-base rounded-xl shadow-lg shadow-yellow-500/20 font-bold">
                  {submitting ? 'Memproses...' : <>Lanjut ke Pembayaran <TrendingUp className="ml-2" size={18} /></>}
                </Button>

                <p className="text-xs text-center text-gray-400">
                  Data Anda aman. Reminder via WA & Email sebelum acara.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== H. FAQ ===== */}
      <section className="py-14 bg-[#E8F8FA]/50 border-y border-cyan-100">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center text-[#0D234A] mb-10">Pertanyaan yang Sering Diajukan</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ===== I. FINAL CTA ===== */}
      <section className="py-14 bg-gradient-to-b from-white to-[#E8F8FA]">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-[#0D234A] mb-4">Jangan Lewatkan Kesempatan Ini</h2>
          <p className="text-gray-500 mb-2">Sisa <strong className="text-[#0D234A]">{seatsRemaining} kursi</strong> — harga bisa berubah sewaktu-waktu</p>
          <p className="text-gray-400 text-sm mb-8">11 Maret 2026, 10.00 WIB | Online via Google Meet</p>
          <Button onClick={scrollToForm} size="lg" data-testid="final-cta"
            className="bg-[#FFD700] hover:bg-[#E6C200] text-[#0D234A] px-12 py-6 text-lg rounded-xl shadow-lg shadow-yellow-500/20 font-bold">
            DAFTAR SEKARANG
          </Button>
        </div>
      </section>

      {/* ===== STICKY CTA MOBILE ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-cyan-200 p-3 md:hidden z-50" data-testid="sticky-cta">
        <Button onClick={scrollToForm} size="lg" className="w-full bg-[#FFD700] hover:bg-[#E6C200] text-[#0D234A] py-5 rounded-xl text-base font-bold">
          Daftar Sekarang — Mulai Rp 85.000
        </Button>
      </div>

      {/* Footer */}
      <footer className="border-t border-cyan-100 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>© 2026 Mawana Digital Services. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/ketentuan-layanan" className="hover:text-[#00A2C1] transition-colors">Ketentuan Layanan</a>
            <a href="/kebijakan-privasi" className="hover:text-[#00A2C1] transition-colors">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebinarLanding;
