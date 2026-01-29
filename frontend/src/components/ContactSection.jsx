import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Phone, Mail, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/contact`, formData);
      
      if (response.data.success) {
        toast.success("Pesan Terkirim!", {
          description: "Terima kasih, kami akan segera menghubungi Anda.",
        });
        setFormData({
          name: '',
          email: '',
          phone: '',
          organization: '',
          message: ''
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || "Silakan coba lagi atau hubungi via WhatsApp.";
      toast.error("Gagal mengirim", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Yuk Scale Up Bareng Mawana
            </h2>
            <p className="text-lg text-gray-600">
              Hubungi kami untuk konsultasi gratis dan mulai campaign digital yang terukur
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="border-2 border-cyan-100">
                <CardHeader>
                  <CardTitle>Informasi Kontak</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="text-cyan-600" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">WhatsApp</p>
                      <a
                        href="https://wa.me/6289655128024"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700"
                      >
                        +62 896-5512-8024
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="text-cyan-600" size={24} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Email</p>
                      <a
                        href="mailto:marissamarwahmadina@gmail.com"
                        className="text-cyan-600 hover:text-cyan-700"
                      >
                        marissamarwahmadina@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="pt-6">
                    <Button
                      onClick={() => window.open('https://wa.me/6289655128024', '_blank')}
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                      size="lg"
                    >
                      <MessageCircle className="mr-2" size={20} />
                      Chat via WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="border-2 border-cyan-100">
              <CardHeader>
                <CardTitle>Kirim Pesan</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Nama Anda"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="email@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Nomor Telepon *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="08xx-xxxx-xxxx"
                    />
                  </div>

                  <div>
                    <Label htmlFor="organization">Organisasi/Brand</Label>
                    <Input
                      id="organization"
                      name="organization"
                      value={formData.organization}
                      onChange={handleChange}
                      placeholder="Nama organisasi atau brand Anda"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Pesan *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Ceritakan kebutuhan Anda..."
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                    size="lg"
                  >
                    {isSubmitting ? 'Mengirim...' : (
                      <>
                        Kirim Pesan
                        <Send className="ml-2" size={18} />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;