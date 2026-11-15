export type InventoryItemStatus = 'neuf' | 'bon_etat' | 'usage' | 'endommage' | 'en_reparation' | 'hors_service';

export interface InventoryAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  quantity: number;
  status: InventoryItemStatus;
  assignedAt: string;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  type: 'entree' | 'affectation' | 'restitution' | 'maintenance' | 'declassement' | 'don';
  date: string;
  quantity: number;
  performedBy: string;
  recipientName?: string;
  employeeId?: string;
  itemStatus?: InventoryItemStatus;
  notes?: string;
}

export interface InventoryReturnRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  returnDate: string;
  quantity: number;
  returnCondition: 'parfait_etat' | 'usure_normale' | 'endommage' | 'incomplet' | 'hors_service';
  observations?: string;
  recordedBy: string;
}

export interface InventoryDonationRecord {
  id: string;
  itemId: string;
  itemDesignation: string;
  beneficiaryName: string;
  beneficiaryType: 'association' | 'ecole' | 'collaborateur' | 'partenaire' | 'autre';
  donationDate: string;
  quantity: number;
  estimatedValue?: number;
  motive: string;
  approvedBy: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  designation: string;
  quantity: number;
  quantitiesByStatus?: Partial<Record<InventoryItemStatus, number>>;
  status: InventoryItemStatus;
  location: string;
  category?: string;
  reference?: string;
  serialNumber?: string;
  unitPrice?: number;
  assignedToId?: string;
  assignments?: InventoryAssignment[];
  movements?: InventoryMovement[];
  returns?: InventoryReturnRecord[];
  donations?: InventoryDonationRecord[];
  isDonated?: boolean;
  donatedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PartnerCategory = 'Motoman' | 'Taximan' | 'Particulier' | 'Fournisseur' | 'Prestataire' | 'Autre';
export type PartnerStatus = 'actif' | 'inactif' | 'futur_partenaire';

export interface Partner {
  id: string;
  lastName: string;
  firstName: string;
  phone: string;
  email?: string;
  category: PartnerCategory;
  status: PartnerStatus;
  address?: string;
  notes?: string;
  createdAt: string;
}
