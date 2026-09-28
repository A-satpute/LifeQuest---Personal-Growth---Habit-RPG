import { request } from './api';
import type { AuthResponse, UserResponse, LoginCredentials, RegisterCredentials, UpdateProfilePayload } from '../types/auth';

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  static async getMe(): Promise<UserResponse> {
    return request<UserResponse>('/auth/me', {
      method: 'GET',
    });
  }

  static async updateProfile(payload: UpdateProfilePayload): Promise<UserResponse> {
    return request<UserResponse>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }
}
