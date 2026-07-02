import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { X, Loader2, Trash2, Plus, Link2, Film, FileText, ExternalLink, UploadCloud, Download, Paperclip } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DESIGN_CATEGORIES, DESIGN_STATUSES, DESIGN_PRIORITIES } from '../lib/design';

const API = process.env.REACT_APP_BACKEND_URL;

const fmtSize = (b) => {
  if (!b) return '';
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const blank = {
  title: '', category: 'flyer_poster', priority: 'sedang', requester: '', division: '',
  deadline: '', designer_id: '', brief: '', output_format: '',
  footage_link: '', brief_link: '', results: [], status: 'diajukan', notes: '',
};

export default function DesignRequestModal({ open, request, members, onClose, onSaved, onDeleted, canDelete }) {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [creatives, setCreatives] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setForm(request ? { ...blank, ...request, results: request.results || [] } : blank);
    setCreatives(request?.creatives || []);
    setNewLabel(''); setNewUrl('');
    axios.get(`${API}/api/design-storage/status`, { headers })
      .then((r) => setStorageOk(!!r.data?.configured)).catch(() => setStorageOk(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request]);

  if (!open) return null;
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const addResult = () => {
    if (!newUrl.trim()) return;
    set('results', [...(form.results || []), { label: newLabel.trim() || 'Hasil', url: newUrl.trim() }]);
    setNewLabel(''); setNewUrl('');
  };
  const removeResult = (i) => set('results', form.results.filter((_, idx) => idx !== i));

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Judul wajib diisi');
    setSaving(true);
    const payload = {
      ...form,
      designer_id: form.designer_id || null,
      deadline: form.deadline || null,
      results: (form.results || []).map((r) => ({ label: r.label || '', url: r.url })),
    };
    try {
      const res = request
        ? await axios.put(`${API}/api/design-requests/${request.id}`, payload, { headers })
        : await axios.post(`${API}/api/design-requests`, payload, { headers });
      toast.success(request ? 'Pengajuan diperbarui' : 'Pengajuan dibuat');
      onSaved(res.data);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Gagal menyimpan');
    }
    setSaving(false);
  };

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file || !request) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await axios.post(`${API}/api/design-requests/${request.id}/creatives`, fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      setCreatives(res.data.creatives || []);
      onSaved(res.data);
      toast.success('File berhasil diupload');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Gagal upload file');
    }
    setUploading(false);
  };

  const removeCreative = async (cid) => {
    if (!window.confirm('Hapus file ini?')) return;
    try {
      const res = await axios.delete(`${API}/api/design-requests/${request.id}/creatives/${cid}`, { headers });
      setCreatives(res.data.creatives || []);
      onSaved(res.data);
      toast.success('File dihapus');
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Gagal menghapus file');
    }
  };

  const remove = async () => {
    if (!window.confirm('Hapus pengajuan ini?')) return;
    try {
      await axios.delete(`${API}/api/design-requests/${request.id}`, { headers });
      toast.success('Pengajuan dihapus');
      onDeleted(request.id);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Gagal menghapus');
    }
  };

  const fld = 'w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none text-sm';
  const lbl = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={save}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="font-bold text-cyan-700">{request ? request.number : 'Pengajuan Desain Baru'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5 max-h-[76vh] overflow-y-auto">
          <div>
            <label className={lbl}>Judul *</label>
            <input autoFocus value={form.title} onChange={(e) => set('title', e.target.value)} className={fld} placeholder="Judul pengajuan" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={lbl}>Kategori</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)} className={fld}>
                {DESIGN_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Prioritas</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={fld}>
                {DESIGN_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={fld}>
                {DESIGN_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Deadline</label>
              <input type="date" value={form.deadline || ''} onChange={(e) => set('deadline', e.target.value)} className={fld} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Pengaju</label>
              <input value={form.requester} onChange={(e) => set('requester', e.target.value)} className={fld} placeholder="Nama pengaju" />
            </div>
            <div>
              <label className={lbl}>Divisi</label>
              <input value={form.division} onChange={(e) => set('division', e.target.value)} className={fld} placeholder="mis. Online Ads" />
            </div>
            <div>
              <label className={lbl}>Desainer (PIC)</label>
              <select value={form.designer_id} onChange={(e) => set('designer_id', e.target.value)} className={fld}>
                <option value="">— Belum ditugaskan —</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Brief</label>
            <textarea rows={2} value={form.brief} onChange={(e) => set('brief', e.target.value)} className={fld} placeholder="Kebutuhan / arahan desain" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Format Output</label>
              <input value={form.output_format} onChange={(e) => set('output_format', e.target.value)} className={fld} placeholder="mis. 650 x 350 png" />
            </div>
            <div>
              <label className={lbl}><Film size={11} className="inline mr-1" />Link Footage / Materi</label>
              <input value={form.footage_link} onChange={(e) => set('footage_link', e.target.value)} className={fld} placeholder="https://drive..." />
            </div>
            <div>
              <label className={lbl}><FileText size={11} className="inline mr-1" />Link Brief</label>
              <input value={form.brief_link} onChange={(e) => set('brief_link', e.target.value)} className={fld} placeholder="https://..." />
            </div>
          </div>

          {/* Hasil / Preview */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-cyan-700 mb-2"><Link2 size={15} /> Hasil / Preview Konten</label>
            {(form.results || []).length === 0 && <p className="text-xs text-gray-400 mb-2">Belum ada hasil. Tambahkan link preview di sini.</p>}
            <div className="space-y-1.5 mb-2">
              {(form.results || []).map((r, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                  <a href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-cyan-600 hover:underline truncate flex-1">
                    <ExternalLink size={13} /> <span className="font-medium">{r.label}</span>
                    <span className="text-gray-400 truncate">{r.url}</span>
                  </a>
                  <button type="button" onClick={() => removeResult(i)} className="text-gray-400 hover:text-red-500"><X size={15} /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (mis. Final IG)" className="w-40 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-cyan-500" />
              <input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://link-hasil..." className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-cyan-500" />
              <button type="button" onClick={addResult} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"><Plus size={14} /> Link</button>
            </div>
          </div>

          {/* Creative files — upload/download */}
          <div className="border-t pt-4">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-cyan-700 mb-2"><Paperclip size={15} /> File Creative</label>
            {!request ? (
              <p className="text-xs text-gray-400">Simpan pengajuan dulu, lalu upload file creative-nya.</p>
            ) : !storageOk ? (
              <p className="text-xs text-amber-600">Penyimpanan file belum dikonfigurasi (Cloudinary). Sementara pakai Link hasil di atas.</p>
            ) : (
              <>
                {creatives.length === 0 && <p className="text-xs text-gray-400 mb-2">Belum ada file. Upload hasil desain / footage (gambar, video, PDF).</p>}
                <div className="space-y-1.5 mb-2">
                  {creatives.map((c) => {
                    const isImg = c.resource_type === 'image';
                    return (
                      <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                        {isImg ? (
                          <a href={c.url} target="_blank" rel="noreferrer" className="shrink-0">
                            <img src={c.url} alt={c.filename} className="h-10 w-10 rounded object-cover border border-gray-200" />
                          </a>
                        ) : (
                          <span className="h-10 w-10 rounded bg-gray-200 grid place-items-center text-gray-500 shrink-0">
                            {c.resource_type === 'video' ? <Film size={16} /> : <FileText size={16} />}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{c.filename}</p>
                          <p className="text-[11px] text-gray-400">{(c.format || c.resource_type || '').toUpperCase()} {c.bytes ? `• ${fmtSize(c.bytes)}` : ''}{c.uploaded_by_name ? ` • ${c.uploaded_by_name}` : ''}</p>
                        </div>
                        <a href={c.download_url || c.url} target="_blank" rel="noreferrer" download className="text-gray-400 hover:text-cyan-600 p-1" title="Download"><Download size={16} /></a>
                        <button type="button" onClick={() => removeCreative(c.id)} className="text-gray-400 hover:text-red-500 p-1" title="Hapus"><Trash2 size={15} /></button>
                      </div>
                    );
                  })}
                </div>
                <input ref={fileRef} type="file" onChange={uploadFile} className="hidden"
                  accept="image/*,video/*,application/pdf,.psd,.ai,.zip" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-cyan-300 text-cyan-700 hover:bg-cyan-50 text-sm font-medium disabled:opacity-60">
                  {uploading ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={16} />} {uploading ? 'Mengupload…' : 'Upload File'}
                </button>
              </>
            )}
          </div>

          <div>
            <label className={lbl}>Catatan Tim</label>
            <textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} className={fld} placeholder="Catatan revisi / progres" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t bg-gray-50">
          {request && canDelete && (
            <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-sm"><Trash2 size={15} /> Hapus</button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white text-sm">Batal</button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg bg-cyan-600 text-white font-medium hover:bg-cyan-700 disabled:opacity-60 inline-flex items-center gap-2 text-sm">
            {saving && <Loader2 size={15} className="animate-spin" />} Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
