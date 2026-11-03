export type AppointmentStatus =
  | 'confirmed'
  | 'checked-in'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  color: string;
  phone: string;
  workingHours: {
    start: string; // e.g., "09:00"
    end: string;   // e.g., "18:00"
  };
  rating: number;
  active: boolean;
}

export interface ServiceItem {
  id: string;
  name: string;
  category: 'Consultation' | 'Treatment' | 'Grooming' | 'Diagnostics' | 'Wellness';
  durationMinutes: number;
  price: number;
  depositRequired: number;
  description: string;
  bufferMinutes: number;
}

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reorderLevel: number;
}

export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  totalVisits: number;
  noShowCount: number;
  totalSpent: number;
  lastVisitDate: string;
  preferredStaffId?: string;
}

export interface Appointment {
  id: string;
  referenceCode: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  staffId: string;
  serviceId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24h)
  endTime: string; // HH:mm (24h)
  status: AppointmentStatus;
  notes: string;
  price: number;
  depositPaid: boolean;
  paymentMethod?: 'Cash' | 'Card' | 'UPI / QR' | 'Unpaid';
  addonProducts?: { productId: string; name: string; price: number; qty: number }[];
  createdAt: string;
}
