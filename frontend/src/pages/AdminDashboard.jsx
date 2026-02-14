import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Mail, Phone, Building, Calendar, User, MessageSquare, RefreshCw, LogOut, DollarSign, UserCheck } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const AdminDashboard = () => {
  const [contacts, setContacts] = useState([]);
  const [affiliateLeads, setAffiliateLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contactsRes, leadsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/contacts`),
        axios.get(`${BACKEND_URL}/api/affiliate-leads`)
      ]);
      setContacts(contactsRes.data);
      setAffiliateLeads(leadsRes.data);
    } catch (err) {
      setError('Gagal memuat data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="animate-spin mx-auto mb-4 text-cyan-600" size={48} />
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Total Contacts: <span className="font-semibold text-cyan-600">{contacts.length}</span> | 
                Total Affiliate Leads: <span className="font-semibold text-blue-600">{affiliateLeads.length}</span>
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={fetchData}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                <RefreshCw className="mr-2" size={18} />
                Refresh
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Home
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <LogOut className="mr-2" size={18} />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="contacts" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="contacts">
              Contact Form ({contacts.length})
            </TabsTrigger>
            <TabsTrigger value="affiliates">
              Affiliate Leads ({affiliateLeads.length})
            </TabsTrigger>
          </TabsList>

          {/* Contacts Tab */}
          <TabsContent value="contacts">
            {contacts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="mx-auto mb-4 text-gray-400" size={64} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Belum Ada Submission
                  </h3>
                  <p className="text-gray-600">
                    Form kontak belum ada yang mengirim pesan
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {contacts.map((contact) => (
                  <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center">
                            <User className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {contact.name}
                            </h3>
                            {contact.organization && (
                              <p className="text-sm text-gray-600">{contact.organization}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="mr-2" size={16} />
                          {formatDate(contact.submittedAt)}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <Mail className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Email</p>
                            <a 
                              href={`mailto:${contact.email}`}
                              className="text-gray-900 font-medium hover:text-cyan-600"
                            >
                              {contact.email}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Phone className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Telepon</p>
                            <a 
                              href={`tel:${contact.phone}`}
                              className="text-gray-900 font-medium hover:text-cyan-600"
                            >
                              {contact.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex items-start space-x-3">
                          <MessageSquare className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-2">Pesan</p>
                            <p className="text-gray-900 whitespace-pre-wrap">{contact.message}</p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t mt-4 pt-4 flex gap-3">
                        <Button
                          onClick={() => window.open(`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`, '_blank')}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          size="sm"
                        >
                          WhatsApp
                        </Button>
                        <Button
                          onClick={() => window.location.href = `mailto:${contact.email}`}
                          variant="outline"
                          size="sm"
                        >
                          Email
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Affiliate Leads Tab */}
          <TabsContent value="affiliates">
            {affiliateLeads.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <UserCheck className="mx-auto mb-4 text-gray-400" size={64} />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Belum Ada Affiliate Lead
                  </h3>
                  <p className="text-gray-600">
                    Belum ada submission dari affiliate landing page
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {affiliateLeads.map((lead) => (
                  <Card key={lead.id} className="hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="text-white" size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {lead.name}
                            </h3>
                            <p className="text-sm text-gray-600">{lead.organization}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="mr-2" size={16} />
                            {formatDate(lead.submittedAt)}
                          </div>
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            <UserCheck className="inline mr-1" size={14} />
                            Affiliator: {lead.affiliator}
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <Building className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Organisasi</p>
                            <p className="text-gray-900 font-medium">{lead.organization}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <DollarSign className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Monthly Ad Spend</p>
                            <p className="text-gray-900 font-medium">{lead.monthly_ad_spend}</p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex items-start space-x-3">
                          <MessageSquare className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 mb-2">Pesan/Kebutuhan</p>
                            <p className="text-gray-900 whitespace-pre-wrap">{lead.message}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default AdminDashboard;
