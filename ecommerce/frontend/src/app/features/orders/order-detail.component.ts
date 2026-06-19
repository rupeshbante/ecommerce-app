import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { Order } from '../../core/models/order.models';

interface TimelineStep {
  step: number;
  title: string;
  description: string;
  date: Date;
  completed: boolean;
  icon: string;
  status: string;
}

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="header-inner">
        <div>
          <a routerLink="/orders" class="back-link">← Back to Orders</a>
          <h1>Order #{{ order?.id }}</h1>
          <p class="subtitle">{{ order?.orderDate | date:'dd MMM yyyy, h:mm a' }}</p>
        </div>
        <div class="header-status">
          <span [class]="'status-badge status-' + order?.status.toLowerCase()">
            {{ statusIcon() }} {{ order?.status }}
          </span>
        </div>
      </div>
    </div>

    <div class="container" *ngIf="!loading && order">
      <!-- Timeline Section -->
      <div class="tracking-section">
        <h2 class="section-title">📍 Order Tracking</h2>

        <div class="timeline-wrapper">
          <div class="timeline-track">
            <div class="timeline-progress" [style.width.%]="progressPercent"></div>
          </div>

          <div class="timeline-steps">
            <div *ngFor="let step of timeline; let i = index"
                 [class.completed]="step.completed"
                 [class.current]="!step.completed && (i === currentStepIndex)"
                 class="timeline-step">

              <div class="step-indicator">
                <div class="step-dot" [class.done]="step.completed" [class.curr]="!step.completed && i === currentStepIndex">
                  <span *ngIf="step.completed" class="check-icon">✓</span>
                  <span *ngIf="!step.completed && i === currentStepIndex" class="curr-icon">●</span>
                  <span *ngIf="!step.completed && i !== currentStepIndex" class="wait-icon">◯</span>
                </div>
                <div *ngIf="i < timeline.length - 1" class="step-line" [class.filled]="step.completed"></div>
              </div>

              <div class="step-content">
                <h3 class="step-title">{{ step.title }}</h3>
                <p class="step-desc">{{ step.description }}</p>
                <p class="step-date">{{ step.date | date:'dd MMM yyyy, h:mm a' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Details -->
      <div class="details-grid">
        <!-- Items -->
        <div class="detail-card">
          <h3 class="card-title">📦 Items Ordered</h3>
          <div class="items-list">
            <div *ngFor="let item of order.items" class="item-row">
              <div class="item-info">
                <p class="item-name">{{ item.productName }}</p>
                <p class="item-qty">Qty: {{ item.quantity }}</p>
              </div>
              <div class="item-price">
                <p class="price">₹{{ item.unitPrice | number }}</p>
                <p class="subtotal">{{ item.quantity }} × ₹{{ item.unitPrice }} = ₹{{ item.quantity * item.unitPrice | number }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Shipping Info -->
        <div class="detail-card">
          <h3 class="card-title">🚚 Shipping Address</h3>
          <div class="shipping-box">
            <p class="address">{{ order.shippingAddress }}</p>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="detail-card">
          <h3 class="card-title">💳 Order Summary</h3>
          <div class="summary-table">
            <div class="summary-row">
              <span>Subtotal ({{ order.items.length }} items)</span>
              <span>₹{{ subtotal | number }}</span>
            </div>
            <div class="summary-row" *ngIf="order.discountAmount && order.discountAmount > 0">
              <span>Discount ({{ order.couponCode }})</span>
              <span class="discount">-₹{{ order.discountAmount | number }}</span>
            </div>
            <div class="summary-row">
              <span>Shipping</span>
              <span class="free">FREE</span>
            </div>
            <div class="summary-row total">
              <span>Total Amount</span>
              <span>₹{{ order.totalAmount | number }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Info -->
        <div class="detail-card" *ngIf="order.payment">
          <h3 class="card-title">💰 Payment Status</h3>
          <div class="payment-box">
            <div class="payment-detail">
              <span class="label">Method:</span>
              <span class="value">{{ order.payment.paymentMethod || 'Online' }}</span>
            </div>
            <div class="payment-detail">
              <span class="label">Status:</span>
              <span [class]="'pay-status pay-' + order.payment.status.toLowerCase()">
                {{ order.payment.status }}
              </span>
            </div>
            <div class="payment-detail">
              <span class="label">Amount:</span>
              <span class="value">₹{{ order.payment.amount | number }}</span>
            </div>
            <div class="payment-detail" *ngIf="order.payment.transactionId">
              <span class="label">Transaction ID:</span>
              <span class="value mono">{{ order.payment.transactionId }}</span>
            </div>
          </div>
        </div>

        <!-- Return Info -->
        <div class="detail-card" *ngIf="order.returnRequest">
          <h3 class="card-title">↩️ Return Request</h3>
          <div class="return-box">
            <div class="return-status" [class]="'ret-' + order.returnRequest.status.toLowerCase()">
              {{ order.returnRequest.status }}
            </div>
            <p class="return-reason">{{ order.returnRequest.reason }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-section">
        <button class="btn-download" (click)="downloadInvoice()">📥 Download Invoice</button>
        <button *ngIf="order.status === 'Delivered' && !order.returnRequest"
                routerLink="/returns"
                [queryParams]="{orderId: order.id}"
                class="btn-return">
          ↩️ Return Order
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div class="container loading-state" *ngIf="loading">
      <div class="sk-card" style="height: 300px;"></div>
    </div>

    <!-- Error state -->
    <div class="container error-state" *ngIf="!loading && !order">
      <div class="error-card">
        <div class="error-icon">⚠️</div>
        <h2>Order Not Found</h2>
        <p>This order doesn't exist or you don't have permission to view it.</p>
        <a routerLink="/orders" class="btn-back">← Back to Orders</a>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f7f8fc; min-height: 100vh; }

    .page-header { background: linear-gradient(135deg,#1a1a2e,#16213e); padding: 2rem 2rem; margin-bottom: 2rem; }
    .header-inner { max-width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-start; gap: 2rem; flex-wrap: wrap; }
    .back-link { color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.9rem; margin-bottom: 0.5rem; display: inline-block; }
    .back-link:hover { color: #fff; }
    .page-header h1 { font-size: 1.8rem; font-weight: 800; color: #fff; margin: 0.5rem 0 0 0; }
    .subtitle { font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-top: 0.25rem; }
    .header-status { display: flex; align-items: center; gap: 1rem; }
    .status-badge { padding: 0.4rem 1.2rem; border-radius: 25px; font-size: 0.85rem; font-weight: 700; }
    .status-pending { background: #fff8e1; color: #f39c12; }
    .status-processing { background: #e3f2fd; color: #1976d2; }
    .status-delivered { background: #e8f5e9; color: #2e7d32; }
    .status-cancelled { background: #fce4ec; color: #c62828; }

    .container { max-width: 1300px; margin: 0 auto; padding: 2rem; }

    /* Timeline */
    .tracking-section { background: #fff; border-radius: 20px; padding: 2.5rem; margin-bottom: 2rem; box-shadow: 0 2px 16px rgba(0,0,0,0.06); }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #1a1a2e; margin-bottom: 2rem; }

    .timeline-wrapper { position: relative; }
    .timeline-track { position: absolute; top: 30px; left: 40px; right: 0; height: 2px; background: #e9ecef; }
    .timeline-progress { height: 100%; background: #6c63ff; transition: width 0.3s ease; position: relative; }
    .timeline-progress::after { content: ''; position: absolute; right: -5px; top: -4px; width: 12px; height: 12px; border-radius: 50%; background: #6c63ff; }

    .timeline-steps { display: flex; flex-direction: column; gap: 2rem; position: relative; z-index: 1; }
    .timeline-step { display: flex; gap: 2rem; opacity: 0.6; transition: opacity 0.3s; }
    .timeline-step.completed { opacity: 1; }
    .timeline-step.current { opacity: 1; }

    .step-indicator { display: flex; flex-direction: column; align-items: center; min-width: 80px; }
    .step-dot { width: 28px; height: 28px; border-radius: 50%; background: #fff; border: 3px solid #e9ecef; display: flex; align-items: center; justify-content: center; font-weight: 700; transition: all 0.3s; flex-shrink: 0; }
    .step-dot.done { background: #6c63ff; border-color: #6c63ff; color: #fff; box-shadow: 0 0 0 6px rgba(108,99,255,0.15); }
    .step-dot.curr { background: #fff; border-color: #6c63ff; border-width: 2px; color: #6c63ff; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(108,99,255,0.7); } 50% { box-shadow: 0 0 0 8px rgba(108,99,255,0); } }
    .check-icon { font-size: 0.9rem; }
    .curr-icon { font-size: 0.8rem; }
    .wait-icon { font-size: 1rem; color: #bbb; }

    .step-line { width: 2px; flex: 1; background: #e9ecef; min-height: 60px; }
    .step-line.filled { background: #6c63ff; }

    .step-content { padding-top: 0.2rem; }
    .step-title { font-size: 1rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .step-desc { font-size: 0.85rem; color: #666; margin: 0.3rem 0 0 0; }
    .step-date { font-size: 0.8rem; color: #aaa; margin: 0.4rem 0 0 0; }

    /* Details Grid */
    .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
    .detail-card { background: #fff; border-radius: 16px; padding: 1.75rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .card-title { font-size: 1rem; font-weight: 700; color: #1a1a2e; margin-bottom: 1.25rem; }

    /* Items */
    .items-list { display: flex; flex-direction: column; gap: 1rem; }
    .item-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem; background: #f9f9f9; border-radius: 12px; }
    .item-info { flex: 1; }
    .item-name { font-size: 0.95rem; font-weight: 600; color: #1a1a2e; margin: 0; }
    .item-qty { font-size: 0.8rem; color: #888; margin: 0.3rem 0 0 0; }
    .item-price { text-align: right; }
    .price { font-size: 1rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .subtotal { font-size: 0.75rem; color: #888; margin: 0.2rem 0 0 0; }

    /* Shipping */
    .shipping-box { background: #f9f9f9; padding: 1.25rem; border-radius: 12px; }
    .address { color: #333; line-height: 1.6; margin: 0; }

    /* Summary */
    .summary-table { display: flex; flex-direction: column; gap: 0.8rem; }
    .summary-row { display: flex; justify-content: space-between; font-size: 0.95rem; color: #555; }
    .summary-row.total { padding-top: 0.8rem; border-top: 2px solid #f0f0f0; font-size: 1.05rem; font-weight: 700; color: #1a1a2e; }
    .discount { color: #2e7d32; font-weight: 600; }
    .free { color: #f39c12; font-weight: 600; }

    /* Payment */
    .payment-box { display: flex; flex-direction: column; gap: 1rem; }
    .payment-detail { display: flex; justify-content: space-between; font-size: 0.95rem; }
    .label { color: #888; font-weight: 500; }
    .value { color: #1a1a2e; font-weight: 600; }
    .mono { font-family: 'Monaco', monospace; font-size: 0.85rem; color: #666; }
    .pay-status { padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 700; display: inline-block; }
    .pay-paid { background: #e8f5e9; color: #2e7d32; }
    .pay-pending { background: #fff8e1; color: #f39c12; }
    .pay-failed { background: #fce4ec; color: #c62828; }

    /* Return */
    .return-box { display: flex; flex-direction: column; gap: 1rem; }
    .return-status { padding: 0.5rem 1rem; border-radius: 12px; text-align: center; font-weight: 700; font-size: 0.95rem; }
    .ret-pending { background: #fff8e1; color: #f39c12; }
    .ret-approved { background: #e8f5e9; color: #2e7d32; }
    .ret-rejected { background: #fce4ec; color: #c62828; }
    .return-reason { color: #555; font-size: 0.9rem; margin: 0; }

    /* Actions */
    .actions-section { display: flex; gap: 1rem; margin-top: 2rem; }
    .btn-download, .btn-return, .btn-back { padding: 0.85rem 1.75rem; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; transition: all 0.2s; }
    .btn-download { background: #6c63ff; color: #fff; }
    .btn-download:hover { background: #5a52d5; transform: translateY(-2px); }
    .btn-return { background: #fff8e1; color: #f39c12; border: 1px solid #ffe082; }
    .btn-return:hover { background: #ffe082; }
    .btn-back { background: #f0f0f0; color: #1a1a2e; }
    .btn-back:hover { background: #e0e0e0; }

    /* Loading & Error */
    .loading-state { padding-top: 4rem; }
    .sk-card { background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; border-radius: 16px; }
    @keyframes shimmer { to { background-position: -400% 0; } }

    .error-state { padding-top: 4rem; }
    .error-card { background: #fff; border-radius: 20px; padding: 3rem 2rem; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .error-icon { font-size: 4rem; margin-bottom: 1rem; }
    .error-card h2 { font-size: 1.5rem; color: #1a1a2e; margin-bottom: 0.75rem; }
    .error-card p { color: #888; margin-bottom: 2rem; }

    @media (max-width: 1024px) {
      .details-grid { grid-template-columns: 1fr; }
      .header-inner { flex-direction: column; }
    }

    @media (max-width: 640px) {
      .container { padding: 1.5rem 1rem; }
      .tracking-section { padding: 1.5rem; }
      .timeline-steps { gap: 1.5rem; }
      .timeline-step { gap: 1.5rem; }
      .timeline-track { left: 25px; }
      .step-indicator { min-width: 50px; }
      .actions-section { flex-direction: column; }
      .btn-download, .btn-return, .btn-back { width: 100%; }
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  timeline: TimelineStep[] = [];
  currentStepIndex = 0;

  get progressPercent(): number {
    const completedSteps = this.timeline.filter(s => s.completed).length;
    return (completedSteps / this.timeline.length) * 100;
  }

  get subtotal(): number {
    return this.order?.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) ?? 0;
  }

  constructor(
    private orderService: OrderService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      const orderId = parseInt(params['id'], 10);
      if (!isNaN(orderId)) {
        this.loadOrder(orderId);
      }
    });
  }

  loadOrder(id: number) {
    this.orderService.getById(id).subscribe({
      next: order => {
        this.order = order;
        this.buildTimeline();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  buildTimeline() {
    if (!this.order) return;

    const orderDate = new Date(this.order.orderDate);
    const now = new Date();

    const steps: TimelineStep[] = [
      {
        step: 1,
        title: 'Order Placed',
        description: 'Your order has been received',
        date: orderDate,
        completed: true,
        icon: '📦',
        status: 'Pending'
      },
      {
        step: 2,
        title: 'Order Confirmed',
        description: 'Your order has been confirmed',
        date: new Date(orderDate.getTime() + 30 * 60000),
        completed: this.order.status !== 'Pending',
        icon: '✓',
        status: 'Processing'
      },
      {
        step: 3,
        title: 'Shipped',
        description: 'Your order has been dispatched',
        date: new Date(orderDate.getTime() + 6 * 60 * 60000),
        completed: this.order.status === 'Delivered' || this.order.status === 'Processing',
        icon: '🚚',
        status: 'Shipped'
      },
      {
        step: 4,
        title: 'Out for Delivery',
        description: 'Your order is on the way to you',
        date: new Date(orderDate.getTime() + 20 * 60 * 60000),
        completed: this.order.status === 'Delivered',
        icon: '🚗',
        status: 'Out for Delivery'
      },
      {
        step: 5,
        title: 'Delivered',
        description: 'Your order has been delivered',
        date: new Date(orderDate.getTime() + 24 * 60 * 60000),
        completed: this.order.status === 'Delivered',
        icon: '🎉',
        status: 'Delivered'
      }
    ];

    this.timeline = steps;
    this.currentStepIndex = steps.findIndex(s => !s.completed);
    if (this.currentStepIndex === -1) this.currentStepIndex = steps.length - 1;
  }

  statusIcon(): string {
    const icons: Record<string, string> = {
      Pending: '🕐',
      Processing: '⚙️',
      Delivered: '✅',
      Cancelled: '❌'
    };
    return icons[this.order?.status ?? ''] ?? '📦';
  }

  downloadInvoice() {
    alert('Invoice PDF download feature coming soon!');
    // Will implement PDF generation in next phase
  }
}
