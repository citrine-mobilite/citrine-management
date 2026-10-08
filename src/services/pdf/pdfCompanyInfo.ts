export interface CompanyInfo {
  name: string;
  subTitle: string;
  baseline?: string;
  registrationNumber?: string;
  nui?: string;
  rccm?: string;
  capital?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}

export const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'CITRINE SARL',
  subTitle: 'Société à Responsabilité Limitée',
  baseline: 'Innovating · Prospering | Improving · Inspiring',
  nui: 'M012618579246S',
  rccm: 'CM-DLA-01-2026-B13-00011',
  capital: '10 000 000 FRANCS CFA',
  address: 'JAPOMA – DOUALA',
  city: 'Douala',
  country: 'Cameroun',
  phone: '+237 680 59 40 77',
  email: 'info@citrine-mobilite.com',
};

export function formatCurrency(amount: number = 0): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}
