export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  logoUrl?: string | null;
  role?: WorkspaceRole;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isSuperAdmin?: boolean;
}

export interface Company {
  id: string;
  name: string;
  legalName?: string | null;
  document?: string | null;
  category?: string | null;
  description?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  whatsappVerified?: boolean;
  email?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  isActive: boolean;
  score?: number;
  scoreLabel?: string;
  source?: string | null;
  sourceUrl?: string | null;
  createdAt: string;
}

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST" | "ARCHIVED";

export interface Lead {
  id: string;
  workspaceId: string;
  companyId: string;
  status: LeadStatus;
  notes?: string | null;
  score: number;
  scoreLabel?: string | null;
  lastContactAt?: string | null;
  createdAt: string;
  company: Company;
  tags: Array<{ id: string; tag: { id: string; name: string; color?: string | null } }>;
  lists?: Array<{ id: string; list: { id: string; name: string; color?: string | null } }>;
  assignee?: { id: string; name: string; email: string } | null;
}

export interface Tag {
  id: string;
  name: string;
  color?: string | null;
}

export interface LeadList {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  _count?: { items: number };
}

export interface Search {
  id: string;
  keyword: string;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  category?: string | null;
  quantity: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  resultsCount: number;
  savedCount: number;
  createdAt: string;
  completedAt?: string | null;
}

export interface DashboardData {
  companies: { total: number };
  leads: { total: number; thisMonth: number };
  searches: { total: number };
  quality: { phone: number; whatsapp: number; email: number; website: number };
  credits: { balance: number; lifetime: number };
  exports: { total: number };
}
