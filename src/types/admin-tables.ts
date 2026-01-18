export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string | null;
  status: 'open' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  resolved_at: string | null;
  profile?: {
    name: string | null;
    email: string | null;
  } | null;
}

export interface SystemSettings {
  id: number;
  booking_fee: number;
  maintenance_mode: boolean;
  allow_registrations: boolean;
  updated_at: string;
}

export interface Broadcast {
  id: string;
  title: string;
  message: string;
  target_role: 'all' | 'instructor' | 'student';
  sent_by: string;
  created_at: string;
}
