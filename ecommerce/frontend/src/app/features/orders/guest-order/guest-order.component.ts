import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.models';

@Component({
  selector: 'app-guest-order',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="hero">
        <h1>Track Your Order</h1>
        <p>Enter the order number and email you used at checkout.</p>
      </div>

      <div class="lookup-card" *ngIf="!order">
        <div class="field">
          <label>Order Number</label>
          <input [(ngModel)]="lookupId" type="number" placeholder="e.g. 1024">
        </div>
        <div class="field">
          <label>Email</label>
          <input [(ngModel)]="lookupEmail" type="email" placeholder="you@example.com">
        </div>
        <button class="btn-lookup" (click)="lookup()" [disabled]="loading">
          {{ loading ? 'Searching...' : 'Find Order' }}
        </button>
        <p class="error" *ngIf="error">{{ error }}</p>
      </div>

      <div class="content" *ngIf="order">
        <div class="banner">
          <div>
            <span class="label">Order Number</span>
            <span class="order-num">#{{ order.id }}</span>
          </div>
          <span [class]="'status-badge status-' + order.status.toLowerCase()">{{ order.status }}</span>
        </div>

        <div class="items-card">
          <h3>Items</h3>
          <div class="item-row" *ngFor="let item of order.items">
            <img [src]="item.productImageUrl || 'https://placehold.co/56x56?text=Img'" [alt]="item.productName">
            <div class="item-info">
              <span class="item-name">{{ item.productName }}</span>
              <span class="item-qty">Qty: {{ item.quantity }} × ₹{{ item.unitPrice | number }}</span>
            </div>
            <span class="item-total">₹{{ (item.unitPrice * item.quantity) | number }}</span>
          </div>
          <div class="divider"></div>
          <div class="total-row"><span>Total</span><strong>₹{{ order.totalAmount | number }}</strong></div>
        </div>

        <div class="info-card" *ngIf="order.trackingNumber">
          <h3>Tracking</h3>
          <p>{{ order.carrier || 'Courier' }}: <strong>{{ order.trackingNumber }}</strong></p>
        </div>

        <div class="info-card">
          <h3>Delivery Address</h3>
          <p>{{ order.shippingAddress }}</p>
        </div>

        <div class="actions">
          <a routerLink="/products" class="btn-shop">Continue Shopping</a>
          <button class="btn-another" (click)="reset()">Look up another order</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f7f8fc; min-height: 100vh; }
    .page { max-width: 640px; margin: 0 auto; padding: 2.5rem 1.5rem; }
    .hero { text-align: center; margin-bottom: 2rem; }
    .hero h1 { font-size: 1.6rem; font-weight: 900; color: #1a1a2e; margin-bottom: 0.5rem; }
    .hero p { color: #888; font-size: 0.9rem; }
    .lookup-card { background: #fff; border-radius: 16px; padding: 1.75rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 1rem; }
    .field label { display: block; font-size: 0.78rem; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.4rem; }
    .field input { width: 100%; padding: 0.75rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.9rem; outline: none; }
    .field input:focus { border-color: #6c63ff; }
    .btn-lookup { background: #6c63ff; color: #fff; border: none; border-radius: 12px; padding: 0.85rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .btn-lookup:disabled { opacity: 0.6; cursor: not-allowed; }
    .error { color: #e17055; font-size: 0.82rem; }
    .banner { background: #fff; border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 1.25rem; }
    .label { display: block; font-size: 0.72rem; color: #888; text-transform: uppercase; font-weight: 600; }
    .order-num { font-size: 1.2rem; font-weight: 900; color: #6c63ff; }
    .status-badge { padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.82rem; font-weight: 700; }
    .status-pending { background: #fff8e1; color: #f39c12; }
    .status-processing { background: #e3f2fd; color: #1976d2; }
    .status-shipped { background: #e8f5e9; color: #2e7d32; }
    .status-delivered { background: #e8f5e9; color: #2e7d32; }
    .status-cancelled { background: #fce4ec; color: #c62828; }
    .items-card, .info-card { background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 1.25rem; }
    h3 { font-size: 0.9rem; font-weight: 800; color: #1a1a2e; margin-bottom: 1rem; }
    .item-row { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 0.85rem; }
    .item-row img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; }
    .item-info { flex: 1; display: flex; flex-direction: column; }
    .item-name { font-size: 0.88rem; font-weight: 600; color: #1a1a2e; }
    .item-qty { font-size: 0.76rem; color: #888; }
    .item-total { font-weight: 700; color: #1a1a2e; }
    .divider { border-top: 1px solid #f0f0f0; margin: 0.5rem 0; }
    .total-row { display: flex; justify-content: space-between; font-weight: 700; color: #1a1a2e; }
    .total-row strong { font-size: 1.1rem; }
    .info-card p { font-size: 0.85rem; color: #444; line-height: 1.6; }
    .actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }
    .btn-shop { background: #6c63ff; color: #fff; text-decoration: none; padding: 0.8rem 1.75rem; border-radius: 30px; font-weight: 700; font-size: 0.9rem; }
    .btn-another { background: none; border: 2px solid #6c63ff; color: #6c63ff; padding: 0.8rem 1.75rem; border-radius: 30px; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
  `]
})
export class GuestOrderComponent implements OnInit {
  order: Order | null = null;
  loading = false;
  error = '';
  lookupId: number | null = null;
  lookupEmail = '';

  constructor(private route: ActivatedRoute, private router: Router, private orderService: OrderService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const email = this.route.snapshot.queryParamMap.get('email');
    if (id && email) {
      this.lookupId = id;
      this.lookupEmail = email;
      this.fetch(id, email);
    }
  }

  lookup() {
    if (!this.lookupId || !this.lookupEmail.trim()) {
      this.error = 'Enter both order number and email.';
      return;
    }
    this.router.navigate(['/orders/guest', this.lookupId], { queryParams: { email: this.lookupEmail.trim() } });
    this.fetch(this.lookupId, this.lookupEmail.trim());
  }

  private fetch(id: number, email: string) {
    this.loading = true;
    this.error = '';
    this.orderService.getGuestOrder(id, email).subscribe({
      next: o => { this.order = o; this.loading = false; },
      error: () => { this.loading = false; this.error = 'No matching order found for that number and email.'; }
    });
  }

  reset() {
    this.order = null;
    this.lookupId = null;
    this.lookupEmail = '';
    this.error = '';
  }
}
