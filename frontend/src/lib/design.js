// Constants for the Design Requests (Pengajuan Desain) module — mirrors backend enums.

export const DESIGN_CATEGORIES = [
  { value: 'flyer_poster', label: 'Flyer / Poster', color: 'bg-blue-100 text-blue-700' },
  { value: 'feed_ig', label: 'Feed IG', color: 'bg-pink-100 text-pink-700' },
  { value: 'story_ig', label: 'Story IG', color: 'bg-fuchsia-100 text-fuchsia-700' },
  { value: 'video', label: 'Video', color: 'bg-purple-100 text-purple-700' },
  { value: 'motion', label: 'Motion', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'banner', label: 'Banner', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'logo', label: 'Logo', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'lainnya', label: 'Lainnya', color: 'bg-gray-100 text-gray-600' },
];

export const DESIGN_STATUSES = [
  { value: 'diajukan', label: 'Diajukan', accent: 'bg-slate-400', head: 'text-slate-600', badge: 'bg-slate-100 text-slate-600' },
  { value: 'diproses', label: 'Diproses', accent: 'bg-blue-500', head: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  { value: 'revisi', label: 'Revisi', accent: 'bg-orange-500', head: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  { value: 'selesai', label: 'Selesai', accent: 'bg-emerald-500', head: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
];

export const DESIGN_PRIORITIES = [
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  { value: 'tinggi', label: 'Tinggi', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'sedang', label: 'Sedang', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  { value: 'rendah', label: 'Rendah', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
];

export const findOpt = (list, value) => list.find((x) => x.value === value);
export const labelOf = (list, value) => findOpt(list, value)?.label || value || '-';
