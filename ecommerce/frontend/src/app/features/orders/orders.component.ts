import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="header-inner">
        <div>
          <h1>My Orders</h1>
          <p class="subtitle">Track and manage your orders</p>
        </div>
        <nav class="breadcrumb">
          <a routerLink="/">Home</a><span>/</span><span>My Orders</span>
        </nav>
      </div>
    </div>

    <div class="container">
      <!-- Skeleton loading -->
      <ng-container *ngIf="loading">
        <div class="sk-card" *ngFor="let i of [1,2,3]">
          <div class="sk-head"></div>
          <div class="sk-body">
            <div class="sk-line" style="width:60%"></div>
            <div class="sk-line" style="width:40%"></div>
          </div>
        </div>
      </ng-container>

      <!-- Empty -->
      <div *ngIf="!loading && orders.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <h2>No orders yet</h2>
        <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
        <a routerLink="/products" class="btn-shop">Browse Products →</a>
      </div>

      <!-- Stats row -->
      <div *ngIf="!loading && orders.length > 0" class="stats-row">
        <div class="stat-card">
          <span class="stat-num">{{ orders.length }}</span>
          <span class="stat-label">Total Orders</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ pendingCount }}</span>
          <span class="stat-label">Pending</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ deliveredCount }}</span>
          <span class="stat-label">Delivered</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">₹{{ totalSpent | number }}</span>
          <span class="stat-label">Total Spent</span>
        </div>
      </div>

      <!-- Orders list -->
      <div *ngIf="!loading && orders.length > 0" class="orders-list">
        <div *ngFor="let order of orders" class="order-card">
          <div class="order-head">
            <div class="order-id-section">
              <div class="order-id">Order #{{ order.id }}</div>
              <div class="order-date">Placed on {{ order.orderDate | date:'dd MMM yyyy, h:mm a' }}</div>
            </div>
            <div class="order-meta">
              <span [class]="'status-badge status-' + order.status.toLowerCase()">
                {{ statusIcon(order.status) }} {{ order.status }}
              </span>
              <span class="order-amount">₹{{ order.totalAmount | number }}</span>
            </div>
          </div>

          <!-- Progress bar -->
          <div class="progress-bar">
            <div class="progress-steps">
              <div class="step" [class.done]="true">
                <div class="step-dot"></div>
                <span>Order Placed</span>
              </div>
              <div class="progress-line" [class.filled]="order.status !== 'Pending'"></div>
              <div class="step" [class.done]="order.status === 'Processing' || order.status === 'Delivered'">
                <div class="step-dot"></div>
                <span>Processing</span>
              </div>
              <div class="progress-line" [class.filled]="order.status === 'Delivered'"></div>
              <div class="step" [class.done]="order.status === 'Delivered'">
                <div class="step-dot"></div>
                <span>Delivered</span>
              </div>
            </div>
          </div>

          <!-- Items -->
          <div class="order-items">
            <div class="items-label">Items ordered:</div>
            <div class="item-chips">
              <span class="item-chip" *ngFor="let item of order.items">
                {{ item.productName }} × {{ item.quantity }}
                <span class="chip-price">₹{{ item.unitPrice | number }}</span>
              </span>
            </div>
          </div>

          <!-- Payment Status -->
          <div class="payment-row" *ngIf="order.payment">
            <span class="pay-icon">💳</span>
            <span [class]="'pay-status pay-' + order.payment.status.toLowerCase()">{{ order.payment.status }}</span>
            <span class="pay-amount">₹{{ order.payment.amount | number }}</span>
          </div>

          <!-- Footer -->
          <div class="order-foot">
            <div class="addr-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ order.shippingAddress }}
            </div>
            <div class="order-total-row">
              <span>{{ order.items.length }} item{{ order.items.length !== 1 ? 's' : '' }}</span>
              <span class="total-label">Total: <strong>₹{{ order.totalAmount | number }}</strong></span>
              <a [routerLink]="['/orders', order.id]" class="btn-detail">View Details</a>
              <a *ngIf="order.status === 'Delivered' && !order.returnRequest" routerLink="/returns" class="btn-return">↩️ Return</a>
              <span *ngIf="order.returnRequest" [class]="'return-badge ret-' + order.returnRequest.status.toLowerCase()">Return: {{ order.returnRequest.status }}</span>
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
    .subtitle { font-size: 0.85rem; color: rgba(255,255,255,0.45); margin-top: 0.25rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
    .breadcrumb a { color: rgba(255,255,255,0.5); text-decoration: none; }
    .breadcrumb span { color: rgba(255,255,255,0.3); }

    .container { max-width: 1300px; margin: 0 auto; padding: 2rem; }

    /* Skeleton */
    .sk-card { background: #fff; border-radius: 16px; overflow: hidden; margin-bottom: 1.25rem; }
    .sk-head { height: 64px; background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; }
    .sk-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.7rem; }
    .sk-line { height: 12px; border-radius: 6px; background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { to { background-position: -400% 0; } }

    /* Empty */
    .empty-state { text-align: center; padding: 6rem 2rem; background: #fff; border-radius: 20px; }
    .empty-icon { font-size: 5rem; margin-bottom: 1.5rem; line-height: 1; }
    .empty-state h2 { font-size: 1.5rem; font-weight: 800; color: #1a1a2e; margin-bottom: 0.75rem; }
    .empty-state p { color: #888; line-height: 1.6; margin-bottom: 2rem; max-width: 400px; margin-left: auto; margin-right: auto; }
    .btn-shop { background: #6c63ff; color: #fff; text-decoration: none; padding: 0.9rem 2rem; border-radius: 30px; font-weight: 700; display: inline-block; }
    .btn-shop:hover { background: #5a52d5; }

    /* Stats */
    .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.25rem; margin-bottom: 2rem; }
    .stat-card { background: #fff; border-radius: 14px; padding: 1.25rem 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .stat-num { display: block; font-size: 1.6rem; font-weight: 800; color: #1a1a2e; }
    .stat-label { font-size: 0.8rem; color: #888; margin-top: 0.2rem; display: block; }

    /* Orders */
    .orders-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .order-card { background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.06); transition: box-shadow 0.2s; }
    .order-card:hover { box-shadow: 0 6px 28px rgba(0,0,0,0.1); }

    .order-head { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.75rem; background: #fafafa; border-bottom: 1px solid #f0f0f0; flex-wrap: wrap; gap: 1rem; }
    .order-id { font-size: 1rem; font-weight: 700; color: #1a1a2e; }
    .order-date { font-size: 0.8rem; color: #888; margin-top: 0.2rem; }
    .order-meta { display: flex; align-items: center; gap: 1.25rem; }
    .status-badge { padding: 0.35rem 0.9rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
    .status-pending { background: #fff8e1; color: #f39c12; }
    .status-processing { background: #e3f2fd; color: #1976d2; }
    .status-delivered { background: #e8f5e9; color: #2e7d32; }
    .status-cancelled { background: #fce4ec; color: #c62828; }
    .order-amount { font-size: 1.15rem; font-weight: 800; color: #1a1a2e; }

    /* Progress */
    .progress-bar { padding: 1.25rem 1.75rem; border-bottom: 1px solid #f5f5f5; }
    .progress-steps { display: flex; align-items: center; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
    .step-dot { width: 14px; height: 14px; border-radius: 50%; background: #e9ecef; border: 2px solid #ddd; transition: all 0.3s; }
    .step.done .step-dot { background: #6c63ff; border-color: #6c63ff; box-shadow: 0 0 0 3px rgba(108,99,255,0.2); }
    .step span { font-size: 0.72rem; color: #aaa; white-space: nowrap; }
    .step.done span { color: #6c63ff; font-weight: 600; }
    .progress-line { flex: 1; height: 2px; background: #e9ecef; margin: 0 0.5rem; margin-bottom: 20px; transition: background 0.3s; }
    .progress-line.filled { background: #6c63ff; }

    /* Items */
    .order-items { padding: 1.25rem 1.75rem; border-bottom: 1px solid #f5f5f5; }
    .items-label { font-size: 0.78rem; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem; }
    .item-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .item-chip { background: #f5f3ff; color: #4a3f8f; border-radius: 8px; padding: 0.4rem 0.85rem; font-size: 0.82rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; }
    .chip-price { background: #ebe7ff; color: #6c63ff; border-radius: 5px; padding: 0.1rem 0.4rem; font-size: 0.75rem; font-weight: 700; }

    /* Footer */
    .payment-row { padding: 0.75rem 1.75rem; display: flex; align-items: center; gap: 0.75rem; background: #f9f9f9; border-bottom: 1px solid #f5f5f5; font-size: 0.82rem; }
    .pay-icon { font-size: 1rem; }
    .pay-status { font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; }
    .pay-paid { background: #e8f5e9; color: #2e7d32; }
    .pay-pending { background: #fff8e1; color: #f39c12; }
    .pay-failed { background: #fce4ec; color: #c62828; }
    .pay-amount { color: #888; margin-left: auto; }
    .order-foot { padding: 1rem 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; }
    .addr-row { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; color: #888; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .order-total-row { display: flex; align-items: center; gap: 1rem; font-size: 0.875rem; color: #555; }
    .total-label strong { color: #1a1a2e; font-size: 1rem; }
    .btn-detail { background: #f5f3ff; color: #6c63ff; text-decoration: none; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; border: 1px solid #d8d3ff; }
    .btn-detail:hover { background: #ebe7ff; }
    .btn-return { background: #fff8e1; color: #f39c12; text-decoration: none; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; border: 1px solid #ffe082; }
    .return-badge { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: 20px; }
    .ret-pending { background: #fff8e1; color: #f39c12; }
    .ret-approved { background: #e8f5e9; color: #2e7d32; }
    .ret-rejected { background: #fce4ec; color: #c62828; }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: 1fr 1fr; }
      .container { padding: 1.5rem 1rem; }
      .order-head { flex-direction: column; align-items: flex-start; }
      .progress-bar { overflow-x: auto; }
    }
    @media (max-width: 480px) {
      .stats-row { grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    }
  `]
})
export class OrdersComponent implements OnInit {
  orders: Order[] = [];
  loading = true;

  get pendingCount() { return this.orders.filter(o => o.status === 'Pending').length; }
  get deliveredCount() { return this.orders.filter(o => o.status === 'Delivered').length; }
  get totalSpent() { return this.orders.reduce((s, o) => s + o.totalAmount, 0); }

  constructor(private orderService: OrderService) {}

  ngOnInit() {
    this.orderService.getMyOrders().subscribe({
      next: o => { this.orders = o.sort((a, b) => b.id - a.id); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  statusIcon(status: string): string {
    const icons: Record<string, string> = { Pending: '🕐', Processing: '⚙️', Delivered: '✅', Cancelled: '❌' };
    return icons[status] ?? '📦';
  }
}
