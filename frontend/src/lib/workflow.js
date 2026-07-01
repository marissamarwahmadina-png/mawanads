// Shared constants for the work board (labels, colors) — mirrors backend enums.

export const SERVICE_TYPES = [
  { value: 'erp', label: 'Sistem ERP', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'fundraising_mentoring', label: 'Pendampingan Fundraising', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'ad_optimization', label: 'Optimasi Iklan', color: 'bg-amber-100 text-amber-700' },
  { value: 'whitelist', label: 'Whitelist', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'other', label: 'Lainnya', color: 'bg-gray-100 text-gray-600' },
];

export const STATUSES = [
  { value: 'todo', label: 'To Do', accent: 'bg-slate-400', head: 'text-slate-600' },
  { value: 'in_progress', label: 'Dikerjakan', accent: 'bg-blue-500', head: 'text-blue-600' },
  { value: 'review', label: 'Review', accent: 'bg-amber-500', head: 'text-amber-600' },
  { value: 'done', label: 'Selesai', accent: 'bg-emerald-500', head: 'text-emerald-600' },
];

export const PRIORITIES = [
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  { value: 'high', label: 'Tinggi', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  { value: 'medium', label: 'Sedang', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  { value: 'low', label: 'Rendah', color: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
];

export const findOpt = (list, value) => list.find((x) => x.value === value);
export const labelOf = (list, value) => findOpt(list, value)?.label || value || '-';

export const formatDate = (iso) => {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'done') return false;
  return dueDate < new Date().toISOString().slice(0, 10);
};
