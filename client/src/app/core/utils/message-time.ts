/** Angular DatePipe format: time only today, date + time on other days. */
export function messageTimestampFormat(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return 'HH:mm';
  }

  const sameYear = date.getFullYear() === now.getFullYear();
  return sameYear ? 'MMM d, HH:mm' : 'MMM d, y, HH:mm';
}
