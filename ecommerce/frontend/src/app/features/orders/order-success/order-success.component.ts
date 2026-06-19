import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.models';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="success-page">
      <!-- Confetti header -->
      <div class="success-hero">
        <div class="checkmark-wrap">
          <div class="checkmark">
            <svg viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="26" r="25" stroke="#00b894" stroke-width="2"/>
              <path d="M14 26l8 8 16-16" stroke="#00b894" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
        <h1>Order Confirmed!</h1>
        <p class="hero-sub">Thank you for your purchase. Your order has been placed successfully.</p>
      </div>

      <div *ngIf="loading" class="loading-wrap">
        <div class="spinner"></div>
      </div>

      <div *ngIf="!loading && order" class="content">
        <!-- Order ID banner -->
        <div class="order-banner">
          <div class="banner-left">
            <span class="label">Order Number</span>
            <span class="order-num">#{{ order.id }}</span>
          </div>
          <div class="banner-mid">
            <span class="label">Date</span>
            <span>{{ order.orderDate | date:'dd MMM yyyy, h:mm a' }}</span>
          </div>
          <div class="banner-right">
            <span [class]="'status-badge status-' + order.status.toLowerCase()">
              {{ order.status }}
            </span>
          </div>
        </div>

        <div class="two-col">
          <!-- Items -->
          <div class="items-card">
            <h3>Items Ordered</h3>
            <div class="item-list">
              <div class="item-row" *ngFor="let item of order.items">
                <img [src]="item.productImageUrl || 'https://placehold.co/64x64?text=Img'"
                     [alt]="item.productName"
                     (error)="$any($event.target).src='https://placehold.co/64x64?text=Img'">
                <div class="item-info">
                  <span class="item-name">{{ item.productName }}</span>
                  <span class="item-qty">Qty: {{ item.quantity }}</span>
                </div>
                <span class="item-price">₹{{ (item.unitPrice * item.quantity) | number }}</span>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="summary-card">
            <h3>Order Summary</h3>

            <div class="summary-lines">
              <div class="sum-row">
                <span>Subtotal</span>
                <span>₹{{ subtotal | number }}</span>
              </div>
              <div class="sum-row discount" *ngIf="order.discountAmount && order.discountAmount > 0">
                <span>Coupon ({{ order.couponCode }})</span>
                <span>−₹{{ order.discountAmount | number }}</span>
              </div>
              <div class="sum-row">
                <span>Delivery</span>
                <span [class.free-txt]="order.totalAmount >= 500">{{ subtotal >= 500 ? 'FREE' : '₹99' }}</span>
              </div>
              <div class="sum-divider"></div>
              <div class="sum-row total">
                <span>Total Paid</span>
                <strong>₹{{ order.totalAmount | number }}</strong>
              </div>
            </div>

            <!-- Payment status -->
            <div class="pay-info" *ngIf="order.payment">
              <span class="pay-icon">💳</span>
              <span>{{ order.payment.method }}</span>
              <span [class]="'pay-badge pay-' + order.payment.status.toLowerCase()">{{ order.payment.status }}</span>
            </div>
            <div class="pay-info cod" *ngIf="!order.payment">
              <span class="pay-icon">💵</span>
              <span>Cash on Delivery</span>
            </div>

            <!-- Delivery address -->
            <div class="addr-box">
              <div class="addr-label">Delivering to</div>
              <div class="addr-text">{{ order.shippingAddress }}</div>
            </div>
          </div>
        </div>

        <!-- Tracking progress -->
        <div class="tracking-card">
          <h3>Order Tracking</h3>
          <div class="track-steps">
            <div class="track-step done">
              <div class="step-icon">✅</div>
              <div class="step-label">Order Placed</div>
              <div class="step-date">{{ order.orderDate | date:'dd MMM, h:mm a' }}</div>
            </div>
            <div class="track-line" [class.active]="order.status !== 'Pending'"></div>
            <div class="track-step" [class.done]="order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered'">
              <div class="step-icon">{{ order.status === 'Processing' || order.status === 'Shipped' || order.status === 'Delivered' ? '⚙️' : '○' }}</div>
              <div class="step-label">Processing</div>
            </div>
            <div class="track-line" [class.active]="order.status === 'Shipped' || order.status === 'Delivered'"></div>
            <div class="track-step" [class.done]="order.status === 'Shipped' || order.status === 'Delivered'">
              <div class="step-icon">{{ order.status === 'Shipped' || order.status === 'Delivered' ? '🚚' : '○' }}</div>
              <div class="step-label">Shipped</div>
            </div>
            <div class="track-line" [class.active]="order.status === 'Delivered'"></div>
            <div class="track-step" [class.done]="order.status === 'Delivered'">
              <div class="step-icon">{{ order.status === 'Delivered' ? '🏠' : '○' }}</div>
              <div class="step-label">Delivered</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions">
          <a routerLink="/products" class="btn-shop">Continue Shopping</a>
          <a routerLink="/orders" class="btn-orders">View All Orders</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f7f8fc; min-height: 100vh; }

    .success-page { max-width: 900px; margin: 0 auto; padding: 2rem; }

    .success-hero { text-align: center; padding: 3rem 1rem 2rem; }
    .checkmark-wrap { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .checkmark { width: 80px; height: 80px; animation: pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275); }
    @keyframes pop { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    .checkmark svg { width: 80px; height: 80px; }
    .success-hero h1 { font-size: 2rem; font-weight: 900; color: #1a1a2e; margin-bottom: 0.75rem; }
    .hero-sub { color: #666; font-size: 1rem; }

    .loading-wrap { display: flex; justify-content: center; padding: 4rem; }
    .spinner { width: 48px; height: 48px; border: 4px solid #e9ecef; border-top-color: #6c63ff; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .order-banner { background: #fff; border-radius: 16px; padding: 1.25rem 1.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .banner-left, .banner-mid { display: flex; flex-direction: column; gap: 0.25rem; }
    .label { font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .order-num { font-size: 1.3rem; font-weight: 900; color: #6c63ff; }
    .banner-mid span:last-child { font-weight: 600; color: #1a1a2e; font-size: 0.9rem; }
    .status-badge { padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.82rem; font-weight: 700; }
    .status-pending { background: #fff8e1; color: #f39c12; }
    .status-processing { background: #e3f2fd; color: #1976d2; }
    .status-delivered { background: #e8f5e9; color: #2e7d32; }
    .status-cancelled { background: #fce4ec; color: #c62828; }

    .two-col { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; margin-bottom: 1.5rem; }

    .items-card, .summary-card, .tracking-card { background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    h3 { font-size: 1rem; font-weight: 800; color: #1a1a2e; margin-bottom: 1.25rem; }

    .item-list { display: flex; flex-direction: column; gap: 1rem; }
    .item-row { display: flex; align-items: center; gap: 1rem; }
    .item-row img { width: 64px; height: 64px; border-radius: 10px; object-fit: cover; flex-shrink: 0; }
    .item-info { flex: 1; }
    .item-name { display: block; font-size: 0.9rem; font-weight: 600; color: #1a1a2e; }
    .item-qty { font-size: 0.78rem; color: #888; }
    .item-price { font-weight: 800; color: #1a1a2e; font-size: 0.95rem; white-space: nowrap; }

    .summary-lines { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.25rem; }
    .sum-row { display: flex; justify-content: space-between; font-size: 0.88rem; color: #555; }
    .sum-row.discount { color: #00b894; font-weight: 600; }
    .free-txt { color: #00b894; font-weight: 700; }
    .sum-divider { border-top: 1px solid #f0f0f0; margin: 0.25rem 0; }
    .sum-row.total { font-size: 1rem; color: #1a1a2e; font-weight: 600; }
    .sum-row.total strong { font-size: 1.2rem; font-weight: 900; }

    .pay-info { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.85rem; background: #f5f3ff; border-radius: 10px; font-size: 0.82rem; color: #4a3f8f; margin-bottom: 1rem; }
    .pay-info.cod { background: #f0fdf9; color: #00897b; }
    .pay-icon { font-size: 1rem; }
    .pay-badge { padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; margin-left: auto; }
    .pay-paid { background: #e8f5e9; color: #2e7d32; }
    .pay-pending { background: #fff8e1; color: #f39c12; }

    .addr-box { background: #f7f8fc; border-radius: 10px; padding: 0.85rem; }
    .addr-label { font-size: 0.75rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem; }
    .addr-text { font-size: 0.85rem; color: #333; line-height: 1.6; }

    .tracking-card { margin-bottom: 1.5rem; }
    .track-steps { display: flex; align-items: center; padding: 0.5rem 0; }
    .track-step { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; min-width: 80px; }
    .step-icon { font-size: 1.5rem; line-height: 1; }
    .step-label { font-size: 0.75rem; font-weight: 600; color: #bbb; text-align: center; }
    .step-date { font-size: 0.68rem; color: #bbb; text-align: center; }
    .track-step.done .step-label { color: #6c63ff; }
    .track-step.done .step-date { color: #6c63ff; }
    .track-line { flex: 1; height: 2px; background: #e9ecef; margin: 0 0.5rem; margin-bottom: 24px; transition: background 0.3s; }
    .track-line.active { background: #6c63ff; }

    .actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; padding-bottom: 2rem; }
    .btn-shop { background: #6c63ff; color: #fff; text-decoration: none; padding: 0.9rem 2rem; border-radius: 30px; font-weight: 700; font-size: 0.95rem; }
    .btn-shop:hover { background: #5a52d5; }
    .btn-orders { background: #fff; color: #6c63ff; text-decoration: none; padding: 0.9rem 2rem; border-radius: 30px; font-weight: 700; font-size: 0.95rem; border: 2px solid #6c63ff; }
    .btn-orders:hover { background: #f5f3ff; }

    @media (max-width: 768px) {
      .two-col { grid-template-columns: 1fr; }
      .order-banner { flex-direction: column; }
      .track-steps { overflow-x: auto; }
    }
  `]
})
export class OrderSuccessComponent implements OnInit {
  order: Order | null = null;
  loading = true;

  get subtotal() {
    if (!this.order) return 0;
    return this.order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  }

  constructor(private route: ActivatedRoute, private orderService: OrderService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.orderService.getById(id).subscribe({
      next: o => { this.order = o; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
