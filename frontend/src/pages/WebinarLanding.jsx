import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import {
  Brain, Target, TrendingUp, Users, Clock, CheckCircle2, ArrowDown,
  Zap, ShieldCheck, Award, MessageSquare, ChevronDown, ChevronUp,
  Sparkles, Heart, BarChart3, User, Mail, Phone, Building
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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
  const boxes = [
    { val: time.days, label: 'Hari' },
    { val: time.hours, label: 'Jam' },
    { val: time.minutes, label: 'Menit' },
    { val: time.seconds, label: 'Detik' },
  ];
  return (
    <div className="flex gap-3 justify-center">
      {boxes.map((b, i) => (
        <div key={i} className="bg-slate-800 rounded-xl px-4 py-3 min-w-[70px] text-center border border-slate-700">
          <div className="text-2xl md:text-3xl font-bold text-white tabular-nums">{String(b.val).padStart(2, '0')}</div>
          <div className="text-xs text-slate-400 mt-1">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-700/50 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-800/50 transition-colors">
        <span className="text-white font-medium pr-4">{q}</span>
        {open ? <ChevronUp size={20} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />}
      </button>
      {open && <div className="px-6 pb-4 text-slate-400 leading-relaxed">{a}</div>}
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
      const res = await axios.post(`${BACKEND_URL}/api/webinar/register`, {
        ...formData, event_id: event.id
      });
      if (res.data.success) {
        const { invoice_id } = res.data.data;
        toast.success('Pendaftaran berhasil!');
        navigate(`/webinar/psikologi-sedekah/pembayaran?invoice=${invoice_id}`);
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
    'Fundraiser / Penggalang Dana',
    'Marketing NGO / Yayasan',
    'Copywriter',
    'Tim Digital Campaign',
    'Pimpinan Lembaga Amal',
    'Konsultan Fundraising',
    'Lainnya'
  ];

  const faqs = [
    { q: 'Apakah webinar ini akan direkam?', a: 'Ya, rekaman akan dikirimkan kepada peserta yang sudah membayar melalui email dan WhatsApp setelah acara selesai.' },
    { q: 'Apakah ada sertifikat?', a: 'Ya, setiap peserta yang hadir akan mendapatkan e-certificate yang bisa diunduh.' },
    { q: 'Bagaimana jika saya tidak bisa hadir?', a: 'Anda tetap akan mendapatkan akses rekaman dan semua materi. Tidak ada pembatalan setelah pembayaran kecuali acara dibatalkan oleh penyelenggara.' },
    { q: 'Apakah materi ini cocok untuk pemula?', a: 'Sangat cocok! Materi dirancang untuk semua level, dari pemula hingga berpengalaman di dunia fundraising.' },
    { q: 'Bagaimana cara pembayaran?', a: 'Setelah mengisi form, Anda akan diarahkan ke halaman pembayaran dengan berbagai metode (Transfer Bank, QRIS, E-Wallet, dll).' },
    { q: 'Apakah berlaku untuk 1 lembaga lebih dari 3 orang?', a: 'Paket lembaga mencakup 3 orang. Untuk lebih dari 3, silakan hubungi admin via WhatsApp untuk paket khusus.' },
  ];

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">

      {/* ===== A. HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10" />
        <div className="absolute top-10 right-20 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-5 py-2 mb-6" data-testid="hero-badge">
              <Brain size={16} className="text-violet-400" />
              <span className="text-violet-300 text-sm font-semibold">Webinar Eksklusif</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">Tiket Berbayar — Kuota Terbatas</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6" data-testid="hero-title">
              Temukan Rahasia CTA Donasi yang Bikin Donor <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">"Auto-Transfer"</span>
              <br />
              <span className="text-2xl sm:text-3xl lg:text-4xl text-slate-300 font-semibold">— Tanpa Manipulasi, Hanya Ilmu Psikologi</span>
            </h1>

            <p className="text-lg text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Strategi teruji dari <strong className="text-white">500+ campaign amal</strong>: Pelajari 9 tipe donor, 7 trigger psikologis, dan formula copywriting yang meningkatkan konversi hingga <strong className="text-cyan-400">300%</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button onClick={scrollToForm} size="lg" data-testid="hero-cta"
                className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white px-10 py-6 text-lg rounded-xl shadow-lg shadow-violet-500/25">
                Simpan Kursi Saya Sekarang <ArrowDown className="ml-2 animate-bounce" size={20} />
              </Button>
              <Button onClick={() => window.open('https://wa.me/6289655128024?text=Halo,%20saya%20tertarik%20webinar%20Psikologi%20Sedekah', '_blank')}
                variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800 px-8 py-6 text-lg rounded-xl">
                Tanya Admin via WhatsApp
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1"><Clock size={14} /> 11 Maret 2026, 10.00 WIB</span>
              <span className="flex items-center gap-1"><Users size={14} /> Sisa {seatsRemaining} kursi</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== B. PAIN-AGITATE-SOLUTION ===== */}
      <section className="bg-slate-800/50 border-y border-slate-700/30 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-8">Apakah Anda Mengalami Ini?</h2>
          <div className="space-y-4 mb-10">
            {[
              'CTA donasi sudah dibuat, tapi konversi tetap rendah',
              'Donor hanya datang sekali dan tidak pernah kembali',
              'Campaign viral tapi donasi tidak sebanding dengan reach',
              'Tim copywriting sudah kerja keras, tapi hasilnya stagnan',
              'Tidak tahu harus pakai pendekatan emosional atau rasional',
            ].map((pain, i) => (
              <div key={i} className="flex items-start gap-3 bg-red-500/5 border border-red-500/10 rounded-xl px-5 py-4">
                <span className="text-red-400 mt-0.5">&#10007;</span>
                <span className="text-slate-300">{pain}</span>
              </div>
            ))}
          </div>
          <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-2xl p-8 text-center">
            <Sparkles className="mx-auto mb-4 text-violet-400" size={32} />
            <p className="text-lg text-slate-200 leading-relaxed">
              Semua masalah ini bukan soal <em>effort</em> — tapi soal <strong className="text-white">memahami psikologi donor</strong>.
              Di webinar ini, Anda akan belajar pendekatan ilmiah yang sudah terbukti meningkatkan konversi donasi secara etis dan berkelanjutan.
            </p>
          </div>
        </div>
      </section>

      {/* ===== C. WHAT YOU'LL LEARN ===== */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-3">Apa yang Akan Anda Pelajari</h2>
          <p className="text-slate-400 text-center mb-10">Materi berbasis riset dan studi kasus nyata</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: Brain, text: '7 trigger psikologis yang membuat donor langsung bertindak' },
              { icon: Users, text: '9 archetype/tipe donor dan cara mendekati masing-masing' },
              { icon: Heart, text: 'Identifiable Victim Effect — kenapa cerita 1 orang lebih kuat dari statistik' },
              { icon: BarChart3, text: 'Social proof & urgency yang etis untuk meningkatkan konversi' },
              { icon: ShieldCheck, text: 'Loss aversion — bagaimana "takut kehilangan" mendorong donasi' },
              { icon: Target, text: 'Formula copywriting CTA donasi yang proven: headline, body, CTA' },
              { icon: Award, text: 'Case study: campaign yang berhasil naik 300% konversinya' },
              { icon: TrendingUp, text: 'Framework evaluasi campaign agar terus improve setiap cycle' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-slate-800/60 border border-slate-700/50 rounded-xl px-5 py-4">
                <item.icon size={22} className="text-violet-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-200 text-sm leading-relaxed">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== D. SPEAKER ===== */}
      <section className="bg-slate-800/50 border-y border-slate-700/30 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-10">Pembicara</h2>
          <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-800/80 border border-slate-700/50 rounded-2xl p-8">
            <div className="w-40 h-40 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <User size={64} className="text-white/80" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Praktisi Digital Fundraising</h3>
              <p className="text-slate-400 leading-relaxed">
                Berpengalaman mengelola 500+ campaign digital fundraising untuk NGO, yayasan, dan lembaga amal terkemuka di Indonesia.
                Telah membantu meningkatkan konversi donasi rata-rata 200-300% melalui pendekatan psikologi dan data-driven copywriting.
              </p>
              <div className="flex gap-4 mt-4 text-sm">
                <span className="bg-violet-500/10 text-violet-300 px-3 py-1 rounded-full">500+ Campaign</span>
                <span className="bg-cyan-500/10 text-cyan-300 px-3 py-1 rounded-full">8+ Tahun Experience</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== E. SOCIAL PROOF ===== */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl font-bold mb-10">Dipercaya Oleh</h2>
          <div className="grid grid-cols-3 gap-6 mb-10">
            {[
              { num: '500+', label: 'Campaign Terkelola' },
              { num: '300%', label: 'Avg. Peningkatan Konversi' },
              { num: '50+', label: 'Lembaga Partner' },
            ].map((s, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6">
                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">{s.num}</div>
                <div className="text-sm text-slate-400 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { text: '"Setelah webinar ini, conversion rate campaign kami naik 2.5x dalam 2 bulan. Materinya sangat aplikatif!"', name: 'Tim Fundraising - Yayasan A' },
              { text: '"Akhirnya paham kenapa CTA kami selama ini kurang efektif. Approach psikologinya game-changer."', name: 'Head of Marketing - NGO B' },
            ].map((t, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 text-left">
                <p className="text-slate-300 italic mb-3">{t.text}</p>
                <p className="text-sm text-violet-400 font-semibold">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== F. URGENCY ===== */}
      <section className="bg-gradient-to-b from-slate-800/50 to-slate-900 border-y border-slate-700/30 py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-3">Webinar Dimulai Dalam</h2>
          <p className="text-slate-400 mb-8">Kuota terbatas: {seatsRemaining} kursi tersisa dari 100</p>
          {event?.start_datetime && <Countdown targetDate={event.start_datetime} />}
          <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-xl px-6 py-4 inline-block">
            <p className="text-amber-300 text-sm font-semibold">Bonus: Template CTA + Checklist Psikologi Donor (gratis untuk pendaftar sebelum 9 Maret 2026)</p>
          </div>
        </div>
      </section>

      {/* ===== G. TICKET FORM ===== */}
      <section ref={formRef} className="py-16 md:py-20" id="daftar">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Pilih Tiket & Daftar Sekarang</h2>
            <p className="text-slate-400">Investasi kecil untuk impact besar pada campaign Anda</p>
          </div>

          {/* Ticket Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {Object.entries(prices).map(([key, tier]) => (
              <button key={key} onClick={() => setFormData(p => ({ ...p, ticket_type: key }))}
                data-testid={`ticket-${key}`}
                className={`rounded-xl p-5 text-left transition-all border-2 ${
                  formData.ticket_type === key
                    ? 'border-violet-500 bg-violet-500/10'
                    : 'border-slate-700/50 bg-slate-800/60 hover:border-slate-600'
                }`}>
                <div className="text-sm text-slate-400 mb-1">{tier.label}</div>
                <div className="text-slate-500 line-through text-sm">Rp {tier.original_price?.toLocaleString('id-ID')}</div>
                <div className="text-2xl font-bold text-white">Rp {tier.price?.toLocaleString('id-ID')}</div>
                <div className="text-xs text-slate-500 mt-1">{tier.persons} orang</div>
              </button>
            ))}
          </div>

          {/* Form */}
          <Card className="border-0 bg-white/[0.97] shadow-2xl" data-testid="register-form-card">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
                <div>
                  <Label htmlFor="full_name" className="flex items-center gap-2 text-slate-700"><User size={15} /> Nama Lengkap *</Label>
                  <Input id="full_name" value={formData.full_name} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} required placeholder="Nama lengkap Anda" className="mt-2" data-testid="input-fullname" />
                </div>
                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 text-slate-700"><Mail size={15} /> Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required placeholder="email@example.com" className="mt-2" data-testid="input-email" />
                </div>
                <div>
                  <Label htmlFor="whatsapp" className="flex items-center gap-2 text-slate-700"><Phone size={15} /> WhatsApp *</Label>
                  <Input id="whatsapp" type="tel" value={formData.whatsapp} onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))} required placeholder="08xx-xxxx-xxxx" className="mt-2" data-testid="input-whatsapp" />
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-slate-700"><Building size={15} /> Peran / Jabatan *</Label>
                  <Select onValueChange={v => setFormData(p => ({ ...p, role: v }))} value={formData.role}>
                    <SelectTrigger className="mt-2" data-testid="input-role"><SelectValue placeholder="Pilih peran Anda" /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={submitting || !formData.role} size="lg" data-testid="submit-register"
                  className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white py-6 text-base rounded-xl shadow-lg shadow-violet-500/20">
                  {submitting ? 'Memproses...' : <>Lanjut ke Pembayaran <TrendingUp className="ml-2" size={18} /></>}
                </Button>

                <p className="text-xs text-center text-slate-400">
                  Data Anda aman dan hanya digunakan untuk keperluan webinar ini. Reminder akan dikirim via WA & Email.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ===== H. FAQ ===== */}
      <section className="bg-slate-800/50 border-y border-slate-700/30 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-10">Pertanyaan yang Sering Diajukan</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ===== I. FINAL CTA ===== */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Jangan Lewatkan Kesempatan Ini</h2>
          <p className="text-slate-400 mb-2">Sisa <strong className="text-white">{seatsRemaining} kursi</strong> dari 100 — harga bisa berubah sewaktu-waktu</p>
          <p className="text-slate-500 text-sm mb-8">11 Maret 2026, 10.00 WIB | Online via Zoom</p>
          <Button onClick={scrollToForm} size="lg" data-testid="final-cta"
            className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white px-12 py-6 text-lg rounded-xl shadow-lg shadow-violet-500/25">
            Simpan Kursi Saya Sekarang
          </Button>
        </div>
      </section>

      {/* ===== STICKY CTA MOBILE ===== */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-700/50 p-3 md:hidden z-50" data-testid="sticky-cta">
        <Button onClick={scrollToForm} size="lg" className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 text-white py-5 rounded-xl text-base font-semibold">
          Simpan Kursi Saya — Mulai Rp 85.000
        </Button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-700/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          <p>© 2026 Mawana Digital Services. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/ketentuan-layanan" className="hover:text-slate-300 transition-colors">Ketentuan Layanan</a>
            <a href="/kebijakan-privasi" className="hover:text-slate-300 transition-colors">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WebinarLanding;
