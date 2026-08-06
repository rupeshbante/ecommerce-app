import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="brand-block">
          <div class="brand-logo">🛍️ ShopEase</div>
          <h2>Welcome back!</h2>
          <p>Sign in to access your orders, wishlist, and exclusive deals.</p>
        </div>
        <div class="feature-list">
          <div class="feat-item"><span class="feat-icon">🚚</span><span>Free delivery on orders above ₹500</span></div>
          <div class="feat-item"><span class="feat-icon">↩️</span><span>30-day easy returns</span></div>
          <div class="feat-item"><span class="feat-icon">🔒</span><span>Secure payments & data privacy</span></div>
          <div class="feat-item"><span class="feat-icon">🎁</span><span>Exclusive member deals and offers</span></div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <div class="card-header">
            <h1>Sign In</h1>
            <p>Don't have an account? <a routerLink="/auth/register">Create one free →</a></p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate *ngIf="!otpStep">
            <div class="field-group">
              <label for="email">Email Address</label>
              <div class="input-wrap" [class.has-error]="form.get('email')?.invalid && form.get('email')?.touched">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
                <input id="email" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email">
              </div>
              <p class="field-err" *ngIf="form.get('email')?.invalid && form.get('email')?.touched">Please enter a valid email.</p>
            </div>

            <div class="field-group">
              <label for="password">Password</label>
              <div class="input-wrap" [class.has-error]="form.get('password')?.invalid && form.get('password')?.touched">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input id="password" [type]="showPw ? 'text' : 'password'" formControlName="password" placeholder="Your password" autocomplete="current-password">
                <button type="button" class="toggle-pw" (click)="showPw = !showPw">{{ showPw ? '🙈' : '👁' }}</button>
              </div>
              <p class="field-err" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">Password is required.</p>
            </div>

            <div *ngIf="sessionExpired" class="session-banner">
              🔒 Session expire ho gayi. Please login karen.
            </div>

            <div *ngIf="error" class="error-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ error }}
            </div>

            <div class="forgot-link">
              <a routerLink="/auth/forgot-password">Forgot your password?</a>
            </div>

            <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
              <span *ngIf="!loading">Sign In →</span>
              <span *ngIf="loading" class="spin-wrap">
                <span class="spinner"></span> Signing in...
              </span>
            </button>
          </form>

          <!-- OTP step -->
          <form (ngSubmit)="verifyOtp()" novalidate *ngIf="otpStep">
            <p class="otp-hint">We've sent a 6-digit code to <strong>{{ otpEmail }}</strong>. It expires in 5 minutes.</p>
            <div class="field-group">
              <label for="otp">Login Code</label>
              <div class="input-wrap">
                <input id="otp" [(ngModel)]="otpCode" name="otpCode" placeholder="123456" maxlength="6" inputmode="numeric" class="otp-input" autocomplete="one-time-code">
              </div>
            </div>

            <div *ngIf="error" class="error-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ error }}
            </div>

            <button type="submit" class="btn-submit" [disabled]="otpCode.length !== 6 || loading">
              <span *ngIf="!loading">Verify &amp; Sign In →</span>
              <span *ngIf="loading" class="spin-wrap"><span class="spinner"></span> Verifying...</span>
            </button>

            <div class="otp-actions">
              <button type="button" class="link-btn" [disabled]="resendCooldown > 0" (click)="resendCode()">
                {{ resendCooldown > 0 ? 'Resend code (' + resendCooldown + 's)' : 'Resend code' }}
              </button>
              <button type="button" class="link-btn" (click)="otpStep = false; error = ''">← Back to login</button>
            </div>
          </form>

          <div class="divider" *ngIf="!otpStep"><span>or continue with</span></div>
          <div class="social-btns" *ngIf="!otpStep">
            <button class="social-btn" (click)="loginWithGoogle()">
              <svg class="google-icon" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.6 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.4 18.9 12 24 12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.5 6.6 29.5 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.1 35.4 26.6 36 24 36c-5.2 0-9.7-3.3-11.4-8l-6.5 5C9.5 39.4 16.3 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C37 37.3 44 32 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .auth-page { display: grid; grid-template-columns: 1fr 1fr; min-height: calc(100vh - 68px); }

    /* Left panel */
    .auth-left {
      background: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      padding: 4rem 3rem; display: flex; flex-direction: column; justify-content: center; gap: 3rem;
    }
    .brand-logo { font-size: 1.5rem; font-weight: 800; color: #a29bfe; margin-bottom: 1.5rem; }
    .brand-block h2 { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 0.75rem; line-height: 1.25; }
    .brand-block p { color: rgba(255,255,255,0.55); font-size: 1rem; line-height: 1.7; }
    .feature-list { display: flex; flex-direction: column; gap: 1rem; }
    .feat-item { display: flex; align-items: center; gap: 1rem; }
    .feat-icon { font-size: 1.2rem; width: 36px; height: 36px; background: rgba(108,99,255,0.25); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .feat-item span:last-child { color: rgba(255,255,255,0.65); font-size: 0.9rem; }

    /* Right panel */
    .auth-right { background: #f7f8fc; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .auth-card { background: #fff; border-radius: 24px; padding: 2.5rem; width: 100%; max-width: 420px; box-shadow: 0 8px 40px rgba(0,0,0,0.1); }
    .card-header { margin-bottom: 2rem; }
    .card-header h1 { font-size: 1.75rem; font-weight: 800; color: #1a1a2e; margin-bottom: 0.4rem; }
    .card-header p { font-size: 0.875rem; color: #888; }
    .card-header a { color: #6c63ff; text-decoration: none; font-weight: 600; }
    .card-header a:hover { text-decoration: underline; }

    /* Form fields */
    .field-group { margin-bottom: 1.25rem; }
    .field-group label { display: block; font-size: 0.82rem; font-weight: 600; color: #555; margin-bottom: 0.55rem; text-transform: uppercase; letter-spacing: 0.4px; }
    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 0.85rem; color: #aaa; pointer-events: none; flex-shrink: 0; }
    .input-wrap input {
      width: 100%; padding: 0.8rem 0.85rem 0.8rem 2.5rem; border: 1.5px solid #e9ecef; border-radius: 12px;
      font-size: 0.9rem; outline: none; transition: border-color 0.18s; color: #2d3436; background: #f7f8fc;
    }
    .input-wrap input:focus { border-color: #6c63ff; background: #fff; box-shadow: 0 0 0 3px rgba(108,99,255,0.12); }
    .input-wrap.has-error input { border-color: #e17055; }
    .toggle-pw { position: absolute; right: 0.85rem; background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0; line-height: 1; }
    .field-err { font-size: 0.78rem; color: #e17055; margin-top: 0.4rem; }

    .session-banner {
      background: #fff8e1; border: 1.5px solid #ffe082; border-radius: 10px;
      padding: 0.75rem 1rem; color: #f39c12; font-size: 0.875rem; font-weight: 500;
      margin-bottom: 1rem;
    }
    .error-banner {
      display: flex; align-items: center; gap: 0.6rem;
      background: #fff5f5; border: 1.5px solid #ffcdd2; border-radius: 10px;
      padding: 0.75rem 1rem; color: #e17055; font-size: 0.875rem; font-weight: 500;
      margin-bottom: 1.25rem;
    }

    .btn-submit {
      width: 100%; padding: 0.9rem; background: linear-gradient(135deg,#6c63ff,#a29bfe);
      color: #fff; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s; margin-top: 0.5rem;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(108,99,255,0.38); }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    .spin-wrap { display: flex; align-items: center; justify-content: center; gap: 0.6rem; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .otp-hint { font-size: 0.875rem; color: #555; margin-bottom: 1.25rem; line-height: 1.6; }
    .otp-input { letter-spacing: 6px; font-size: 1.2rem; font-weight: 700; text-align: center; padding-left: 0.85rem !important; }
    .otp-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; }
    .link-btn { background: none; border: none; color: #6c63ff; font-size: 0.82rem; font-weight: 600; cursor: pointer; padding: 0; }
    .link-btn:disabled { color: #bbb; cursor: not-allowed; }

    .divider { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0; color: #ccc; font-size: 0.8rem; }
    .divider::before, .divider::after { content: ''; flex: 1; border-top: 1px solid #e9ecef; }
    .social-btns { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    .social-btn { padding: 0.7rem; border: 1.5px solid #e9ecef; border-radius: 10px; background: #fff; font-size: 0.875rem; cursor: pointer; color: #333; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.18s; }
    .social-btn:hover { border-color: #6c63ff; background: #f5f3ff; }
    .google-icon { width: 18px; height: 18px; }

    @media (max-width: 800px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-left { display: none; }
      .auth-right { padding: 1.5rem 1rem; }
      .auth-card { padding: 2rem 1.5rem; }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  error = '';
  loading = false;
  showPw = false;
  sessionExpired = false;

  otpStep = false;
  otpEmail = '';
  otpCode = '';
  resendCooldown = 0;
  private cooldownTimer: any;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toasts: ToastService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['reason'] === 'session_expired') {
        this.sessionExpired = true;
        this.toasts.info('Session expired. Please login again.');
      }
    });
  }

  ngOnDestroy() {
    clearInterval(this.cooldownTimer);
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.value as any).subscribe({
      next: res => {
        this.loading = false;
        if (res.requiresOtp) {
          this.otpStep = true;
          this.otpEmail = res.email || this.form.value.email;
          this.otpCode = '';
          this.startCooldown();
          this.toasts.info('Enter the code we emailed you to finish signing in.');
        } else {
          this.toasts.success('Welcome back! 👋');
          this.router.navigate(['/products']);
        }
      },
      error: () => { this.error = 'Invalid email or password. Please try again.'; this.loading = false; }
    });
  }

  verifyOtp() {
    if (this.otpCode.length !== 6) return;
    this.loading = true;
    this.error = '';
    this.auth.verifyOtp(this.otpEmail, this.otpCode).subscribe({
      next: () => { this.toasts.success('Welcome back! 👋'); this.router.navigate(['/products']); },
      error: (err) => {
        this.error = err.error?.message || 'Invalid or expired code.';
        this.loading = false;
      }
    });
  }

  resendCode() {
    if (this.resendCooldown > 0) return;
    this.auth.resendOtp(this.otpEmail).subscribe(() => this.toasts.info('A new code has been sent.'));
    this.startCooldown();
  }

  private startCooldown() {
    this.resendCooldown = 30;
    clearInterval(this.cooldownTimer);
    this.cooldownTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) clearInterval(this.cooldownTimer);
    }, 1000);
  }

  loginWithGoogle() {
    const w = window as any;
    if (!w.google?.accounts?.id) {
      this.toasts.info('Google Sign-In not configured. Please set GOOGLE_CLIENT_ID in settings.');
      return;
    }
    w.google.accounts.id.initialize({
      client_id: '', // Set in environment.ts or config
      callback: (response: any) => {
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        this.auth.googleLogin({ googleId: payload.sub, email: payload.email, fullName: payload.name, photoUrl: payload.picture }).subscribe({
          next: () => { this.toasts.success('Logged in with Google! 🎉'); this.router.navigate(['/products']); },
          error: () => { this.error = 'Google login failed. Please try again.'; }
        });
      }
    });
    w.google.accounts.id.prompt();
  }
}
