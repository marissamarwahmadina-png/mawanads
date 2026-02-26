import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Mail, Phone, Building, Calendar, User, MessageSquare, RefreshCw, DollarSign, UserCheck, Download, Filter, BarChart3, Trash2 } from 'lucide-react';
import AdminNav from '../components/AdminNav';
import * as XLSX from 'xlsx';
import { format, parseISO } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const AdminContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [affiliateLeads, setAffiliateLeads] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [contactFilters, setContactFilters] = useState({
    name: '', email: '', phone: '', organization: '', startDate: '', endDate: ''
  });

  const [leadFilters, setLeadFilters] = useState({
    name: '', email: '', phone: '', organization: '', startDate: '', endDate: ''
  });

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
      setFilteredContacts(contactsRes.data);
      setFilteredLeads(leadsRes.data);
    } catch (err) {
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let filtered = contacts.filter(contact => {
      const matchName = (contact.name || '').toLowerCase().includes(contactFilters.name.toLowerCase());
      const matchEmail = (contact.email || '').toLowerCase().includes(contactFilters.email.toLowerCase());
      const matchPhone = (contact.phone || '').includes(contactFilters.phone);
      const matchOrg = (contact.organization || '').toLowerCase().includes(contactFilters.organization.toLowerCase());
      let matchDate = true;
      if (contactFilters.startDate) {
        matchDate = new Date(contact.submittedAt) >= new Date(contactFilters.startDate);
      }
      if (matchDate && contactFilters.endDate) {
        const endDate = new Date(contactFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        matchDate = new Date(contact.submittedAt) <= endDate;
      }
      return matchName && matchEmail && matchPhone && matchOrg && matchDate;
    });
    setFilteredContacts(filtered);
  }, [contactFilters, contacts]);

  useEffect(() => {
    let filtered = affiliateLeads.filter(lead => {
      const matchName = (lead.name || '').toLowerCase().includes(leadFilters.name.toLowerCase());
      const matchEmail = (lead.email || '').toLowerCase().includes(leadFilters.email.toLowerCase());
      const matchPhone = (lead.phone || '').includes(leadFilters.phone);
      const matchOrg = (lead.organization || '').toLowerCase().includes(leadFilters.organization.toLowerCase());
      let matchDate = true;
      if (leadFilters.startDate) {
        matchDate = new Date(lead.submittedAt) >= new Date(leadFilters.startDate);
      }
      if (matchDate && leadFilters.endDate) {
        const endDate = new Date(leadFilters.endDate);
        endDate.setHours(23, 59, 59, 999);
        matchDate = new Date(lead.submittedAt) <= endDate;
      }
      return matchName && matchEmail && matchPhone && matchOrg && matchDate;
    });
    setFilteredLeads(filtered);
  }, [leadFilters, affiliateLeads]);

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'dd MMMM yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const exportContactsToExcel = () => {
    const data = filteredContacts.map(c => ({
      'Tanggal': formatDate(c.submittedAt), 'Nama': c.name, 'Email': c.email,
      'Telepon': c.phone, 'Organisasi': c.organization || '-', 'Pesan': c.message
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contact Form');
    XLSX.writeFile(wb, `Contact_Form_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
  };

  const exportLeadsToExcel = () => {
    const data = filteredLeads.map(l => ({
      'Tanggal': formatDate(l.submittedAt), 'Nama': l.name, 'Email': l.email,
      'WhatsApp': l.phone, 'Organisasi/Bisnis': l.organization,
      'Monthly Ad Spend': l.monthly_ad_spend, 'Pesan': l.message, 'Affiliator': l.affiliator
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Affiliate Leads');
    XLSX.writeFile(wb, `Affiliate_Leads_${format(new Date(), 'yyyy-MM-dd_HHmm')}.xlsx`);
  };

  const resetContactFilters = () => setContactFilters({ name: '', email: '', phone: '', organization: '', startDate: '', endDate: '' });
  const resetLeadFilters = () => setLeadFilters({ name: '', email: '', phone: '', organization: '', startDate: '', endDate: '' });

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
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <div className="py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="contacts-page-title">Database Kontak</h1>
              <p className="text-gray-600">
                Total Contacts: <span className="font-semibold text-cyan-600">{contacts.length}</span> | 
                Total Affiliate Leads: <span className="font-semibold text-blue-600">{affiliateLeads.length}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <Button data-testid="refresh-btn" onClick={fetchData} className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <RefreshCw className="mr-2" size={18} />Refresh
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <Tabs defaultValue="contacts" className="w-full" data-testid="contacts-tabs">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="contacts" data-testid="tab-contacts">Contact Form ({filteredContacts.length})</TabsTrigger>
            <TabsTrigger value="affiliates" data-testid="tab-affiliates">Affiliate Leads ({filteredLeads.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" data-testid="contacts-tab-content">
            <Card className="mb-6" data-testid="contact-filter-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2"><Filter size={20} /><span>Filter & Search</span></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Nama</label>
                    <Input data-testid="contact-filter-name" placeholder="Cari nama..." value={contactFilters.name} onChange={(e) => setContactFilters({...contactFilters, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Email</label>
                    <Input data-testid="contact-filter-email" placeholder="Cari email..." value={contactFilters.email} onChange={(e) => setContactFilters({...contactFilters, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Telepon</label>
                    <Input data-testid="contact-filter-phone" placeholder="Cari nomor..." value={contactFilters.phone} onChange={(e) => setContactFilters({...contactFilters, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Organisasi</label>
                    <Input data-testid="contact-filter-org" placeholder="Cari organisasi..." value={contactFilters.organization} onChange={(e) => setContactFilters({...contactFilters, organization: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Dari Tanggal</label>
                    <Input data-testid="contact-filter-start-date" type="date" value={contactFilters.startDate} onChange={(e) => setContactFilters({...contactFilters, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Sampai Tanggal</label>
                    <Input data-testid="contact-filter-end-date" type="date" value={contactFilters.endDate} onChange={(e) => setContactFilters({...contactFilters, endDate: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button data-testid="reset-contact-filter-btn" onClick={resetContactFilters} variant="outline" size="sm">Reset Filter</Button>
                  <Button data-testid="export-contacts-btn" onClick={exportContactsToExcel} className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                    <Download className="mr-2" size={16} />Export to Excel ({filteredContacts.length} data)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {filteredContacts.length === 0 ? (
              <Card><CardContent className="p-12 text-center">
                <MessageSquare className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Data</h3>
                <p className="text-gray-600">{contacts.length === 0 ? 'Belum ada submission' : 'Tidak ada data yang sesuai dengan filter'}</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 gap-6" data-testid="contacts-list">
                {filteredContacts.map((contact) => (
                  <Card key={contact.id} data-testid={`contact-card-${contact.id}`} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center"><User className="text-white" size={24} /></div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{contact.name}</h3>
                            {contact.organization && <p className="text-sm text-gray-600">{contact.organization}</p>}
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500"><Calendar className="mr-2" size={16} />{formatDate(contact.submittedAt)}</div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <Mail className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                          <div><p className="text-sm text-gray-500 mb-1">Email</p><a href={`mailto:${contact.email}`} className="text-gray-900 font-medium hover:text-cyan-600">{contact.email}</a></div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Phone className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                          <div><p className="text-sm text-gray-500 mb-1">Telepon</p><a href={`tel:${contact.phone}`} className="text-gray-900 font-medium hover:text-cyan-600">{contact.phone}</a></div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex items-start space-x-3">
                          <MessageSquare className="text-cyan-600 flex-shrink-0 mt-1" size={20} />
                          <div className="flex-1"><p className="text-sm text-gray-500 mb-2">Pesan</p><p className="text-gray-900 whitespace-pre-wrap">{contact.message}</p></div>
                        </div>
                      </div>
                      <div className="border-t mt-4 pt-4 flex gap-3">
                        <Button data-testid={`contact-whatsapp-${contact.id}`} onClick={() => window.open(`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}`, '_blank')} className="bg-green-500 hover:bg-green-600 text-white" size="sm">WhatsApp</Button>
                        <Button data-testid={`contact-email-${contact.id}`} onClick={() => window.location.href = `mailto:${contact.email}`} variant="outline" size="sm">Email</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="affiliates" data-testid="leads-tab-content">
            <Card className="mb-6" data-testid="lead-filter-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2"><Filter size={20} /><span>Filter & Search</span></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Nama</label>
                    <Input data-testid="lead-filter-name" placeholder="Cari nama..." value={leadFilters.name} onChange={(e) => setLeadFilters({...leadFilters, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Email</label>
                    <Input data-testid="lead-filter-email" placeholder="Cari email..." value={leadFilters.email} onChange={(e) => setLeadFilters({...leadFilters, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">WhatsApp</label>
                    <Input data-testid="lead-filter-phone" placeholder="Cari nomor..." value={leadFilters.phone} onChange={(e) => setLeadFilters({...leadFilters, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Bisnis/Perusahaan</label>
                    <Input data-testid="lead-filter-org" placeholder="Cari bisnis..." value={leadFilters.organization} onChange={(e) => setLeadFilters({...leadFilters, organization: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Dari Tanggal</label>
                    <Input data-testid="lead-filter-start-date" type="date" value={leadFilters.startDate} onChange={(e) => setLeadFilters({...leadFilters, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Sampai Tanggal</label>
                    <Input data-testid="lead-filter-end-date" type="date" value={leadFilters.endDate} onChange={(e) => setLeadFilters({...leadFilters, endDate: e.target.value})} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button data-testid="reset-lead-filter-btn" onClick={resetLeadFilters} variant="outline" size="sm">Reset Filter</Button>
                  <Button data-testid="export-leads-btn" onClick={exportLeadsToExcel} className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                    <Download className="mr-2" size={16} />Export to Excel ({filteredLeads.length} data)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {filteredLeads.length === 0 ? (
              <Card><CardContent className="p-12 text-center">
                <UserCheck className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Data</h3>
                <p className="text-gray-600">{affiliateLeads.length === 0 ? 'Belum ada affiliate lead' : 'Tidak ada data yang sesuai dengan filter'}</p>
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 gap-6" data-testid="leads-list">
                {filteredLeads.map((lead) => (
                  <Card key={lead.id} data-testid={`lead-card-${lead.id}`} className="hover:shadow-lg transition-shadow border-l-4 border-blue-500">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center"><User className="text-white" size={24} /></div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{lead.name}</h3>
                            <p className="text-sm text-gray-600">{lead.organization}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center text-sm text-gray-500"><Calendar className="mr-2" size={16} />{formatDate(lead.submittedAt)}</div>
                          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                            <UserCheck className="inline mr-1" size={14} />Affiliator: {lead.affiliator}
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start space-x-3">
                          <Building className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                          <div><p className="text-sm text-gray-500 mb-1">Organisasi</p><p className="text-gray-900 font-medium">{lead.organization}</p></div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <DollarSign className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                          <div><p className="text-sm text-gray-500 mb-1">Monthly Ad Spend</p><p className="text-gray-900 font-medium">{lead.monthly_ad_spend}</p></div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Mail className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                          <div><p className="text-sm text-gray-500 mb-1">Email</p><a href={`mailto:${lead.email}`} className="text-gray-900 font-medium hover:text-blue-600">{lead.email}</a></div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Phone className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                          <div><p className="text-sm text-gray-500 mb-1">WhatsApp</p><a href={`tel:${lead.phone}`} className="text-gray-900 font-medium hover:text-blue-600">{lead.phone}</a></div>
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex items-start space-x-3">
                          <MessageSquare className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                          <div className="flex-1"><p className="text-sm text-gray-500 mb-2">Pesan/Kebutuhan</p><p className="text-gray-900 whitespace-pre-wrap">{lead.message}</p></div>
                        </div>
                      </div>
                      <div className="border-t mt-4 pt-4 flex gap-3">
                        <Button data-testid={`lead-whatsapp-${lead.id}`} onClick={() => window.open(`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank')} className="bg-green-500 hover:bg-green-600 text-white" size="sm">WhatsApp</Button>
                        <Button data-testid={`lead-email-${lead.id}`} onClick={() => window.location.href = `mailto:${lead.email}`} variant="outline" size="sm">Email</Button>
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
    </div>
  );
};

export default AdminContacts;
