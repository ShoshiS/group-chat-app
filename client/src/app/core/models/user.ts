export type UserRole = 'user' | 'admin';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
