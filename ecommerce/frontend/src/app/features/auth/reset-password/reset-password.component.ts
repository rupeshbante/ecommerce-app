import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="brand-block">
          <div class="brand-logo">🛍️ ShopEase</div>
          <h2>Create new password</h2>
          <p>Choose a strong password to keep your account safe.</p>
        </div>
        <div class="feature-list">
          <div class="feat-item"><span>🔒</span><span>Minimum 6 characters</span></div>
          <div class="feat-item"><span>✓</span><span>Use letters, numbers & symbols</span></div>
          <div class="feat-item"><span>🛡️</span><span>Your data is always encrypted</span></div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <ng-container *ngIf="!invalidToken && !success">
            <div class="card-header">
              <h1>New Password</h1>
              <p>Enter and confirm your new password below.</p>
            </div>

            <div class="field-group">
              <label>New Password</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="newPassword" placeholder="Min. 6 characters">
                <button type="button" class="toggle-pw" (click)="showPw = !showPw">{{ showPw ? '🙈' : '👁' }}</button>
              </div>
            </div>

            <div class="field-group">
              <label>Confirm Password</label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="confirmPassword" placeholder="Repeat password">
              </div>
              <p class="field-err" *ngIf="confirmPassword && newPassword !== confirmPassword">Passwords don't match.</p>
            </div>

            <div *ngIf="error" class="error-banner">{{ error }}</div>

            <button class="btn-submit" [disabled]="loading || !canSubmit()" (click)="submit()">
              {{ loading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </ng-container>

          <div *ngIf="invalidToken" class="state-box error-state">
            <div class="state-icon">⏰</div>
            <h2>Link Expired</h2>
            <p>This password reset link has expired or is invalid. Reset links are valid for 1 hour.</p>
            <a routerLink="/auth/forgot-password" class="btn-submit">Request New Link</a>
          </div>

          <div *ngIf="success" class="state-box success-state">
            <div class="state-icon">✅</div>
            <h2>Password Reset!</h2>
            <p>Your password has been updated successfully. You can now log in with your new password.</p>
            <a routerLink="/auth/login" class="btn-submit">Go to Login</a>
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
    .auth-right { background: #f7f8fc; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .auth-card { background: #fff; border-radius: 20px; padding: 2.5rem; width: 100%; max-width: 420px; box-shadow: 0 4px 30px rgba(0,0,0,0.08); }
    .card-header { margin-bottom: 2rem; }
    .card-header h1 { font-size: 1.6rem; font-weight: 800; color: #1a1a2e; margin-bottom: 0.4rem; }
    .card-header p { color: #888; font-size: 0.875rem; }
    .field-group { margin-bottom: 1.25rem; }
    .field-group label { display: block; font-size: 0.82rem; font-weight: 600; color: #555; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .input-wrap { position: relative; }
    .input-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #aaa; pointer-events: none; }
    .input-wrap input { width: 100%; padding: 0.8rem 2.5rem 0.8rem 2.5rem; border: 1.5px solid #e9ecef; border-radius: 12px; font-size: 0.9rem; outline: none; transition: border-color 0.18s; box-sizing: border-box; }
    .input-wrap input:focus { border-color: #6c63ff; }
    .toggle-pw { position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 1rem; }
    .field-err { color: #e17055; font-size: 0.8rem; margin-top: 0.35rem; }
    .error-banner { background: #fff5f5; border: 1.5px solid #ffcdd2; border-radius: 10px; padding: 0.75rem 1rem; color: #e17055; font-size: 0.875rem; margin-bottom: 1.25rem; }
    .btn-submit { width: 100%; background: #6c63ff; color: #fff; border: none; border-radius: 12px; padding: 0.9rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; text-align: center; text-decoration: none; display: block; margin-top: 1rem; }
    .btn-submit:hover:not(:disabled) { background: #5a52d5; }
    .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }
    .state-box { text-align: center; padding: 1rem 0; }
    .state-icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .state-box h2 { font-size: 1.4rem; font-weight: 800; color: #1a1a2e; margin-bottom: 0.75rem; }
    .state-box p { color: #666; margin-bottom: 1.5rem; line-height: 1.6; font-size: 0.9rem; }
    @media (max-width: 768px) { .auth-page { grid-template-columns: 1fr; } .auth-left { display: none; } }
  `]
})
export class ResetPasswordComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  showPw = false;
  loading = false;
  error = '';
  invalidToken = false;
  success = false;
  token = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.queryParams['token'] || '';
    if (!this.token) this.invalidToken = true;
  }

  canSubmit(): boolean {
    return this.newPassword.length >= 6 && this.newPassword === this.confirmPassword;
  }

  submit() {
    if (!this.canSubmit()) return;
    this.loading = true;
    this.error = '';
    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message || '';
        if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid'))
          this.invalidToken = true;
        else
          this.error = msg || 'Something went wrong. Please try again.';
      }
    });
  }
}
