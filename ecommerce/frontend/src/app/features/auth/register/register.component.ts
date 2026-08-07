import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-left">
        <div class="brand-block">
          <div class="brand-logo">🛍️ ShopEase</div>
          <h2>Join 2 Lakh+<br>Happy Shoppers</h2>
          <p>Create your free account and unlock exclusive deals, easy order tracking, and a seamless shopping experience.</p>
        </div>
        <div class="perks">
          <div class="perk" *ngFor="let p of perks">
            <div class="perk-icon">{{ p.icon }}</div>
            <div>
              <h4>{{ p.title }}</h4>
              <p>{{ p.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="auth-right">
        <div class="auth-card">
          <div class="card-header">
            <h1>Create Account</h1>
            <p>Already have an account? <a routerLink="/auth/login">Sign in →</a></p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
            <div class="field-group">
              <label for="fullName">Full Name</label>
              <div class="input-wrap" [class.has-error]="form.get('fullName')?.invalid && form.get('fullName')?.touched">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input id="fullName" type="text" formControlName="fullName" placeholder="Rahul Sharma" autocomplete="name">
              </div>
              <p class="field-err" *ngIf="form.get('fullName')?.invalid && form.get('fullName')?.touched">Full name is required.</p>
            </div>

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
                <input id="password" [type]="showPw ? 'text' : 'password'" formControlName="password" placeholder="Minimum 6 characters" autocomplete="new-password">
                <button type="button" class="toggle-pw" (click)="showPw = !showPw">{{ showPw ? '🙈' : '👁' }}</button>
              </div>
              <div class="pw-strength" *ngIf="form.get('password')?.value?.length">
                <div class="bars">
                  <div class="bar" [class.fill]="pwStrength >= 1"></div>
                  <div class="bar" [class.fill]="pwStrength >= 2"></div>
                  <div class="bar" [class.fill]="pwStrength >= 3"></div>
                </div>
                <span [class]="'str-label str-' + pwStrength">{{ pwLabel }}</span>
              </div>
              <p class="field-err" *ngIf="form.get('password')?.invalid && form.get('password')?.touched">Password must be at least 6 characters.</p>
            </div>

            <div class="field-group">
              <label for="referralCode">Referral Code <span class="optional-tag">(optional)</span></label>
              <div class="input-wrap">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                <input id="referralCode" type="text" formControlName="referralCode" placeholder="e.g. RAHU0042" autocomplete="off">
              </div>
              <p class="field-hint" *ngIf="form.get('referralCode')?.value">You and your friend will both get ₹100 in loyalty points!</p>
            </div>

            <div *ngIf="error" class="error-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {{ error }}
            </div>

            <p class="terms">By creating an account, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</p>

            <button type="submit" class="btn-submit" [disabled]="form.invalid || loading">
              <span *ngIf="!loading">Create Free Account →</span>
              <span *ngIf="loading" class="spin-wrap">
                <span class="spinner"></span> Creating account...
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .auth-page { display: grid; grid-template-columns: 1fr 1fr; min-height: calc(100vh - 68px); }

    .auth-left {
      background: linear-gradient(145deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);
      padding: 4rem 3rem; display: flex; flex-direction: column; justify-content: center; gap: 3rem;
    }
    .brand-logo { font-size: 1.5rem; font-weight: 800; color: #a29bfe; margin-bottom: 1.5rem; }
    .brand-block h2 { font-size: 2rem; font-weight: 800; color: #fff; line-height: 1.25; margin-bottom: 0.75rem; }
    .brand-block p { color: rgba(255,255,255,0.55); font-size: 1rem; line-height: 1.7; }
    .perks { display: flex; flex-direction: column; gap: 1.25rem; }
    .perk { display: flex; align-items: flex-start; gap: 1rem; }
    .perk-icon { font-size: 1.3rem; width: 40px; height: 40px; background: rgba(108,99,255,0.25); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .perk h4 { color: #fff; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.2rem; }
    .perk p { color: rgba(255,255,255,0.45); font-size: 0.8rem; line-height: 1.5; margin: 0; }

    .auth-right { background: #f7f8fc; display: flex; align-items: center; justify-content: center; padding: 2rem; }
    .auth-card { background: #fff; border-radius: 24px; padding: 2.5rem; width: 100%; max-width: 420px; box-shadow: 0 8px 40px rgba(0,0,0,0.1); }
    .card-header { margin-bottom: 2rem; }
    .card-header h1 { font-size: 1.75rem; font-weight: 800; color: #1a1a2e; margin-bottom: 0.4rem; }
    .card-header p { font-size: 0.875rem; color: #888; }
    .card-header a { color: #6c63ff; text-decoration: none; font-weight: 600; }
    .card-header a:hover { text-decoration: underline; }

    .field-group { margin-bottom: 1.25rem; }
    .field-group label { display: block; font-size: 0.82rem; font-weight: 600; color: #555; margin-bottom: 0.55rem; text-transform: uppercase; letter-spacing: 0.4px; }
    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-icon { position: absolute; left: 0.85rem; color: #aaa; pointer-events: none; }
    .input-wrap input {
      width: 100%; padding: 0.8rem 0.85rem 0.8rem 2.5rem; border: 1.5px solid #e9ecef; border-radius: 12px;
      font-size: 0.9rem; outline: none; transition: border-color 0.18s; background: #f7f8fc; color: #2d3436;
    }
    .input-wrap input:focus { border-color: #6c63ff; background: #fff; box-shadow: 0 0 0 3px rgba(108,99,255,0.12); }
    .input-wrap.has-error input { border-color: #e17055; }
    .toggle-pw { position: absolute; right: 0.85rem; background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0; line-height: 1; }
    .field-err { font-size: 0.78rem; color: #e17055; margin-top: 0.4rem; }
    .optional-tag { text-transform: none; font-weight: 400; color: #aaa; letter-spacing: 0; }
    .field-hint { font-size: 0.78rem; color: #00b894; margin-top: 0.4rem; }

    .pw-strength { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
    .bars { display: flex; gap: 3px; }
    .bar { width: 28px; height: 4px; background: #e9ecef; border-radius: 2px; transition: background 0.2s; }
    .bar.fill:nth-child(1) { background: #e17055; }
    .bar.fill:nth-child(2) { background: #fdcb6e; }
    .bar.fill:nth-child(3) { background: #00b894; }
    .str-label { font-size: 0.75rem; font-weight: 600; }
    .str-1 { color: #e17055; }
    .str-2 { color: #fdcb6e; }
    .str-3 { color: #00b894; }

    .error-banner {
      display: flex; align-items: center; gap: 0.6rem;
      background: #fff5f5; border: 1.5px solid #ffcdd2; border-radius: 10px;
      padding: 0.75rem 1rem; color: #e17055; font-size: 0.875rem; font-weight: 500;
      margin-bottom: 1.25rem;
    }
    .terms { font-size: 0.78rem; color: #aaa; line-height: 1.6; margin-bottom: 1.25rem; }
    .terms a { color: #6c63ff; text-decoration: none; }

    .btn-submit {
      width: 100%; padding: 0.9rem; background: linear-gradient(135deg,#6c63ff,#a29bfe);
      color: #fff; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(108,99,255,0.38); }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    .spin-wrap { display: flex; align-items: center; justify-content: center; gap: 0.6rem; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 800px) {
      .auth-page { grid-template-columns: 1fr; }
      .auth-left { display: none; }
      .auth-right { padding: 1.5rem 1rem; }
      .auth-card { padding: 2rem 1.5rem; }
    }
  `]
})
export class RegisterComponent implements OnInit {
  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    referralCode: ['']
  });
  error = '';
  loading = false;
  showPw = false;

  perks = [
    { icon: '🎁', title: 'Exclusive Member Deals', desc: 'Early access to sales and special discounts just for members.' },
    { icon: '📦', title: 'Easy Order Tracking', desc: 'Track every order from placement to doorstep in real-time.' },
    { icon: '💳', title: 'Multiple Payment Options', desc: 'Pay securely with UPI, cards, net banking, or cash on delivery.' },
  ];

  get pwStrength(): number {
    const pw = this.form.get('password')?.value ?? '';
    if (pw.length < 6) return 1;
    if (pw.length < 10) return 2;
    return 3;
  }

  get pwLabel(): string {
    return ['', 'Weak', 'Good', 'Strong'][this.pwStrength];
  }

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toasts: ToastService
  ) {}

  ngOnInit() {
    const ref = this.route.snapshot.queryParamMap.get('ref');
    if (ref) this.form.patchValue({ referralCode: ref });
  }

  onSubmit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.auth.register(this.form.value as any).subscribe({
      next: () => { this.toasts.success('Account created! Welcome to ShopEase 🎉'); this.router.navigate(['/products']); },
      error: () => { this.error = 'Registration failed. This email may already be in use.'; this.loading = false; }
    });
  }
}
