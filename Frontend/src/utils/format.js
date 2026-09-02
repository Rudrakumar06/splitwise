export const idOf = (value) => String(value?._id || value?.id || value || '');
export const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0));
export const date = (value) => value ? new Date(value).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';
