
export interface User {
  id: string;
  email: string;
  role: 'superadmin' | 'rms';
  createdAt: Date;
  createdBy?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}
