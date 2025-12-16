import { RecurrenceFrequency } from '../types.ts';

export const CURRENCY = '€';
export const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#64748B'];

export const formatDate = (isoString: string) => {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

export const getDaysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Calculate next occurrence based on frequency
export const calculateNextDate = (currentDate: string, frequency: RecurrenceFrequency): string => {
    const d = new Date(currentDate);
    if (frequency === 'WEEKLY') d.setDate(d.getDate() + 7);
    if (frequency === 'MONTHLY') d.setMonth(d.getMonth() + 1);
    if (frequency === 'YEARLY') d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
};

export const getFrequencyLabel = (freq?: RecurrenceFrequency) => {
    switch (freq) {
        case 'WEEKLY': return 'Settimanale';
        case 'MONTHLY': return 'Mensile';
        case 'YEARLY': return 'Annuale';
        default: return 'Periodico';
    }
};
