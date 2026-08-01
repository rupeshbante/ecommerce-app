import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Coupon } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-head">
        <div><h1>Coupons</h1><p>Manage discount coupons and promo codes</p></div>
        <button class="btn-primary" (click)="openAdd()">+ Create Coupon</button>
      </div>

      <!-- Stats row -->
      <div class="coupon-stats">
        <div class="cs-card"><span class="cs-num">{{ total }}</span><span class="cs-label">Total</span></div>
        <div class="cs-card"><span class="cs-num">{{ activeCoupons }}</span><span class="cs-label">Active (this page)</span></div>
        <div class="cs-card"><span class="cs-num">{{ expiredCoupons }}</span><span class="cs-label">Expired (this page)</span></div>
        <div class="cs-card"><span class="cs-num">{{ totalUsed }}</span><span class="cs-label">Uses (this page)</span></div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Uses</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="loading"><td colspan="8" class="empty-row">Loading...</td></tr>
              <tr *ngFor="let c of coupons">
                <td><code class="coupon-code">{{ c.code }}</code></td>
                <td>{{ c.discountType }}</td>
                <td><strong>{{ c.discountType === 'Percentage' ? c.discountValue + '%' : '₹' + (c.discountValue | number) }}</strong></td>
                <td>{{ c.minOrderAmount > 0 ? '₹' + (c.minOrderAmount | number) : '—' }}</td>
                <td>
                  <span>{{ c.usedCount }} / {{ c.maxUses === 0 ? '∞' : c.maxUses }}</span>
                </td>
                <td [class.expired-cell]="c.isExpired">{{ c.expiryDate || 'Never' }}</td>
                <td>
                  <span *ngIf="c.isExpired" class="badge-expired">Expired</span>
                  <span *ngIf="!c.isExpired && c.isActive" class="badge-active">Active</span>
                  <span *ngIf="!c.isActive && !c.isExpired" class="badge-inactive">Inactive</span>
                </td>
                <td>
                  <div class="actions">
                    <button class="btn-icon" (click)="openEdit(c)" title="Edit">✏️</button>
                    <button class="btn-icon del" (click)="deleteCoupon(c)" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!loading && coupons.length === 0"><td colspan="8" class="empty-row">No coupons yet</td></tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" *ngIf="total > pageSize">
          <button [disabled]="page === 1" (click)="changePage(page - 1)">Previous</button>
          <span>Page {{ page }} of {{ Math.ceil(total / pageSize) }}</span>
          <button [disabled]="page >= Math.ceil(total / pageSize)" (click)="changePage(page + 1)">Next</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h2>{{ editing ? 'Edit Coupon' : 'Create Coupon' }}</h2>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field full">
              <label>Coupon Code * (auto-uppercased)</label>
              <input [(ngModel)]="form.code" placeholder="e.g. SUMMER20" style="text-transform:uppercase">
            </div>
            <div class="field">
              <label>Discount Type *</label>
              <select [(ngModel)]="form.discountType">
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed Amount (₹)</option>
              </select>
            </div>
            <div class="field">
              <label>Discount Value *</label>
              <input type="number" [(ngModel)]="form.discountValue" [placeholder]="form.discountType === 'Percentage' ? '20 (%)' : '100 (₹)'">
            </div>
            <div class="field">
              <label>Min Order Amount (₹)</label>
              <input type="number" [(ngModel)]="form.minOrderAmount" placeholder="0 (no minimum)">
            </div>
            <div class="field">
              <label>Max Uses (0 = unlimited)</label>
              <input type="number" [(ngModel)]="form.maxUses" placeholder="0">
            </div>
            <div class="field">
              <label>Expiry Date (optional)</label>
              <input type="date" [(ngModel)]="form.expiryDate">
            </div>
            <div class="field" *ngIf="editing">
              <label>Status</label>
              <select [(ngModel)]="form.isActive">
                <option [ngValue]="true">Active</option>
                <option [ngValue]="false">Inactive</option>
              </select>
            </div>
          </div>
          <div class="coupon-preview" *ngIf="form.code">
            <div class="cp-label">Preview:</div>
            <div class="cp-card">
              <code class="cp-code">{{ form.code.toUpperCase() }}</code>
              <span>— {{ form.discountType === 'Percentage' ? form.discountValue + '% off' : '₹' + form.discountValue + ' off' }}</span>
              <span *ngIf="form.minOrderAmount > 0"> on orders above ₹{{ form.minOrderAmount }}</span>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" (click)="closeModal()">Cancel</button>
          <button class="btn-save" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Create Coupon') }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-wrap { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .page-head h1 { font-size: 1.5rem; font-weight: 800; color: #1e2a38; }
    .page-head p { font-size: 0.85rem; color: #888; }
    .btn-primary { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.25rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .coupon-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; }
    .cs-card { background: #fff; border-radius: 14px; padding: 1.25rem; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .cs-num { display: block; font-size: 1.6rem; font-weight: 800; color: #1e2a38; }
    .cs-label { font-size: 0.8rem; color: #888; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.85rem 1rem; border-bottom: 2px solid #f0f0f0; background: #fafafa; white-space: nowrap; }
    .data-table td { padding: 0.75rem 1rem; font-size: 0.875rem; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .data-table tr:hover td { background: #f9f9ff; }
    .empty-row { text-align: center; color: #888; padding: 2.5rem !important; }
    .coupon-code { background: #f0edff; color: #6c63ff; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.85rem; font-weight: 700; letter-spacing: 1px; }
    .expired-cell { color: #e17055; }
    .badge-active { background: #e8f5e9; color: #2e7d32; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 20px; }
    .badge-inactive { background: #f5f5f5; color: #999; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 20px; }
    .badge-expired { background: #fff5f5; color: #e17055; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 20px; }
    .actions { display: flex; gap: 0.35rem; }
    .btn-icon { background: #f5f5f5; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; transition: all 0.18s; }
    .btn-icon:hover { transform: scale(1.12); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal { background: #fff; border-radius: 20px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #f0f0f0; }
    .modal-head h2 { font-size: 1.2rem; font-weight: 700; color: #1e2a38; }
    .close-btn { background: #f5f5f5; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field.full { grid-column: 1/-1; }
    .field label { font-size: 0.8rem; font-weight: 600; color: #555; }
    .field input, .field select { padding: 0.65rem 0.85rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; transition: border-color 0.18s; }
    .field input:focus, .field select:focus { border-color: #6c63ff; }
    .coupon-preview { background: #f0edff; border-radius: 12px; padding: 1rem; }
    .cp-label { font-size: 0.75rem; color: #888; margin-bottom: 0.5rem; }
    .cp-card { font-size: 0.9rem; color: #333; }
    .cp-code { background: #6c63ff; color: #fff; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 700; letter-spacing: 1px; margin-right: 0.4rem; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1.25rem 1.75rem; border-top: 1px solid #f0f0f0; }
    .btn-cancel { background: #f5f5f5; border: none; border-radius: 10px; padding: 0.65rem 1.25rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; color: #666; }
    .btn-save { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .btn-save:disabled { opacity: 0.6; }
    @media (max-width: 640px) { .coupon-stats { grid-template-columns: 1fr 1fr; } }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem; font-size: 0.875rem; color: #555; border-top: 1px solid #f5f5f5; }
    .pagination button { background: #6c63ff; color: #fff; border: none; border-radius: 8px; padding: 0.4rem 1rem; cursor: pointer; font-size: 0.82rem; }
    .pagination button:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class AdminCouponsComponent implements OnInit {
  coupons: Coupon[] = [];
  loading = true; saving = false; showModal = false; editing = false;
  page = 1; pageSize = 20; total = 0;
  Math = Math;
  form: any = this.emptyForm();

  get activeCoupons() { return this.coupons.filter(c => c.isActive && !c.isExpired).length; }
  get expiredCoupons() { return this.coupons.filter(c => c.isExpired).length; }
  get totalUsed() { return this.coupons.reduce((s, c) => s + c.usedCount, 0); }

  constructor(private adminService: AdminService, private toasts: ToastService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.adminService.getCoupons(this.page, this.pageSize).subscribe({
      next: res => { this.coupons = res.data; this.total = res.total; this.loading = false; },
      error: () => this.loading = false
    });
  }

  changePage(p: number) { this.page = p; this.load(); }

  emptyForm() { return { code: '', discountType: 'Percentage', discountValue: 10, minOrderAmount: 0, maxUses: 0, expiryDate: '', isActive: true }; }
  openAdd() { this.form = this.emptyForm(); this.editing = false; this.showModal = true; }
  openEdit(c: Coupon) { this.form = { code: c.code, discountType: c.discountType, discountValue: c.discountValue, minOrderAmount: c.minOrderAmount, maxUses: c.maxUses, expiryDate: c.expiryDate || '', isActive: c.isActive, id: c.id }; this.editing = true; this.showModal = true; }
  closeModal() { this.showModal = false; }

  save() {
    if (!this.form.code || this.form.discountValue <= 0) { this.toasts.error('Fill required fields.'); return; }
    this.saving = true;
    const payload = { ...this.form, expiryDate: this.form.expiryDate || null };
    const obs = this.editing ? this.adminService.updateCoupon(this.form.id, payload) : this.adminService.createCoupon(payload);
    obs.subscribe({ next: () => { this.toasts.success(this.editing ? 'Coupon updated!' : 'Coupon created!'); this.closeModal(); this.saving = false; this.load(); }, error: () => { this.toasts.error('Failed.'); this.saving = false; } });
  }

  deleteCoupon(c: Coupon) {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    this.adminService.deleteCoupon(c.id).subscribe({ next: () => { this.toasts.success('Deleted.'); this.load(); }, error: () => this.toasts.error('Failed.') });
  }
}
