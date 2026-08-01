import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, AuthResponse, User, GoogleLoginRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor(private http: HttpClient, private router: Router) {}

  register(data: RegisterRequest) {
    return this.http.post<AuthResponse>(`${this.API}/register`, data).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  login(data: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.API}/login`, data).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  googleLogin(data: GoogleLoginRequest) {
    return this.http.post<AuthResponse>(`${this.API}/google`, data).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(`${this.API}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${this.API}/reset-password`, { token, newPassword });
  }

  getToken(): string | null { return localStorage.getItem('token'); }
  isLoggedIn(): boolean { return !!this.getToken(); }
  isAdmin(): boolean { return this.currentUser()?.role === 'Admin'; }
  isManager(): boolean { return this.currentUser()?.role === 'Manager'; }
  isAdminOrManager(): boolean { const role = this.currentUser()?.role; return role === 'Admin' || role === 'Manager'; }

  private storeAuth(res: AuthResponse) {
    localStorage.setItem('token', res.token);
    const user: User = { fullName: res.fullName, email: res.email, role: res.role, userId: res.userId };
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private getUserFromStorage(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }
}
