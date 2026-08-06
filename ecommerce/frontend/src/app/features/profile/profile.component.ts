import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AddressService } from '../../core/services/address.service';
import { ReferralService } from '../../core/services/referral.service';
import { LoyaltyService } from '../../core/services/loyalty.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Address, CreateAddress } from '../../core/models/address.models';
import { LoyaltyBalance, LoyaltyTransaction } from '../../core/models/loyalty.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="header-inner">
        <h1>My Profile</h1>
        <nav class="breadcrumb">
          <a routerLink="/">Home</a><span>/</span><span>Profile</span>
        </nav>
      </div>
    </div>

    <div class="container">
      <!-- Tabs -->
      <div class="tabs">
        <button [class.active]="tab === 'addresses'" (click)="tab='addresses'">Address Book</button>
        <button [class.active]="tab === 'referral'" (click)="tab='referral'; loadReferral()">Refer & Earn</button>
        <button [class.active]="tab === 'loyalty'" (click)="tab='loyalty'; loadLoyalty()">Loyalty Points</button>
        <button [class.active]="tab === 'security'" (click)="tab='security'; loadSecurity()">Security</button>
      </div>

      <!-- ADDRESS BOOK -->
      <div *ngIf="tab === 'addresses'">
        <div class="section-header">
          <h2>Saved Addresses</h2>
          <button class="btn-add" (click)="showForm = true; editingId = null; resetForm()">+ Add New Address</button>
        </div>

        <!-- Add/Edit Form -->
        <div class="addr-form" *ngIf="showForm">
          <h3>{{ editingId ? 'Edit' : 'Add' }} Address</h3>
          <div class="form-grid">
            <div class="field">
              <label>Label</label>
              <select [(ngModel)]="form.label">
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="field">
              <label>Full Name *</label>
              <input [(ngModel)]="form.fullName" placeholder="Recipient's full name">
            </div>
            <div class="field">
              <label>Phone *</label>
              <input [(ngModel)]="form.phone" placeholder="+91 98765 43210">
            </div>
            <div class="field full">
              <label>Address Line 1 *</label>
              <input [(ngModel)]="form.addressLine1" placeholder="House/Flat No., Street">
            </div>
            <div class="field full">
              <label>Address Line 2</label>
              <input [(ngModel)]="form.addressLine2" placeholder="Area, Landmark (optional)">
            </div>
            <div class="field">
              <label>City *</label>
              <input [(ngModel)]="form.city" placeholder="City">
            </div>
            <div class="field">
              <label>State *</label>
              <input [(ngModel)]="form.state" placeholder="State">
            </div>
            <div class="field">
              <label>Pincode *</label>
              <input [(ngModel)]="form.pincode" placeholder="6-digit Pincode">
            </div>
            <div class="field">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="form.isDefault">
                Set as default address
              </label>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-save" (click)="saveAddress()" [disabled]="saving">
              {{ saving ? 'Saving...' : 'Save Address' }}
            </button>
            <button class="btn-cancel" (click)="showForm = false">Cancel</button>
          </div>
        </div>

        <!-- Address List -->
        <div class="addr-list" *ngIf="!loading">
          <div *ngIf="addresses.length === 0 && !showForm" class="empty-addr">
            <p>No saved addresses yet. Add one to speed up checkout!</p>
          </div>
          <div class="addr-card" *ngFor="let addr of addresses" [class.default]="addr.isDefault">
            <div class="addr-badge" *ngIf="addr.isDefault">Default</div>
            <div class="addr-label">{{ addr.label }}</div>
            <p class="addr-name">{{ addr.fullName }}</p>
            <p class="addr-text">{{ addr.addressLine1 }}, {{ addr.addressLine2 ? addr.addressLine2 + ', ' : '' }}{{ addr.city }}, {{ addr.state }} - {{ addr.pincode }}</p>
            <p class="addr-phone">📞 {{ addr.phone }}</p>
            <div class="addr-actions">
              <button class="btn-edit" (click)="editAddress(addr)">Edit</button>
              <button class="btn-default" *ngIf="!addr.isDefault" (click)="setDefault(addr.id)">Set Default</button>
              <button class="btn-del" (click)="deleteAddress(addr.id)">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- REFER & EARN -->
      <div *ngIf="tab === 'referral'" class="referral-section">
        <div class="ref-hero">
          <h2>Refer Friends & Earn ₹100</h2>
          <p>Share your unique referral code. When a friend signs up using your code, you both get ₹100 in loyalty points!</p>
        </div>

        <div class="ref-code-card" *ngIf="referralCode">
          <span class="code-label">Your Referral Code</span>
          <div class="code-box">
            <span class="code">{{ referralCode }}</span>
            <button class="btn-copy" (click)="copyCode()">{{ copied ? 'Copied!' : 'Copy' }}</button>
          </div>
          <p class="share-text">Share link: shopease.in/register?ref={{ referralCode }}</p>
        </div>

        <div class="ref-code-card">
          <span class="code-label">Have a Friend's Code?</span>
          <div class="code-box">
            <input [(ngModel)]="applyCodeInput" placeholder="Enter referral code" class="apply-code-input" [disabled]="applyingCode">
            <button class="btn-copy" (click)="applyReferralCode()" [disabled]="applyingCode || !applyCodeInput.trim()">
              {{ applyingCode ? 'Applying...' : 'Redeem' }}
            </button>
          </div>
        </div>

        <div class="ref-stats" *ngIf="refStats">
          <div class="stat-box">
            <span class="stat-num">{{ refStats.totalReferrals }}</span>
            <span class="stat-label">Total Referrals</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">{{ refStats.usedReferrals }}</span>
            <span class="stat-label">Successful</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">₹{{ refStats.totalEarned }}</span>
            <span class="stat-label">Total Earned</span>
          </div>
        </div>

        <div class="how-it-works">
          <h3>How it works</h3>
          <div class="steps">
            <div class="step"><span class="step-num">1</span><p>Share your code with friends</p></div>
            <div class="step"><span class="step-num">2</span><p>Friend registers using your code</p></div>
            <div class="step"><span class="step-num">3</span><p>Both of you get ₹100 in loyalty points!</p></div>
          </div>
        </div>
      </div>

      <!-- LOYALTY POINTS -->
      <div *ngIf="tab === 'loyalty'" class="referral-section">
        <div class="ref-hero loyalty-hero">
          <h2>Your Loyalty Points</h2>
          <p>Earn 1 point for every ₹10 you spend. Every point delivered is worth ₹1 off your next order.</p>
        </div>

        <div class="ref-stats" *ngIf="loyaltyBalance">
          <div class="stat-box">
            <span class="stat-num">{{ loyaltyBalance.points }}</span>
            <span class="stat-label">Points Balance</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">₹{{ loyaltyBalance.valueInRupees }}</span>
            <span class="stat-label">Redeemable Value</span>
          </div>
        </div>

        <div class="how-it-works">
          <h3>Recent Activity</h3>
          <div *ngIf="loyaltyHistory.length === 0" class="empty-addr">
            <p>No points activity yet. Place and receive an order to start earning!</p>
          </div>
          <div class="loyalty-row" *ngFor="let t of loyaltyHistory">
            <div>
              <span class="loyalty-reason">{{ t.reason === 'OrderDelivered' ? 'Earned from order' + (t.orderId ? ' #' + t.orderId : '') : 'Redeemed at checkout' + (t.orderId ? ' on order #' + t.orderId : '') }}</span>
              <span class="loyalty-date">{{ t.createdAt | date:'dd MMM yyyy' }}</span>
            </div>
            <span [class]="'loyalty-points ' + (t.points >= 0 ? 'positive' : 'negative')">{{ t.points >= 0 ? '+' : '' }}{{ t.points }}</span>
          </div>
        </div>
      </div>

      <!-- SECURITY -->
      <div *ngIf="tab === 'security'" class="security-section">
        <div class="sec-card">
          <div class="sec-info">
            <h3>Two-Factor Authentication</h3>
            <p>Add an extra layer of security. When enabled, we'll email you a 6-digit code to enter every time you sign in.</p>
          </div>
          <label class="switch">
            <input type="checkbox" [checked]="twoFactorEnabled" [disabled]="loadingSecurity" (change)="toggleTwoFactor($any($event.target).checked)">
            <span class="slider"></span>
          </label>
        </div>
        <p class="sec-status" *ngIf="!loadingSecurity">
          {{ twoFactorEnabled ? '✅ Two-factor authentication is ON.' : 'Two-factor authentication is currently OFF.' }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f7f8fc; min-height: 100vh; }
    .page-header { background: linear-gradient(135deg,#1a1a2e,#16213e); padding: 2.5rem 2rem; }
    .header-inner { max-width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.6rem; font-weight: 800; color: #fff; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
    .breadcrumb a { color: rgba(255,255,255,0.5); text-decoration: none; }
    .breadcrumb span { color: rgba(255,255,255,0.3); }
    .container { max-width: 1300px; margin: 0 auto; padding: 2rem; }
    .tabs { display: flex; gap: 0; background: #fff; border-radius: 12px; padding: 0.35rem; margin-bottom: 2rem; width: fit-content; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .tabs button { background: none; border: none; padding: 0.6rem 1.5rem; border-radius: 9px; cursor: pointer; font-size: 0.9rem; font-weight: 500; color: #888; transition: all 0.18s; }
    .tabs button.active { background: #6c63ff; color: #fff; font-weight: 600; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .section-header h2 { font-size: 1.2rem; font-weight: 700; color: #1a1a2e; }
    .btn-add { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.6rem 1.25rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
    .btn-add:hover { background: #5a52d5; }

    .addr-form { background: #fff; border-radius: 20px; padding: 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
    .addr-form h3 { font-size: 1rem; font-weight: 700; color: #1a1a2e; margin-bottom: 1.25rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field.full { grid-column: span 2; }
    .field label { font-size: 0.8rem; font-weight: 600; color: #555; }
    .field input, .field select { border: 1.5px solid #e9ecef; border-radius: 10px; padding: 0.65rem 0.85rem; font-size: 0.875rem; outline: none; transition: border-color 0.18s; }
    .field input:focus, .field select:focus { border-color: #6c63ff; }
    .checkbox-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #555; cursor: pointer; }
    .form-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; }
    .btn-save { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.75rem 1.5rem; font-weight: 600; cursor: pointer; }
    .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-cancel { background: #f7f8fc; color: #888; border: 1.5px solid #e9ecef; border-radius: 10px; padding: 0.75rem 1.5rem; font-weight: 600; cursor: pointer; }

    .addr-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 1.25rem; }
    .addr-card { background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border: 2px solid transparent; position: relative; }
    .addr-card.default { border-color: #6c63ff; }
    .addr-badge { position: absolute; top: -10px; right: 1rem; background: #6c63ff; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 20px; }
    .addr-label { display: inline-block; background: #f0edff; color: #6c63ff; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 20px; margin-bottom: 0.75rem; }
    .addr-name { font-size: 0.95rem; font-weight: 700; color: #1a1a2e; margin-bottom: 0.35rem; }
    .addr-text { font-size: 0.875rem; color: #555; line-height: 1.6; margin-bottom: 0.35rem; }
    .addr-phone { font-size: 0.82rem; color: #888; margin-bottom: 1rem; }
    .addr-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .btn-edit, .btn-default, .btn-del { font-size: 0.8rem; font-weight: 600; border-radius: 8px; padding: 0.4rem 0.9rem; cursor: pointer; border: none; transition: all 0.18s; }
    .btn-edit { background: #f0edff; color: #6c63ff; }
    .btn-edit:hover { background: #e0d9ff; }
    .btn-default { background: #e8f8f5; color: #00b894; }
    .btn-del { background: #fff5f5; color: #e17055; }
    .empty-addr { background: #fff; border-radius: 14px; padding: 2rem; text-align: center; color: #888; }

    .referral-section { }

    .security-section { display: flex; flex-direction: column; gap: 1rem; max-width: 640px; }
    .sec-card { background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; }
    .sec-info h3 { font-size: 1rem; font-weight: 700; color: #1a1a2e; margin-bottom: 0.4rem; }
    .sec-info p { font-size: 0.85rem; color: #888; line-height: 1.6; }
    .sec-status { font-size: 0.85rem; color: #555; padding: 0 0.25rem; }
    .switch { position: relative; display: inline-block; width: 48px; height: 26px; flex-shrink: 0; }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider { position: absolute; cursor: pointer; inset: 0; background: #ccc; border-radius: 26px; transition: 0.2s; }
    .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: 0.2s; }
    .switch input:checked + .slider { background: #6c63ff; }
    .switch input:checked + .slider:before { transform: translateX(22px); }
    .switch input:disabled + .slider { opacity: 0.6; cursor: not-allowed; }
    .ref-hero { background: linear-gradient(135deg,#6c63ff,#a29bfe); border-radius: 20px; padding: 2.5rem; color: #fff; margin-bottom: 2rem; }
    .ref-hero h2 { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.75rem; }
    .ref-hero p { opacity: 0.85; line-height: 1.6; }
    .ref-code-card { background: #fff; border-radius: 16px; padding: 1.75rem; margin-bottom: 1.5rem; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
    .code-label { font-size: 0.8rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 0.75rem; }
    .code-box { display: flex; align-items: center; gap: 1rem; background: #f7f8fc; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; }
    .code { font-size: 1.5rem; font-weight: 800; color: #6c63ff; letter-spacing: 2px; flex: 1; }
    .btn-copy { background: #6c63ff; color: #fff; border: none; border-radius: 8px; padding: 0.5rem 1.25rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
    .btn-copy:hover { background: #5a52d5; }
    .share-text { font-size: 0.8rem; color: #888; }
    .apply-code-input { flex: 1; border: none; background: transparent; font-size: 0.95rem; font-weight: 600; color: #1a1a2e; outline: none; }
    .ref-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-box { background: #fff; border-radius: 14px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .stat-num { display: block; font-size: 1.6rem; font-weight: 800; color: #1a1a2e; }
    .stat-label { font-size: 0.78rem; color: #888; margin-top: 0.2rem; display: block; }
    .how-it-works { background: #fff; border-radius: 16px; padding: 1.75rem; }
    .how-it-works h3 { font-size: 1rem; font-weight: 700; color: #1a1a2e; margin-bottom: 1.25rem; }
    .steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; }
    .step { text-align: center; }
    .step-num { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; background: #6c63ff; color: #fff; border-radius: 50%; font-size: 1.1rem; font-weight: 800; margin-bottom: 0.75rem; }
    .step p { font-size: 0.875rem; color: #555; line-height: 1.6; }
    .loyalty-hero { background: linear-gradient(135deg,#00b894,#00cec9); }
    .loyalty-row { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 0; border-bottom: 1px solid #f0f0f0; }
    .loyalty-row:last-child { border-bottom: none; }
    .loyalty-reason { display: block; font-size: 0.875rem; color: #1a1a2e; font-weight: 600; }
    .loyalty-date { display: block; font-size: 0.75rem; color: #888; margin-top: 0.15rem; }
    .loyalty-points { font-size: 1rem; font-weight: 800; }
    .loyalty-points.positive { color: #00b894; }
    .loyalty-points.negative { color: #e17055; }
  `]
})
export class ProfileComponent implements OnInit {
  tab = 'addresses';
  addresses: Address[] = [];
  loading = true;
  showForm = false;
  editingId: number | null = null;
  saving = false;
  referralCode = '';
  refStats: any = null;
  copied = false;
  applyCodeInput = '';
  applyingCode = false;
  loyaltyBalance: LoyaltyBalance | null = null;
  loyaltyHistory: LoyaltyTransaction[] = [];
  twoFactorEnabled = false;
  loadingSecurity = true;
  securityLoaded = false;

  form: CreateAddress = this.emptyForm();

  constructor(
    private addressService: AddressService,
    private referralService: ReferralService,
    private loyaltyService: LoyaltyService,
    private auth: AuthService,
    private toasts: ToastService
  ) {}

  ngOnInit() {
    this.addressService.getAll().subscribe({
      next: a => { this.addresses = a; this.loading = false; },
      error: () => this.loading = false
    });
  }

  loadReferral() {
    if (this.referralCode) return;
    this.referralService.getMyCode().subscribe(r => this.referralCode = r.code);
    this.referralService.getStats().subscribe(s => this.refStats = s);
  }

  applyReferralCode() {
    const code = this.applyCodeInput.trim();
    if (!code) return;
    this.applyingCode = true;
    this.referralService.applyCode(code).subscribe({
      next: (res: any) => {
        this.applyingCode = false;
        this.applyCodeInput = '';
        this.toasts.success(res?.message || 'Referral code applied!');
        this.loyaltyBalance = null;
        this.loadLoyalty();
      },
      error: (err) => {
        this.applyingCode = false;
        this.toasts.error(err?.error?.message || 'Invalid or already used code.');
      }
    });
  }

  loadLoyalty() {
    if (this.loyaltyBalance) return;
    this.loyaltyService.getBalance().subscribe(b => this.loyaltyBalance = b);
    this.loyaltyService.getHistory().subscribe(h => this.loyaltyHistory = h);
  }

  loadSecurity() {
    if (this.securityLoaded) return;
    this.loadingSecurity = true;
    this.auth.getTwoFactorStatus().subscribe({
      next: res => { this.twoFactorEnabled = res.enabled; this.loadingSecurity = false; this.securityLoaded = true; },
      error: () => this.loadingSecurity = false
    });
  }

  toggleTwoFactor(enabled: boolean) {
    this.loadingSecurity = true;
    this.auth.setTwoFactor(enabled).subscribe({
      next: res => {
        this.twoFactorEnabled = res.enabled;
        this.loadingSecurity = false;
        this.toasts.success(enabled ? 'Two-factor authentication enabled.' : 'Two-factor authentication disabled.');
      },
      error: () => {
        this.loadingSecurity = false;
        this.toasts.error('Failed to update two-factor authentication.');
      }
    });
  }

  resetForm() { this.form = this.emptyForm(); }

  saveAddress() {
    if (!this.form.fullName || !this.form.phone || !this.form.addressLine1 || !this.form.city || !this.form.state || !this.form.pincode) {
      this.toasts.error('Please fill all required fields'); return;
    }
    this.saving = true;
    const req = this.editingId
      ? this.addressService.update(this.editingId, this.form)
      : this.addressService.create(this.form);

    req.subscribe({
      next: addr => {
        if (this.editingId) this.addresses = this.addresses.map(a => a.id === this.editingId ? addr : a);
        else this.addresses.unshift(addr);
        if (this.form.isDefault) this.addresses = this.addresses.map(a => ({ ...a, isDefault: a.id === addr.id }));
        this.showForm = false; this.saving = false; this.editingId = null;
        this.toasts.success('Address saved!');
      },
      error: () => { this.saving = false; this.toasts.error('Failed to save address'); }
    });
  }

  editAddress(addr: Address) {
    this.editingId = addr.id;
    this.form = { label: addr.label, fullName: addr.fullName, phone: addr.phone, addressLine1: addr.addressLine1, addressLine2: addr.addressLine2, city: addr.city, state: addr.state, pincode: addr.pincode, isDefault: addr.isDefault };
    this.showForm = true;
  }

  setDefault(id: number) {
    this.addressService.setDefault(id).subscribe(() => {
      this.addresses = this.addresses.map(a => ({ ...a, isDefault: a.id === id }));
      this.toasts.success('Default address updated');
    });
  }

  deleteAddress(id: number) {
    this.addressService.delete(id).subscribe(() => {
      this.addresses = this.addresses.filter(a => a.id !== id);
      this.toasts.info('Address deleted');
    });
  }

  copyCode() {
    navigator.clipboard.writeText(this.referralCode).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

  private emptyForm(): CreateAddress {
    return { label: 'Home', fullName: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false };
  }
}
