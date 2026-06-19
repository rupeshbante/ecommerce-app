import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="brand-block">
          <div class="brand-logo">🛍️ ShopEase</div>
          <h2>Forgot your password?</h2>
          <p>No worries! Enter your email and we'll send you a reset link.</p>
        </div>
        <div class="feature-list">
          <div class="feat-item"><span class="feat-icon">🔒</span><span>Secure reset link sent to your email</span></div>
          <div class="feat-item"><span class="feat-icon">⏱️</span><span>Link expires in 1 hour for security</span></div>
          <div class="feat-item"><span class="feat-icon">✉️</span><span>Check spam folder if not in inbox</span></div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <ng-container *ngIf="!sent">
            <div class="card-header">
              <h1>Reset Password</h1>
              <p>Remember your password? <a routerLink="/auth/login">Sign in →</a></p>
            </div>

            <div class="field-group">
              <label for="email">Email Address</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                <input id="email" type="email" [(ngModel)]="email" placeholder="you@example.com" autocomplete="email">
              </div>
            </div>

            <div *ngIf="error" class="error-banner">{{ error }}</div>

            <button class="btn-submit" [disabled]="loading || !email" (click)="submit()">
              {{ loading ? 'Sending...' : 'Send Reset Link' }}
            </button>

            <div class="divider-text"><span>or</span></div>
            <a routerLink="/auth/register" class="btn-secondary">Create new account</a>
          </ng-container>

          <div *ngIf="sent" class="success-state">
            <div class="success-icon">✉️</div>
            <h2>Check your email</h2>
            <p>We've sent a password reset link to <strong>{{ email }}</strong></p>
            <p class="hint">Didn't receive it? Check your spam folder or <button class="link-btn" (click)="sent = false">try again</button>.</p>
            <a routerLink="/auth/login" class="btn-submit">Back to Login</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .auth-page { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
    .auth-left { background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 3rem; display: flex; flex-direction: column; justify-content: center; }
    .brand-logo { font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 2rem; }
    .brand-block h2 { font-size: 1.8rem; font-weight: 800; color: #fff; margin-bottom: 0.75rem; }
    .brand-block p { color: rgba(255,255,255,0.6); line-height: 1.6; }
    .feature-list { margin-top: 3rem; display: flex; flex-direction: column; gap: 1rem; }
    .feat-item { display: flex; align-items: center; gap: 1rem; color: rgba(255,255,255,0.75); font-size: 0.9rem; }
    .feat-icon { font-size: 1.2rem; }
    .auth-right { background: #f7f8fc; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .auth-card { background: #fff; border-radius: 20px; padding: 2.5rem; width: 100%; max-width: 420px; box-shadow: 0 4px 30px rgba(0,0,0,0.08); }
    .card-header { margin-bottom: 2rem; }
    .card-header h1 { font-size: 1.6rem; font-weight: 800; color: #1a1a2e; margin-bottom: 0.4rem; }
    .card-header p { color: #888; font-size: 0.875rem; }
    .card-header a { color: #6c63ff; text-decoration: none; font-weight: 600; }
    .field-group { margin-bottom: 1.25rem; }
    .field-group label { display: block; font-size: 0.82rem; font-weight: 600; color: #555; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .input-wrap { position: relative; }
    .input-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #aaa; pointer-events: none; }
    .input-wrap input { width: 100%; padding: 0.8rem 0.85rem 0.8rem 2.5rem; border: 1.5px solid #e9ecef; border-radius: 12px; font-size: 0.9rem; outline: none; transition: border-color 0.18s; box-sizing: border-box; }
    .input-wrap input:focus { border-color: #6c63ff; }
    .error-banner { background: #fff5f5; border: 1.5px solid #ffcdd2; border-radius: 10px; padding: 0.75rem 1rem; color: #e17055; font-size: 0.875rem; margin-bottom: 1.25rem; }
    .btn-submit { width: 100%; background: #6c63ff; color: #fff; border: none; border-radius: 12px; padding: 0.9rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; text-align: center; text-decoration: none; display: block; }
    .btn-submit:hover:not(:disabled) { background: #5a52d5; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }
    .divider-text { text-align: center; margin: 1rem 0; color: #ccc; font-size: 0.8rem; position: relative; }
    .divider-text::before, .divider-text::after { content: ''; position: absolute; top: 50%; width: 42%; height: 1px; background: #e9ecef; }
    .divider-text::before { left: 0; }
    .divider-text::after { right: 0; }
    .btn-secondary { display: block; text-align: center; padding: 0.85rem; background: #f7f8fc; border: 1.5px solid #e9ecef; border-radius: 12px; color: #555; font-size: 0.9rem; font-weight: 600; text-decoration: none; transition: all 0.18s; }
    .btn-secondary:hover { border-color: #6c63ff; color: #6c63ff; }
    .success-state { text-align: center; padding: 1rem 0; }
    .success-icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .success-state h2 { font-size: 1.4rem; font-weight: 800; color: #1a1a2e; margin-bottom: 0.75rem; }
    .success-state p { color: #666; margin-bottom: 0.5rem; font-size: 0.9rem; line-height: 1.6; }
    .hint { color: #aaa !important; font-size: 0.8rem !important; margin-bottom: 2rem !important; }
    .link-btn { background: none; border: none; color: #6c63ff; cursor: pointer; font-size: inherit; text-decoration: underline; padding: 0; }
    @media (max-width: 768px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-left { display: none; }
    }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  sent = false;
  error = '';

  constructor(private authService: AuthService, private toasts: ToastService) {}

  submit() {
    if (!this.email.trim()) return;
    this.loading = true;
    this.error = '';
    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: () => { this.sent = true; this.loading = false; },
      error: () => { this.error = 'Something went wrong. Please try again.'; this.loading = false; }
    });
  }
}
