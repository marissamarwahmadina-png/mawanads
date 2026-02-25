import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle2, Clock, ArrowLeft, Calendar, MessageSquare } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const WebinarConfirmation = () => {
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get('invoice');
  const [registrant, setRegistrant] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!invoiceId) return setLoading(false);
    axios.get(`${BACKEND_URL}/api/webinar/registrant/${invoiceId}`)
      .then(res => setRegistrant(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [invoiceId]);

  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full" /></div>;
  }

  if (!registrant) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md bg-white/95"><CardContent className="p-8 text-center">
          <p className="text-gray-700 mb-4">Data tidak ditemukan</p>
          <Button onClick={() => navigate('/webinar/psikologi-sedekah')} variant="outline"><ArrowLeft className="mr-2" size={16} /> Kembali</Button>
        </CardContent></Card>
      </div>
    );
  }

  const isPaid = registrant.ticket_status === 'PAID';

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {isPaid ? (
          <Card className="bg-white/95 shadow-2xl" data-testid="confirmation-paid">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-white" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h2>
              <p className="text-gray-600 mb-6">Terima kasih, {registrant.full_name}. Anda terdaftar di webinar.</p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Invoice</span><span className="font-mono">{registrant.invoice_id}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tiket</span><span className="capitalize">{registrant.ticket_type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Bayar</span><span className="font-semibold">Rp {(registrant.total_amount || registrant.amount)?.toLocaleString('id-ID')}</span></div>
              </div>

              <div className="bg-violet-50 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-center gap-2 mb-2"><Calendar size={16} className="text-violet-600" /><span className="font-semibold text-violet-800">Jadwal Webinar</span></div>
                <p className="text-violet-700 text-sm">11 Maret 2026, 10.00 WIB | Online via Zoom</p>
                <p className="text-violet-600 text-xs mt-1">Link Zoom akan dikirimkan via email & WhatsApp H-1</p>
              </div>

              <div className="space-y-3">
                <Button onClick={() => window.open('https://wa.me/6289655128024?text=Halo,%20saya%20sudah%20daftar%20webinar%20Psikologi%20Sedekah%20dengan%20invoice%20' + registrant.invoice_id, '_blank')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white" size="lg">
                  <MessageSquare className="mr-2" size={18} /> Gabung Grup WhatsApp
                </Button>
                <Button onClick={() => navigate('/webinar/psikologi-sedekah')} variant="outline" className="w-full">
                  Kembali ke Halaman Webinar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/95 shadow-2xl" data-testid="confirmation-pending">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="text-amber-600" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Menunggu Pembayaran</h2>
              <p className="text-gray-600 mb-6">
                Pembayaran Anda belum dikonfirmasi. Jika sudah membayar, status akan diperbarui otomatis.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Invoice</span><span className="font-mono">{registrant.invoice_id}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="text-amber-600 font-semibold">{registrant.ticket_status}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total</span><span className="font-semibold">Rp {(registrant.total_amount || registrant.amount)?.toLocaleString('id-ID')}</span></div>
              </div>

              <div className="space-y-3">
                <Button onClick={() => navigate(`/webinar/psikologi-sedekah/pembayaran?invoice=${registrant.invoice_id}`)}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white" size="lg">
                  Kembali ke Halaman Pembayaran
                </Button>
                <Button onClick={() => window.open('https://wa.me/6289655128024', '_blank')} variant="outline" className="w-full">
                  Hubungi Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WebinarConfirmation;
