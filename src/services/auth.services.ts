// services/auth.service.ts
import { apiClient } from './api';
import { UserContext } from '../types';

export class AuthService {
  async login(username: string, password: string): Promise<UserContext> {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const data = await apiClient.post('auth/login', formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });

      return data;
    } catch (error) {
      throw new Error((error as Error).message || 'Login failed');
    }
  }

  logout(): void {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userId");
    window.location.replace("/");
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem("token");
  }

  getToken(): string | null {
    return sessionStorage.getItem("token");
  }
}

export const authService = new AuthService();