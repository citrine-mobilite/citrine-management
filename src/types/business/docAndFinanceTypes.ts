export interface NotificationLog {
  id: string;
  type: 'whatsapp' | 'email' | 'system';
  recipient: string;
  targetUserId?: string;
  title: string;
  content: string;
  message?: string;
  payload: string;
  timestamp: string;
  read?: boolean;
  link?: string;
  senderName?: string;
}

export type DocumentFormatType = 'word' | 'excel';
export type DocumentCategory =
  | 'memo'
  | 'contract'
  | 'attestation'
  | 'certificate'
  | 'amendment'
  | 'internship'
  | 'mission'
  | 'discharge'
  | 'disciplinary'
  | 'job_description'
  | 'regulation'
  | 'evaluation'
  | 'procedure'
  | 'report'
  | 'proforma'
  | 'other';

export interface TemplateField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'select';
  defaultValue: string;
  options?: string[];
  placeholder?: string;
}

export interface RHDocTemplate {
  id: string;
  name: string;
  category: DocumentCategory;
  formatType: DocumentFormatType;
  description: string;
  fields: TemplateField[];
  bodyTemplate: string;
  defaultSignature?: boolean;
  isCustom?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  description?: string;
  category: DocumentCategory;
  formatType?: DocumentFormatType;
  content?: string;
  createdAt: string;
  authorId?: string;
  templateId?: string;
  templateParams?: Record<string, any>;
  metadata?: any;
  employeeId?: string;
  employeeName?: string;
  targetDate?: string;
  targetReason?: string;
  isGeneric?: boolean;
  saveToDatabase?: boolean;
  includeSignature?: boolean;
  signatureType?: 'none' | 'collaborator_only' | 'direction_only' | 'both';
}

export interface EmployeeSalaryDebt {
  id: string;
  employeeId: string;
  employeeName: string;
  totalLoanAmount: number;
  monthlyInstallment: number;
  totalMonths: number;
  installmentNumber: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'cancelled';
  reason: string;
  createdAt: string;
  paidAt?: string;
  paymentMethod?: 'salary_deduction' | 'manual_cash';
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  period: string;
  baseAmount: number;
  bonusAmount: number;
  advanceAmount: number;
  deductions: number;
  netAmount: number;
  status: 'draft' | 'approved' | 'paid';
  paymentMethod: 'transfer' | 'cash' | 'check' | 'other';
  paidAt?: string;
  notes?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense' | 'salary';
  category: string;
  amount: number;
  description: string;
  recipientOrSource?: string;
  status: 'draft' | 'validated';
  proofUrl?: string;
  proofFileName?: string;
}
