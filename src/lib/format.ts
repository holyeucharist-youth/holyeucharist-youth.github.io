import { format, parseISO, isValid } from 'date-fns';

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = parseISO(iso);
    if (!isValid(d)) return '—';
    return format(d, 'HH:mm');
  } catch {
    return '—';
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = parseISO(iso);
    if (!isValid(d)) return '—';
    return format(d, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

export function formatDatetime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    const d = parseISO(iso);
    if (!isValid(d)) return '—';
    return format(d, 'dd MMM yyyy HH:mm');
  } catch {
    return '—';
  }
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function currentMonthIso(): string {
  return format(new Date(), 'yyyy-MM');
}

export function currentYear(): number {
  return new Date().getFullYear();
}
