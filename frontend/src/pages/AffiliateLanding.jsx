import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CheckCircle2, Building, TrendingUp, MessageSquare, User, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import MetaPixel, { trackLead, trackSubmitApplication } from '../components/MetaPixel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Konfigurasi Meta Pixel per affiliator (bisa diubah sesuai kebutuhan)
const AFFILIATOR_PIXELS = {
  'dimas': '1234567890', // Ganti dengan Pixel ID real untuk Dimas
  'default': '' // Pixel ID default jika ada
};

export const AffiliateLanding = () => {
  const { affiliator } = useParams(); // Get affiliator name from URL
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    monthly_ad_spend: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const pixelId = AFFILIATOR_PIXELS[affiliator?.toLowerCase()] || AFFILIATOR_PIXELS['default'];

  const spendOptions = [
    'Di bawah Rp 5 juta',
    'Rp 5 juta - Rp 10 juta',
    'Rp 10 juta - Rp 25 juta',
    'Rp 25 juta - Rp 50 juta',
    'Rp 50 juta - Rp 100 juta',
    'Di atas Rp 100 juta'
  ];

  const benefits = [
    'Konsultasi strategi digital marketing gratis',
    'Akun whitelist Meta untuk campaign lebih stabil',
    'Tim expert yang berpengalaman dengan NGO & fundraising',
    'ROI terukur dengan reporting yang transparan',
    'Dukungan teknis prioritas'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (value) => {
    setFormData({
      ...formData,
      monthly_ad_spend: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        affiliator: affiliator || 'direct'
      };

      const response = await axios.post(`${BACKEND_URL}/api/affiliate-lead`, submitData);
      
      if (response.data.success) {
        // Track Meta Pixel events
        trackLead();
        trackSubmitApplication();
        
        setIsSuccess(true);
        toast.success('Terima kasih!', {
          description: 'Tim kami akan segera menghubungi Anda.',
        });
        
        // Reset form
        setFormData({
          name: '',
          organization: '',
          monthly_ad_spend: '',
          message: ''
        });

        // Scroll to success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Silakan coba lagi.';
      toast.error('Gagal mengirim', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white flex items-center justify-center p-4">
        <MetaPixel pixelId={pixelId} />
        <Card className="max-w-2xl w-full shadow-2xl">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-white" size={48} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pendaftaran Berhasil!
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Terima kasih atas minat Anda. Tim Mawana Digital Services akan menghubungi Anda dalam 1x24 jam untuk konsultasi gratis.
            </p>
            <div className="space-y-4">
              <Button
                onClick={() => window.open('https://wa.me/6289655128024', '_blank')}
                className="bg-green-500 hover:bg-green-600 text-white"
                size="lg"
              >
                Chat WhatsApp Sekarang
              </Button>
              <div>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                >
                  Kembali ke Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-white">
      <MetaPixel pixelId={pixelId} />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 py-4">
        <div className="container mx-auto px-4">
          <img
            src="https://customer-assets.emergentagent.com/job_digiads-pro/artifacts/z10loxce_Header%20mawanads.svg"
            alt="Mawana Digital Services"
            className="h-12 w-auto"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Scale Up Campaign Digital Anda Bersama <span className="text-cyan-600">Mawana Digital Services</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Partner strategis untuk NGO, fundraising, dan brand yang ingin bertumbuh melalui iklan digital yang aman, terukur, dan profitable.
            </p>
            {affiliator && (
              <div className="mt-6 inline-block bg-cyan-100 text-cyan-800 px-6 py-2 rounded-full font-semibold">
                Referral dari: {affiliator.charAt(0).toUpperCase() + affiliator.slice(1)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Benefits */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-2xl">Kenapa Memilih Kami?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle2 className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl">
                    <h3 className="font-bold text-gray-900 mb-3">Trusted By:</h3>
                    <p className="text-gray-700">
                      NGO, yayasan, dan brand terkemuka di Indonesia yang telah mempercayakan campaign digital mereka kepada kami.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div>
              <Card className="shadow-xl border-2 border-cyan-100">
                <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                  <CardTitle className="text-2xl">Dapatkan Konsultasi Gratis</CardTitle>
                  <p className="text-gray-600">Isi form di bawah dan tim kami akan segera menghubungi Anda</p>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div>
                      <Label htmlFor="name" className="flex items-center space-x-2">
                        <User size={16} />
                        <span>Nama Lengkap *</span>
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Nama Anda"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="organization" className="flex items-center space-x-2">
                        <Building size={16} />
                        <span>Asal Lembaga/Perusahaan *</span>
                      </Label>
                      <Input
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        required
                        placeholder="PT/Yayasan/NGO Anda"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="monthly_ad_spend" className="flex items-center space-x-2">
                        <DollarSign size={16} />
                        <span>Jumlah Spent Ads Per Bulan *</span>
                      </Label>
                      <Select onValueChange={handleSelectChange} value={formData.monthly_ad_spend}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Pilih range budget iklan" />
                        </SelectTrigger>
                        <SelectContent>
                          {spendOptions.map((option, index) => (
                            <SelectItem key={index} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="message" className="flex items-center space-x-2">
                        <MessageSquare size={16} />
                        <span>Pesan/Kebutuhan Anda *</span>
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        placeholder="Ceritakan kebutuhan campaign digital Anda..."
                        rows={4}
                        className="mt-2"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
                      size="lg"
                    >
                      {isSubmitting ? 'Mengirim...' : (
                        <>
                          Kirim & Dapatkan Konsultasi Gratis
                          <TrendingUp className="ml-2" size={18} />
                        </>
                      )}
                    </Button>

                    <p className="text-sm text-center text-gray-500 mt-4">
                      Dengan mengirim form ini, Anda setuju untuk dihubungi oleh tim Mawana Digital Services
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateLanding;
