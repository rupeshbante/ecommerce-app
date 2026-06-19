import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { AddressService } from '../../core/services/address.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Address } from '../../core/models/address.models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="header-inner">
        <h1>Shopping Cart</h1>
        <nav class="breadcrumb">
          <a routerLink="/">Home</a><span>/</span>
          <a routerLink="/products">Products</a><span>/</span>
          <span>Cart</span>
        </nav>
      </div>
    </div>

    <div *ngIf="cart.items().length === 0" class="empty-cart">
      <div class="empty-wrap">
        <div class="empty-icon">🛒</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything to your cart yet. Start shopping to add items!</p>
        <a routerLink="/products" class="btn-shop">Browse Products →</a>
      </div>
    </div>

    <div *ngIf="cart.items().length > 0" class="cart-layout">
      <!-- Items column -->
      <div class="items-col">
        <div class="items-header">
          <h2>{{ cart.totalItems() }} item{{ cart.totalItems() !== 1 ? 's' : '' }} in cart</h2>
          <button class="clear-link" (click)="clearCart()">Remove all</button>
        </div>

        <div class="cart-item" *ngFor="let item of cart.items()">
          <a [routerLink]="['/products', item.product.id]" class="item-img">
            <img [src]="item.product.imageUrl" [alt]="item.product.name"
                 (error)="$any($event.target).src='https://placehold.co/100x100?text=Img'">
          </a>
          <div class="item-info">
            <span class="item-cat">{{ item.product.category }}</span>
            <a [routerLink]="['/products', item.product.id]" class="item-name">{{ item.product.name }}</a>
            <span class="item-unit">₹{{ item.product.price | number }} each</span>
          </div>
          <div class="item-controls">
            <div class="qty-ctrl">
              <button (click)="cart.updateQuantity(item.product.id, item.quantity - 1)" [disabled]="item.quantity <= 1">−</button>
              <span>{{ item.quantity }}</span>
              <button (click)="cart.updateQuantity(item.product.id, item.quantity + 1)">+</button>
            </div>
            <span class="item-subtotal">₹{{ (item.product.price * item.quantity) | number }}</span>
            <button class="remove-btn" (click)="cart.removeFromCart(item.product.id)" title="Remove item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Order summary sidebar -->
      <div class="summary-col">
        <div class="summary-card">
          <h3>Order Summary</h3>

          <div class="summary-lines">
            <div class="sum-line">
              <span>Subtotal ({{ cart.totalItems() }} items)</span>
              <span>₹{{ cart.totalPrice() | number }}</span>
            </div>
            <div class="sum-line discount-line" *ngIf="couponDiscount > 0">
              <span>Coupon ({{ couponCode }})</span>
              <span class="saved">−₹{{ couponDiscount | number }}</span>
            </div>
            <div class="sum-line">
              <span>Delivery</span>
              <span [class.free]="subtotalAfterCoupon >= 500">{{ subtotalAfterCoupon >= 500 ? 'FREE' : '₹99' }}</span>
            </div>
            <div class="sum-line discount-line" *ngIf="subtotalAfterCoupon >= 500">
              <span>You save on delivery</span>
              <span class="saved">−₹99</span>
            </div>
          </div>

          <div class="sum-total">
            <span>Total</span>
            <strong>₹{{ grandTotal | number }}</strong>
          </div>

          <p class="free-ship-note" *ngIf="subtotalAfterCoupon < 500">
            Add ₹{{ (500 - subtotalAfterCoupon) | number }} more for <strong>free delivery</strong>
          </p>
          <p class="free-ship-note green" *ngIf="subtotalAfterCoupon >= 500">
            🎉 You qualify for <strong>free delivery!</strong>
          </p>

          <div class="divider"></div>

          <!-- Saved Addresses -->
          <div class="addr-section" *ngIf="auth.isLoggedIn() && savedAddresses.length > 0">
            <label>Delivery Address <span class="req">*</span></label>
            <select [(ngModel)]="selectedAddressId" (change)="onAddressSelect()">
              <option value="0">Enter new address...</option>
              <option *ngFor="let a of savedAddresses" [value]="a.id">
                {{ a.label }}: {{ a.fullName }}, {{ a.city }} - {{ a.pincode }}
              </option>
            </select>
          </div>

          <div class="addr-section" *ngIf="selectedAddressId === 0 || !auth.isLoggedIn()">
            <label>{{ savedAddresses.length > 0 ? '' : 'Delivery Address' }} <span class="req">*</span></label>
            <textarea [(ngModel)]="address" rows="3"
              placeholder="Enter your full delivery address..."
              [class.error-border]="addressError"></textarea>
            <p *ngIf="addressError" class="field-error">Please enter a delivery address.</p>
          </div>

          <!-- Coupon Code -->
          <div class="coupon-row">
            <div class="coupon-wrap">
              <input [(ngModel)]="couponCode" placeholder="Have a coupon code?"
                class="coupon-input" [disabled]="couponApplied"
                (keyup.enter)="applyCoupon()" [class.coupon-applied]="couponApplied">
              <button class="coupon-btn" (click)="couponApplied ? removeCoupon() : applyCoupon()"
                [disabled]="couponLoading">
                <span *ngIf="couponLoading">...</span>
                <span *ngIf="!couponLoading">{{ couponApplied ? '✕' : 'Apply' }}</span>
              </button>
            </div>
            <p *ngIf="couponError" class="coupon-error">{{ couponError }}</p>
            <p *ngIf="couponApplied" class="coupon-success">✓ Coupon applied! You save ₹{{ couponDiscount | number }}</p>
          </div>

          <!-- Payment Method -->
          <div class="payment-method">
            <label>Payment Method</label>
            <div class="method-options">
              <label class="method-opt" [class.selected]="payMethod === 'razorpay'">
                <input type="radio" name="payMethod" value="razorpay" [(ngModel)]="payMethod">
                💳 Pay Online (Razorpay)
              </label>
              <label class="method-opt" [class.selected]="payMethod === 'cod'">
                <input type="radio" name="payMethod" value="cod" [(ngModel)]="payMethod">
                💵 Cash on Delivery
              </label>
            </div>
          </div>

          <button class="btn-checkout" (click)="placeOrder()" [disabled]="loading">
            <span *ngIf="!loading">
              🔒 {{ auth.isLoggedIn() ? 'Place Order' : 'Login to Checkout' }}
            </span>
            <span *ngIf="loading" class="loading-dots">Processing...</span>
          </button>

          <div class="trust-badges">
            <span>🔒 SSL Secure</span>
            <span>💳 UPI / Cards</span>
            <span>🚚 Fast Ship</span>
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
    .empty-cart { display: flex; justify-content: center; padding: 6rem 2rem; }
    .empty-wrap { text-align: center; max-width: 440px; }
    .empty-icon { font-size: 5rem; margin-bottom: 1.5rem; line-height: 1; }
    .empty-wrap h2 { font-size: 1.5rem; font-weight: 800; color: #1a1a2e; margin-bottom: 0.75rem; }
    .empty-wrap p { color: #888; line-height: 1.6; margin-bottom: 2rem; }
    .btn-shop { background: #6c63ff; color: #fff; text-decoration: none; padding: 0.9rem 2rem; border-radius: 30px; font-weight: 700; font-size: 0.95rem; display: inline-block; }
    .cart-layout { max-width: 1300px; margin: 0 auto; padding: 2rem; display: grid; grid-template-columns: 1fr 380px; gap: 2rem; align-items: start; }
    .items-col { display: flex; flex-direction: column; gap: 1rem; }
    .items-header { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 14px; padding: 1rem 1.5rem; }
    .items-header h2 { font-size: 1rem; font-weight: 700; color: #1a1a2e; }
    .clear-link { background: none; border: none; color: #e17055; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
    .cart-item { background: #fff; border-radius: 16px; padding: 1.25rem 1.5rem; display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
    .item-img { flex-shrink: 0; border-radius: 12px; overflow: hidden; display: block; }
    .item-img img { width: 90px; height: 90px; object-fit: cover; display: block; }
    .item-info { flex: 1; min-width: 0; }
    .item-cat { font-size: 0.7rem; color: #6c63ff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; display: block; }
    .item-name { display: block; font-size: 0.95rem; font-weight: 600; color: #1a1a2e; text-decoration: none; margin: 0.25rem 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-unit { font-size: 0.82rem; color: #888; }
    .item-controls { display: flex; align-items: center; gap: 1rem; flex-shrink: 0; }
    .qty-ctrl { display: flex; align-items: center; border: 2px solid #e9ecef; border-radius: 10px; overflow: hidden; }
    .qty-ctrl button { width: 34px; height: 34px; background: #f7f8fc; border: none; cursor: pointer; font-size: 1rem; font-weight: 700; color: #333; }
    .qty-ctrl button:hover:not(:disabled) { background: #ebe7ff; color: #6c63ff; }
    .qty-ctrl button:disabled { color: #ccc; cursor: not-allowed; }
    .qty-ctrl span { width: 40px; text-align: center; font-size: 0.95rem; font-weight: 700; border-left: 2px solid #e9ecef; border-right: 2px solid #e9ecef; line-height: 34px; }
    .item-subtotal { font-size: 1.05rem; font-weight: 800; color: #1a1a2e; min-width: 90px; text-align: right; }
    .remove-btn { background: #fff5f5; border: 1.5px solid #ffcdd2; border-radius: 9px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #e17055; }
    .summary-col { position: sticky; top: 84px; }
    .summary-card { background: #fff; border-radius: 20px; padding: 1.75rem; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .summary-card h3 { font-size: 1.1rem; font-weight: 800; color: #1a1a2e; margin-bottom: 1.5rem; }
    .summary-lines { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1rem; }
    .sum-line { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; color: #555; }
    .sum-line .free { color: #00b894; font-weight: 700; }
    .discount-line { color: #00b894; }
    .saved { color: #00b894; font-weight: 700; }
    .sum-total { display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #f0f0f0; padding-top: 1rem; margin-top: 0.5rem; }
    .sum-total span { font-size: 1rem; font-weight: 600; color: #333; }
    .sum-total strong { font-size: 1.35rem; font-weight: 800; color: #1a1a2e; }
    .free-ship-note { font-size: 0.82rem; color: #888; background: #f7f8fc; border-radius: 8px; padding: 0.65rem 0.85rem; margin-top: 0.75rem; line-height: 1.5; }
    .free-ship-note.green { background: #e8f8f5; color: #00b894; }
    .divider { border: none; border-top: 1px solid #f0f0f0; margin: 1.25rem 0; }
    .addr-section label { display: block; font-size: 0.82rem; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.6rem; }
    .req { color: #e17055; }
    textarea, select { width: 100%; padding: 0.85rem; border: 1.5px solid #e9ecef; border-radius: 12px; font-size: 0.875rem; resize: vertical; outline: none; transition: border-color 0.18s; line-height: 1.6; font-family: inherit; background: #fff; }
    textarea:focus, select:focus { border-color: #6c63ff; }
    .error-border { border-color: #e17055 !important; }
    .field-error { color: #e17055; font-size: 0.78rem; margin-top: 0.4rem; }
    .coupon-row { margin-top: 0.75rem; }
    .coupon-wrap { display: flex; gap: 0.5rem; }
    .coupon-input { flex: 1; border: 1.5px dashed #e9ecef; border-radius: 10px; padding: 0.65rem 0.85rem; font-size: 0.875rem; outline: none; font-family: inherit; background: #fafafa; transition: border-color 0.18s; }
    .coupon-input:focus { border-color: #6c63ff; background: #fff; }
    .coupon-input.coupon-applied { border-color: #00b894; background: #f0fdf9; color: #00b894; font-weight: 600; }
    .coupon-input:disabled { cursor: not-allowed; }
    .coupon-btn { padding: 0 1rem; background: #6c63ff; color: #fff; border: none; border-radius: 10px; font-size: 0.82rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background 0.18s; }
    .coupon-btn:hover:not(:disabled) { background: #5a52d5; }
    .coupon-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .coupon-error { color: #e17055; font-size: 0.78rem; margin-top: 0.4rem; }
    .coupon-success { color: #00b894; font-size: 0.78rem; margin-top: 0.4rem; font-weight: 600; }
    .payment-method { margin-top: 1rem; }
    .payment-method label { display: block; font-size: 0.82rem; font-weight: 600; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.6rem; }
    .method-options { display: flex; flex-direction: column; gap: 0.5rem; }
    .method-opt { display: flex; align-items: center; gap: 0.6rem; padding: 0.65rem 0.9rem; border: 1.5px solid #e9ecef; border-radius: 10px; cursor: pointer; font-size: 0.875rem; color: #333; transition: all 0.18s; }
    .method-opt input[type=radio] { accent-color: #6c63ff; }
    .method-opt.selected { border-color: #6c63ff; background: #f5f3ff; color: #6c63ff; font-weight: 600; }
    .btn-checkout { width: 100%; padding: 1rem; margin-top: 1.25rem; background: linear-gradient(135deg, #6c63ff, #a29bfe); color: #fff; border: none; border-radius: 14px; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-checkout:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(108,99,255,0.4); }
    .btn-checkout:disabled { opacity: 0.7; cursor: not-allowed; }
    .trust-badges { display: flex; justify-content: center; gap: 1.25rem; margin-top: 1rem; flex-wrap: wrap; }
    .trust-badges span { font-size: 0.76rem; color: #888; }
    @media (max-width: 900px) { .cart-layout { grid-template-columns: 1fr; } .summary-col { position: static; } }
  `]
})
export class CartComponent implements OnInit {
  address = '';
  addressError = false;
  loading = false;
  savedAddresses: Address[] = [];
  selectedAddressId = 0;
  couponCode = '';
  couponApplied = false;
  couponDiscount = 0;
  couponLoading = false;
  couponError = '';
  payMethod: 'razorpay' | 'cod' = 'razorpay';

  get subtotalAfterCoupon() { return Math.max(0, this.cart.totalPrice() - this.couponDiscount); }
  get grandTotal() { return this.subtotalAfterCoupon + (this.subtotalAfterCoupon >= 500 ? 0 : 99); }

  constructor(
    public cart: CartService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private addressService: AddressService,
    public auth: AuthService,
    private router: Router,
    private toasts: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.addressService.getAll().subscribe({
        next: addrs => {
          this.savedAddresses = addrs;
          const def = addrs.find(a => a.isDefault);
          if (def) this.selectedAddressId = def.id;
        }
      });
    }
  }

  onAddressSelect() {
    if (this.selectedAddressId) {
      const a = this.savedAddresses.find(x => x.id === this.selectedAddressId);
      if (a) this.address = `${a.fullName}, ${a.addressLine1}${a.addressLine2 ? ', ' + a.addressLine2 : ''}, ${a.city}, ${a.state} - ${a.pincode}. Phone: ${a.phone}`;
    } else {
      this.address = '';
    }
  }

  clearCart() {
    this.cart.clearCart();
    this.toasts.info('Cart cleared.');
  }

  applyCoupon() {
    const code = this.couponCode.trim().toUpperCase();
    if (!code) { this.couponError = 'Enter a coupon code.'; return; }
    if (!this.auth.isLoggedIn()) { this.couponError = 'Login to apply coupons.'; return; }
    this.couponLoading = true;
    this.couponError = '';
    this.http.get<any>(`${environment.apiUrl}/coupons/validate/${code}?amount=${this.cart.totalPrice()}`).subscribe({
      next: res => {
        this.couponLoading = false;
        if (res.isValid) {
          this.couponApplied = true;
          this.couponDiscount = res.discountAmount;
          this.couponCode = code;
        } else {
          this.couponError = res.message || 'Invalid coupon.';
        }
      },
      error: () => { this.couponLoading = false; this.couponError = 'Could not validate coupon.'; }
    });
  }

  removeCoupon() {
    this.couponApplied = false;
    this.couponDiscount = 0;
    this.couponCode = '';
    this.couponError = '';
  }

  async placeOrder() {
    if (!this.auth.isLoggedIn()) {
      this.toasts.info('Please login to place an order.');
      this.router.navigate(['/auth/login']);
      return;
    }
    const finalAddress = this.selectedAddressId > 0 ? this.address : this.address.trim();
    if (!finalAddress) {
      this.addressError = true;
      this.toasts.error('Please enter a delivery address.');
      return;
    }
    this.addressError = false;
    this.loading = true;

    const orderPayload = {
      shippingAddress: finalAddress,
      items: this.cart.items().map(i => ({ productId: i.product.id, quantity: i.quantity })),
      couponCode: this.couponCode || undefined,
      addressId: this.selectedAddressId > 0 ? this.selectedAddressId : undefined
    };

    this.orderService.createOrder(orderPayload).subscribe({
      next: async (order) => {
        if (this.payMethod === 'razorpay') {
          await this.handleRazorpayPayment(order.id);
        } else {
          this.cart.clearCart();
          this.toasts.success('Order placed! Pay on delivery. 🎉');
          this.router.navigate(['/orders/success', order.id]);
        }
        this.loading = false;
      },
      error: () => {
        this.toasts.error('Failed to place order. Please try again.');
        this.loading = false;
      }
    });
  }

  private async handleRazorpayPayment(orderId: number) {
    try {
      const rzpOrder = await this.paymentService.createRazorpayOrder(orderId).toPromise();
      if (!rzpOrder) throw new Error('Failed to create payment order');

      const user = this.auth.currentUser();
      const response = await this.paymentService.openRazorpayCheckout(rzpOrder, user?.email ?? '', user?.fullName ?? '');

      await this.paymentService.verifyPayment({
        internalOrderId: orderId,
        razorpayOrderId: rzpOrder.razorpayOrderId,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature
      }).toPromise();

      this.cart.clearCart();
      this.toasts.success('Payment successful! Order confirmed. 🎉');
      this.router.navigate(['/orders/success', orderId]);
    } catch (err: any) {
      if (err?.message === 'Payment cancelled') {
        this.toasts.info('Payment cancelled. Your order is saved — you can pay later.');
      } else {
        this.toasts.error('Payment failed. Please try again.');
      }
      this.router.navigate(['/orders']);
    }
  }
}
