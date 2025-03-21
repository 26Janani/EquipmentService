import { differenceInMonths } from 'date-fns';

export function calculateAge(installationDate: string): string {
  const months = differenceInMonths(new Date(), new Date(installationDate));
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  }

  return `${years} year${years !== 1 ? 's' : ''} ${
    remainingMonths > 0 ? `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}` : ''
  }`;
}