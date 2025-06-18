
export interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'rms';
  firstName?: string;
  lastName?: string;
  shortName?: string;
  permissions?: Record<string, boolean>;
  createdAt: Date;
  createdBy?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
