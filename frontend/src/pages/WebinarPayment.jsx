import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Clock, CreditCard, ExternalLink, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const WebinarPayment = () => {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice');
  const [registrant, setRegistrant] = useState(null);
  const [channels, setChannels] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!invoiceId) return;
    Promise.all([
      axios.get(`${BACKEND_URL}/api/webinar/registrant/${invoiceId}`),
      axios.get(`${BACKEND_URL}/api/webinar/payment-channels`)
    ]).then(([regRes, chRes]) => {
      setRegistrant(regRes.data);
      setChannels(chRes.data.channels || []);
      if (regRes.data.tripay_reference) setPaymentCreated(true);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [invoiceId]);

  const groupedChannels = channels.reduce((acc, ch) => {
    const group = ch.group || 'Lainnya';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ch);
    return acc;
  }, {});

  const handleCreatePayment = async () => {
    if (!selectedMethod || !invoiceId) return;
    setCreating(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/webinar/create-payment`, { invoice_id: invoiceId, method: selectedMethod });
      if (res.data.success) {
        setRegistrant(prev => ({
          ...prev,
          tripay_reference: res.data.data.reference,
          tripay_checkout_url: res.data.data.checkout_url,
          pay_code: res.data.data.pay_code,
          payment_method_code: selectedMethod
        }));
        setPaymentCreated(true);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Gagal membuat pembayaran');
    } finally {
      setCreating(false);
    }
  };

  const refreshStatus = async () => {
    if (!invoiceId) return;
    const res = await axios.get(`${BACKEND_URL}/api/webinar/registrant/${invoiceId}`);
    setRegistrant(res.data);
    if (res.data.ticket_status === 'PAID') {
      navigate(`/webinar/psikologi-sedekah/konfirmasi?invoice=${invoiceId}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full" /></div>;
  }

  if (!registrant) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white/95"><CardContent className="p-8 text-center">
          <p className="text-gray-700 mb-4">Invoice tidak ditemukan</p>
          <Button onClick={() => navigate('/webinar/psikologi-sedekah')} variant="outline"><ArrowLeft className="mr-2" size={16} /> Kembali</Button>
        </CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={() => navigate('/webinar/psikologi-sedekah')} className="text-slate-400 hover:text-white text-sm mb-6 flex items-center gap-1">
          <ArrowLeft size={16} /> Kembali ke halaman webinar
        </button>

        {/* Invoice Info */}
        <Card className="bg-white/95 mb-6" data-testid="invoice-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detail Pembayaran</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                registrant.ticket_status === 'PAID' ? 'bg-green-100 text-green-700' :
                registrant.ticket_status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                'bg-amber-100 text-amber-700'
              }`}>{registrant.ticket_status}</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Invoice</span><span className="font-mono font-semibold">{registrant.invoice_id}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Nama</span><span>{registrant.full_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tiket</span><span className="capitalize">{registrant.ticket_type}</span></div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-gray-900 font-semibold">Total</span>
                <span className="text-xl font-bold text-violet-600">Rp {(registrant.total_amount || registrant.amount)?.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {registrant.ticket_status === 'PAID' ? (
          <Card className="bg-green-50 border-green-200"><CardContent className="p-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 text-green-500" size={48} />
            <h3 className="text-xl font-bold text-green-800 mb-2">Pembayaran Berhasil!</h3>
            <Button onClick={() => navigate(`/webinar/psikologi-sedekah/konfirmasi?invoice=${invoiceId}`)} className="bg-green-600 hover:bg-green-700 text-white mt-4">
              Lihat Konfirmasi
            </Button>
          </CardContent></Card>
        ) : !paymentCreated ? (
          /* Payment Method Selection */
          <Card className="bg-white/95" data-testid="payment-method-card">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CreditCard size={20} /> Pilih Metode Pembayaran</h3>
              
              {channels.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">Metode pembayaran belum tersedia.</p>
                  <p className="text-sm">TriPay sedang dalam proses konfigurasi. Silakan hubungi admin.</p>
                  <Button onClick={() => window.open('https://wa.me/6289655128024', '_blank')} className="mt-4 bg-green-500 hover:bg-green-600 text-white" size="sm">
                    Hubungi Admin via WhatsApp
                  </Button>
                </div>
              ) : (
                <>
                  {Object.entries(groupedChannels).map(([group, chs]) => (
                    <div key={group} className="mb-4">
                      <p className="text-xs text-gray-500 font-semibold uppercase mb-2">{group}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {chs.filter(ch => ch.active).map(ch => (
                          <button key={ch.code} onClick={() => setSelectedMethod(ch.code)}
                            className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
                              selectedMethod === ch.code ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                            }`}>
                            <div className="font-semibold text-gray-900">{ch.name}</div>
                            {ch.total_fee?.flat > 0 && <div className="text-xs text-gray-500">Fee: Rp {ch.total_fee.flat.toLocaleString('id-ID')}</div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button onClick={handleCreatePayment} disabled={!selectedMethod || creating} size="lg" data-testid="create-payment-btn"
                    className="w-full mt-4 bg-gradient-to-r from-violet-500 to-cyan-500 text-white py-5 rounded-xl">
                    {creating ? 'Memproses...' : 'Bayar Sekarang'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Payment Created - Show Instructions */
          <Card className="bg-white/95" data-testid="payment-instructions-card">
            <CardContent className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Instruksi Pembayaran</h3>
              
              {registrant.tripay_checkout_url && (
                <a href={registrant.tripay_checkout_url} target="_blank" rel="noopener noreferrer"
                  className="block w-full bg-violet-600 hover:bg-violet-700 text-white text-center py-4 rounded-xl font-semibold mb-4 transition-colors">
                  <ExternalLink className="inline mr-2" size={18} /> Bayar Sekarang di TriPay
                </a>
              )}

              {registrant.pay_code && (
                <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Kode Pembayaran</p>
                  <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">{registrant.pay_code}</p>
                </div>
              )}

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p className="flex items-center gap-2"><Clock size={14} /> Selesaikan pembayaran dalam 2 jam</p>
                <p>Referensi TriPay: <span className="font-mono">{registrant.tripay_reference}</span></p>
              </div>

              <Button onClick={refreshStatus} variant="outline" className="w-full" data-testid="check-status-btn">
                <RefreshCw className="mr-2" size={16} /> Cek Status Pembayaran
              </Button>

              <p className="text-xs text-center text-gray-400 mt-4">
                Status pembayaran akan diperbarui otomatis. Anda juga bisa cek status secara manual.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WebinarPayment;
