export interface DoualaDateTime {
  date: string;
  time: string;
}

export function getDoualaDateTime(value: Date = new Date()): DoualaDateTime {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Douala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(value);
  const get = (type: string) => parts.find(part => part.type === type)?.value || '';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}

export function getDoualaDateString(value: Date = new Date()): string {
  return getDoualaDateTime(value).date;
}

export function getDoualaTimeString(value: Date = new Date()): string {
  return getDoualaDateTime(value).time;
}
