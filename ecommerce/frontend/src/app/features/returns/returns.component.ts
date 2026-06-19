import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReturnService } from '../../core/services/return.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { ReturnRequest, CreateReturnRequest } from '../../core/models/return.models';
import { Order } from '../../core/models/order.models';

@Component({
  selector: 'app-returns',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="header-inner">
        <h1>Returns & Refunds</h1>
        <nav class="breadcrumb">
          <a routerLink="/">Home</a><span>/</span><span>Returns</span>
        </nav>
      </div>
    </div>

    <div class="container">
      <div class="page-grid">
        <!-- New Return Form -->
        <div class="form-section">
          <div class="card">
            <h2>Request a Return</h2>
            <p class="sub">You can request returns for delivered orders within 30 days.</p>

            <div class="field">
              <label>Select Order *</label>
              <select [(ngModel)]="newReturn.orderId">
                <option value="0" disabled>Choose an order...</option>
                <option *ngFor="let o of deliveredOrders" [value]="o.id">Order #{{ o.id }} — ₹{{ o.totalAmount | number }}</option>
              </select>
            </div>

            <div class="field">
              <label>Reason *</label>
              <select [(ngModel)]="newReturn.reason">
                <option value="">Select reason...</option>
                <option value="Damaged product">Damaged product</option>
                <option value="Wrong item delivered">Wrong item delivered</option>
                <option value="Product not as described">Product not as described</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Defective product">Defective product</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="field">
              <label>Describe the issue *</label>
              <textarea [(ngModel)]="newReturn.description" rows="4" placeholder="Please describe the issue in detail..."></textarea>
            </div>

            <button class="btn-submit" (click)="submitReturn()" [disabled]="submitting">
              {{ submitting ? 'Submitting...' : 'Submit Return Request' }}
            </button>
          </div>
        </div>

        <!-- Return History -->
        <div class="history-section">
          <div class="card">
            <h2>My Return Requests</h2>

            <div *ngIf="loadingReturns" class="loading">Loading...</div>

            <div *ngIf="!loadingReturns && returns.length === 0" class="empty">
              <p>No return requests yet.</p>
            </div>

            <div class="return-list" *ngIf="!loadingReturns && returns.length > 0">
              <div class="return-item" *ngFor="let r of returns">
                <div class="ret-head">
                  <span class="ret-id">Return #{{ r.id }}</span>
                  <span [class]="'ret-status status-' + r.status.toLowerCase()">{{ r.status }}</span>
                </div>
                <p class="ret-reason"><strong>Order:</strong> #{{ r.orderId }}</p>
                <p class="ret-reason"><strong>Reason:</strong> {{ r.reason }}</p>
                <p class="ret-desc">{{ r.description }}</p>
                <p class="ret-note" *ngIf="r.adminNote"><strong>Admin Note:</strong> {{ r.adminNote }}</p>
                <p class="ret-date">Requested: {{ r.requestedAt | date:'dd MMM yyyy' }}</p>
              </div>
            </div>
          </div>
        </div>
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
    .page-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
    .card { background: #fff; border-radius: 20px; padding: 2rem; box-shadow: 0 2px 16px rgba(0,0,0,0.07); }
    .card h2 { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin-bottom: 0.5rem; }
    .sub { font-size: 0.85rem; color: #888; margin-bottom: 1.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1rem; }
    .field label { font-size: 0.8rem; font-weight: 600; color: #555; }
    .field select, .field textarea { border: 1.5px solid #e9ecef; border-radius: 10px; padding: 0.65rem 0.85rem; font-size: 0.875rem; outline: none; font-family: inherit; transition: border-color 0.18s; }
    .field select:focus, .field textarea:focus { border-color: #6c63ff; }
    .btn-submit { width: 100%; background: #6c63ff; color: #fff; border: none; border-radius: 12px; padding: 0.9rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-submit:hover:not(:disabled) { background: #5a52d5; }
    .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
    .loading { color: #888; padding: 1rem 0; }
    .empty p { color: #888; font-size: 0.9rem; }
    .return-list { display: flex; flex-direction: column; gap: 1rem; }
    .return-item { background: #f7f8fc; border-radius: 12px; padding: 1.25rem; }
    .ret-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .ret-id { font-weight: 700; color: #1a1a2e; font-size: 0.95rem; }
    .ret-status { font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; }
    .status-pending { background: #fff8e1; color: #f39c12; }
    .status-approved { background: #e8f5e9; color: #2e7d32; }
    .status-rejected { background: #fce4ec; color: #c62828; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .ret-reason, .ret-desc, .ret-note, .ret-date { font-size: 0.85rem; color: #555; margin-bottom: 0.35rem; line-height: 1.5; }
    .ret-date { color: #aaa; font-size: 0.78rem; margin-top: 0.5rem; }
    @media (max-width: 768px) { .page-grid { grid-template-columns: 1fr; } }
  `]
})
export class ReturnsComponent implements OnInit {
  returns: ReturnRequest[] = [];
  deliveredOrders: Order[] = [];
  loading = true;
  loadingReturns = true;
  submitting = false;

  newReturn: CreateReturnRequest = { orderId: 0, reason: '', description: '' };

  constructor(
    private returnService: ReturnService,
    private orderService: OrderService,
    private toasts: ToastService
  ) {}

  ngOnInit() {
    this.orderService.getMyOrders().subscribe({
      next: orders => {
        this.deliveredOrders = orders.filter(o => o.status === 'Delivered' && !o.returnRequest);
        this.loading = false;
      }
    });
    this.returnService.getMyReturns().subscribe({
      next: r => { this.returns = r; this.loadingReturns = false; },
      error: () => this.loadingReturns = false
    });
  }

  submitReturn() {
    if (!this.newReturn.orderId || !this.newReturn.reason || !this.newReturn.description.trim()) {
      this.toasts.error('Please fill all required fields'); return;
    }
    this.submitting = true;
    this.returnService.createReturn(this.newReturn).subscribe({
      next: r => {
        this.returns.unshift(r);
        this.deliveredOrders = this.deliveredOrders.filter(o => o.id !== this.newReturn.orderId);
        this.newReturn = { orderId: 0, reason: '', description: '' };
        this.submitting = false;
        this.toasts.success('Return request submitted successfully!');
      },
      error: (err) => {
        this.submitting = false;
        this.toasts.error(err.error?.message ?? 'Failed to submit return request');
      }
    });
  }
}
