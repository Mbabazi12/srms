export type UserRole = 'landlord' | 'tenant';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface AuthUser extends User {
  passwordHash: string;
}

export interface PropertyUnit {
  unitId: string;
  unitName: string;
  tenantId?: string;
  tenantName?: string;
  status: 'vacant' | 'occupied';
}

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  status: 'vacant' | 'occupied' | 'partial';
  propertyType: 'single' | 'apartment';
  units: PropertyUnit[];
  landlordId: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface Payment {
  id: string;
  amount: number;
  status: PaymentStatus;
  date?: string;
  dueDate: string;
  propertyId: string;
  tenantId: string;
  landlordId: string;
  month: string;
  notes?: string;
  createdAt: string;
}

export type MaintenanceStatus = 'pending' | 'in_progress' | 'resolved' | 'rejected';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface MaintenanceRequest {
  id: string;
  title: string;
  issue: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  tenantId: string;
  propertyId: string;
  landlordId: string;
  notes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type MessageType = 'urgent' | 'warning' | 'announcement' | 'normal';

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  receiverIds: string[];
  messageText: string;
  messageType: MessageType;
  readByIds: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  userId: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

export interface DashboardStats {
  totalProperties?: number;
  occupiedUnits?: number;
  vacantUnits?: number;
  totalRentCollected?: number;
  pendingPaymentsCount?: number;
  pendingPaymentsAmount?: number;
  maintenanceCount?: number;
  currentRentStatus?: PaymentStatus;
  nextDueDate?: string;
  rentAmount?: number;
  activeRequests?: number;
  myProperty?: Property | null;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}
