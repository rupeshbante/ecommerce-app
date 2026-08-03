import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.models';

interface TrackingStep {
  status: string;
  label: string;
  icon: string;
  reached: boolean;
  isCurrent: boolean;
  timestamp?: string;
  note?: string;
}

const STATUS_ORDER = ['Pending', 'Processing', 'Shipped', 'Delivered'];
const STEP_META: Record<string, { label: string; icon: string }> = {
  Pending:    { label: 'Order Placed',    icon: '🛒' },
  Processing: { label: 'Processing',      icon: '⚙️' },
  Shipped:    { label: 'Shipped',         icon: '🚚' },
  Delivered:  { label: 'Delivered',       icon: '✅' },
};

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="header-inner">
        <div>
          <h1>Order Details</h1>
          <p class="subtitle" *ngIf="order">Order #{{ order.id }}</p>
        </div>
        <nav class="breadcrumb">
          <a routerLink="/">Home</a><span>/</span>
          <a routerLink="/orders">My Orders</a><span>/</span>
          <span>Detail</span>
        </nav>
      </div>
    </div>

    <div class="container">
      <!-- Skeleton -->
      <div *ngIf="loading" class="skeleton">
        <div class="sk-banner"></div>
        <div class="sk-body">
          <div class="sk-line" style="width:70%"></div>
          <div class="sk-line" style="width:50%"></div>
          <div class="sk-line" style="width:60%"></div>
        </div>
      </div>

      <!-- Not found -->
      <div *ngIf="!loading && !order" class="not-found">
        <div class="nf-icon">📦</div>
        <h2>Order not found</h2>
        <a routerLink="/orders" class="btn-back">← Back to Orders</a>
      </div>

      <div *ngIf="!loading && order" class="detail-wrap">
        <!-- Status bar -->
        <div class="status-bar">
          <div class="sb-left">
            <span class="order-num">Order #{{ order.id }}</span>
            <span class="order-date">{{ order.orderDate | date:'dd MMMM yyyy, h:mm a' }}</span>
          </div>
          <span [class]="'status-badge status-' + order.status.toLowerCase()">{{ statusIcon(order.status) }} {{ order.status }}</span>
        </div>

        <!-- Tracking timeline -->
        <div class="timeline-card">
          <div class="tl-header">
            <h3>Order Tracking</h3>
            <span *ngIf="order.status !== 'Delivered' && order.status !== 'Cancelled'" class="eta-chip">
              📅 Est. delivery: {{ estimatedDelivery }}
            </span>
          </div>
          <div class="courier-row" *ngIf="order.trackingNumber">
            <div class="courier-info">
              <span class="courier-label">{{ order.carrier || 'Courier' }} Tracking No.</span>
              <span class="courier-number">{{ order.trackingNumber }}</span>
            </div>
            <button class="btn-copy" (click)="copyTracking()">{{ copied ? '✓ Copied' : '📋 Copy' }}</button>
          </div>
          <div class="timeline">
            <ng-container *ngFor="let step of trackingSteps; let last = last">
              <div class="tl-item" [class.active]="step.reached" [class.current]="step.isCurrent">
                <div class="tl-dot-wrap">
                  <div class="tl-dot" [class.active]="step.reached" [class.pulse]="step.isCurrent">
                    <span *ngIf="step.reached && !step.isCurrent" class="tl-check">✓</span>
                    <span *ngIf="step.isCurrent" class="tl-icon">{{ step.icon }}</span>
                    <span *ngIf="!step.reached" class="tl-icon-dim">{{ step.icon }}</span>
                  </div>
                </div>
                <div class="tl-content">
                  <span class="tl-title" [class.tl-active-title]="step.isCurrent">{{ step.label }}</span>
                  <span class="tl-date" *ngIf="step.timestamp">{{ step.timestamp | date:'dd MMM yyyy, h:mm a' }}</span>
                  <span class="tl-note" *ngIf="step.note">{{ step.note }}</span>
                  <span class="tl-date tl-pending" *ngIf="!step.timestamp && !step.reached">Upcoming</span>
                </div>
              </div>
              <div *ngIf="!last" class="tl-connector" [class.filled]="step.reached"></div>
            </ng-container>
          </div>
        </div>

        <div class="grid-2">
          <!-- Items -->
          <div class="items-card">
            <h3>Items ({{ order.items.length }})</h3>
            <div class="item-list">
              <div class="item-row" *ngFor="let item of order.items">
                <a [routerLink]="['/products', item.productId]" class="item-img">
                  <img [src]="item.productImageUrl || 'https://placehold.co/80x80?text=Img'"
                       [alt]="item.productName"
                       (error)="$any($event.target).src='https://placehold.co/80x80?text=Img'">
                </a>
                <div class="item-info">
                  <a [routerLink]="['/products', item.productId]" class="item-name">{{ item.productName }}</a>
                  <span class="item-meta">Qty: {{ item.quantity }} × ₹{{ item.unitPrice | number }}</span>
                </div>
                <span class="item-total">₹{{ (item.unitPrice * item.quantity) | number }}</span>
              </div>
            </div>
          </div>

          <!-- Right column -->
          <div class="right-col">
            <!-- Price breakdown -->
            <div class="price-card">
              <h3>Price Details</h3>
              <div class="price-lines">
                <div class="price-row">
                  <span>Subtotal ({{ order.items.length }} items)</span>
                  <span>₹{{ subtotal | number }}</span>
                </div>
                <div class="price-row discount" *ngIf="order.discountAmount && order.discountAmount > 0">
                  <span>Coupon Discount ({{ order.couponCode }})</span>
                  <span>−₹{{ order.discountAmount | number }}</span>
                </div>
                <div class="price-row discount" *ngIf="order.pointsDiscountAmount && order.pointsDiscountAmount > 0">
                  <span>Loyalty Points Used ({{ order.pointsRedeemed }} pts)</span>
                  <span>−₹{{ order.pointsDiscountAmount | number }}</span>
                </div>
                <div class="price-row">
                  <span>Delivery</span>
                  <span [class.free]="order.totalAmount >= 500">{{ subtotal >= 500 ? 'FREE' : '₹99' }}</span>
                </div>
                <div class="price-divider"></div>
                <div class="price-row total">
                  <span>Total Amount</span>
                  <strong>₹{{ order.totalAmount | number }}</strong>
                </div>
              </div>
            </div>

            <!-- Payment info -->
            <div class="info-card">
              <h3>Payment</h3>
              <div *ngIf="order.payment" class="pay-row">
                <div class="pay-method">💳 {{ order.payment.method }}</div>
                <span [class]="'pay-badge pay-' + order.payment.status.toLowerCase()">{{ order.payment.status }}</span>
              </div>
              <div *ngIf="!order.payment" class="pay-row">
                <div class="pay-method">💵 Cash on Delivery</div>
                <span class="pay-badge pay-pending">Pending</span>
              </div>
            </div>

            <!-- Delivery address -->
            <div class="info-card">
              <h3>Delivery Address</h3>
              <div class="addr-text">{{ order.shippingAddress }}</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="order-actions">
          <a routerLink="/orders" class="btn-back-orders">← All Orders</a>
          <button (click)="downloadInvoice()" class="btn-invoice" [disabled]="generatingPdf">
            <span *ngIf="!generatingPdf">📄 Download Invoice</span>
            <span *ngIf="generatingPdf">⏳ Generating...</span>
          </button>
          <a *ngIf="order.status === 'Delivered' && !order.returnRequest"
             routerLink="/returns" class="btn-return">↩️ Request Return</a>
          <span *ngIf="order.returnRequest"
                [class]="'return-badge ret-' + order.returnRequest.status.toLowerCase()">
            Return: {{ order.returnRequest.status }}
          </span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; background: #f7f8fc; min-height: 100vh; }

    .page-header { background: linear-gradient(135deg,#1a1a2e,#16213e); padding: 2.5rem 2rem; }
    .header-inner { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.6rem; font-weight: 800; color: #fff; }
    .subtitle { font-size: 0.85rem; color: rgba(255,255,255,0.45); margin-top: 0.25rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
    .breadcrumb a { color: rgba(255,255,255,0.5); text-decoration: none; }
    .breadcrumb span { color: rgba(255,255,255,0.3); }

    .container { max-width: 1100px; margin: 0 auto; padding: 2rem; }

    .skeleton { background: #fff; border-radius: 16px; overflow: hidden; }
    .sk-banner { height: 72px; background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; }
    .sk-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .sk-line { height: 12px; border-radius: 6px; background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { to { background-position: -400% 0; } }

    .not-found { text-align: center; padding: 5rem 2rem; background: #fff; border-radius: 20px; }
    .nf-icon { font-size: 4rem; margin-bottom: 1rem; }
    .not-found h2 { font-size: 1.4rem; font-weight: 800; color: #1a1a2e; margin-bottom: 1.5rem; }
    .btn-back { background: #6c63ff; color: #fff; text-decoration: none; padding: 0.75rem 1.75rem; border-radius: 30px; font-weight: 700; }

    .detail-wrap { display: flex; flex-direction: column; gap: 1.5rem; }

    .status-bar { background: #fff; border-radius: 14px; padding: 1.25rem 1.75rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .sb-left { display: flex; flex-direction: column; gap: 0.3rem; }
    .order-num { font-size: 1.2rem; font-weight: 900; color: #1a1a2e; }
    .order-date { font-size: 0.82rem; color: #888; }
    .status-badge { padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.82rem; font-weight: 700; }
    .status-pending { background: #fff8e1; color: #f39c12; }
    .status-processing { background: #e3f2fd; color: #1976d2; }
    .status-shipped { background: #e8f5e9; color: #2e7d32; }
    .status-delivered { background: #e8f5e9; color: #2e7d32; }
    .status-cancelled { background: #fce4ec; color: #c62828; }

    .timeline-card, .items-card, .price-card, .info-card { background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    h3 { font-size: 0.95rem; font-weight: 800; color: #1a1a2e; margin-bottom: 1.25rem; }

    .tl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .tl-header h3 { margin-bottom: 0; }
    .eta-chip { font-size: 0.78rem; font-weight: 600; color: #6c63ff; background: #f0edff; padding: 0.3rem 0.75rem; border-radius: 20px; }
    .courier-row { display: flex; justify-content: space-between; align-items: center; background: #f9f9ff; border: 1px dashed #d8d3ff; border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1.25rem; }
    .courier-info { display: flex; flex-direction: column; gap: 0.15rem; }
    .courier-label { font-size: 0.72rem; color: #888; font-weight: 600; text-transform: uppercase; }
    .courier-number { font-size: 0.95rem; color: #1a1a2e; font-weight: 800; letter-spacing: 0.5px; }
    .btn-copy { background: #6c63ff; color: #fff; border: none; border-radius: 20px; padding: 0.4rem 0.9rem; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
    .timeline { display: flex; flex-direction: column; }
    .tl-item { display: flex; gap: 1rem; align-items: flex-start; }
    .tl-dot-wrap { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
    .tl-dot { width: 36px; height: 36px; border-radius: 50%; background: #f0f0f0; border: 2px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: all 0.3s; }
    .tl-dot.active { background: #6c63ff; border-color: #6c63ff; }
    .tl-dot.pulse { background: #6c63ff; border-color: #6c63ff; box-shadow: 0 0 0 6px rgba(108,99,255,0.15); animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 6px rgba(108,99,255,0.15); } 50% { box-shadow: 0 0 0 10px rgba(108,99,255,0.05); } }
    .tl-check { color: #fff; font-size: 0.85rem; font-weight: 700; }
    .tl-icon { font-size: 0.95rem; }
    .tl-icon-dim { font-size: 0.95rem; opacity: 0.3; }
    .tl-connector { width: 2px; height: 28px; background: #e9ecef; margin-left: 17px; transition: background 0.3s; }
    .tl-connector.filled { background: #6c63ff; }
    .tl-content { display: flex; flex-direction: column; gap: 0.15rem; padding-bottom: 1.25rem; padding-top: 0.4rem; }
    .tl-title { font-size: 0.88rem; font-weight: 700; color: #aaa; }
    .tl-active-title { color: #6c63ff; }
    .tl-item.active .tl-title { color: #333; }
    .tl-date { font-size: 0.78rem; color: #6c63ff; font-weight: 600; }
    .tl-note { font-size: 0.75rem; color: #888; margin-top: 0.1rem; }
    .tl-pending { color: #ccc; font-size: 0.75rem; }

    .grid-2 { display: grid; grid-template-columns: 1fr 320px; gap: 1.5rem; }

    .item-list { display: flex; flex-direction: column; gap: 1.1rem; }
    .item-row { display: flex; align-items: center; gap: 1rem; }
    .item-img { flex-shrink: 0; }
    .item-img img { width: 80px; height: 80px; border-radius: 12px; object-fit: cover; display: block; }
    .item-info { flex: 1; min-width: 0; }
    .item-name { display: block; font-size: 0.9rem; font-weight: 600; color: #1a1a2e; text-decoration: none; margin-bottom: 0.3rem; }
    .item-name:hover { color: #6c63ff; }
    .item-meta { font-size: 0.78rem; color: #888; }
    .item-total { font-weight: 800; color: #1a1a2e; white-space: nowrap; }

    .right-col { display: flex; flex-direction: column; gap: 1rem; }

    .price-lines { display: flex; flex-direction: column; gap: 0.7rem; }
    .price-row { display: flex; justify-content: space-between; font-size: 0.875rem; color: #555; }
    .price-row.discount { color: #00b894; font-weight: 600; }
    .price-row .free { color: #00b894; font-weight: 700; }
    .price-divider { border-top: 1px solid #f0f0f0; }
    .price-row.total { font-weight: 700; color: #1a1a2e; font-size: 0.95rem; }
    .price-row.total strong { font-size: 1.15rem; font-weight: 900; }

    .pay-row { display: flex; justify-content: space-between; align-items: center; }
    .pay-method { font-size: 0.88rem; font-weight: 600; color: #333; }
    .pay-badge { padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .pay-paid { background: #e8f5e9; color: #2e7d32; }
    .pay-pending { background: #fff8e1; color: #f39c12; }
    .pay-failed { background: #fce4ec; color: #c62828; }

    .addr-text { font-size: 0.85rem; color: #444; line-height: 1.7; }

    .order-actions { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; padding-bottom: 1rem; }
    .btn-back-orders { color: #6c63ff; text-decoration: none; font-weight: 700; font-size: 0.9rem; }
    .btn-back-orders:hover { text-decoration: underline; }
    .btn-invoice { background: #6c63ff; color: #fff; border: none; cursor: pointer; font-size: 0.85rem; font-weight: 700; padding: 0.5rem 1.25rem; border-radius: 20px; transition: opacity 0.2s; }
    .btn-invoice:hover { opacity: 0.88; }
    .btn-invoice:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-return { background: #fff8e1; color: #f39c12; text-decoration: none; font-size: 0.82rem; font-weight: 700; padding: 0.45rem 1rem; border-radius: 20px; border: 1px solid #ffe082; }
    .return-badge { font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; }
    .ret-pending { background: #fff8e1; color: #f39c12; }
    .ret-approved { background: #e8f5e9; color: #2e7d32; }
    .ret-rejected { background: #fce4ec; color: #c62828; }

    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; }
      .timeline { overflow-x: auto; }
      .status-bar { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    }
  `]
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  loading = true;
  generatingPdf = false;
  copied = false;

  get subtotal() {
    if (!this.order) return 0;
    return this.order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  }

  get trackingSteps(): TrackingStep[] {
    if (!this.order) return [];
    const currentIdx = STATUS_ORDER.indexOf(this.order.status);
    return STATUS_ORDER.map((status, i) => {
      const histEntry = this.order!.statusHistory?.find(h => h.status === status);
      return {
        status,
        label: STEP_META[status].label,
        icon: STEP_META[status].icon,
        reached: i <= currentIdx,
        isCurrent: i === currentIdx,
        timestamp: histEntry?.changedAt,
        note: histEntry?.note ?? undefined,
      };
    });
  }

  get estimatedDelivery(): string {
    if (!this.order) return '';
    const shipped = this.order.statusHistory?.find(h => h.status === 'Shipped');
    const base = shipped ? new Date(shipped.changedAt) : new Date(this.order.orderDate);
    const eta = new Date(base);
    eta.setDate(eta.getDate() + 5);
    return eta.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  constructor(private route: ActivatedRoute, private orderService: OrderService) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.orderService.getById(id).subscribe({
      next: o => { this.order = o; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  copyTracking() {
    if (!this.order?.trackingNumber) return;
    navigator.clipboard.writeText(this.order.trackingNumber).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

  statusIcon(status: string): string {
    const icons: Record<string, string> = { Pending: '🕐', Processing: '⚙️', Shipped: '🚚', Delivered: '✅', Cancelled: '❌' };
    return icons[status] ?? '📦';
  }

  async downloadInvoice() {
    if (!this.order) return;
    this.generatingPdf = true;
    try {
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ]);
      this.buildPdf(jsPDF, autoTable);
    } finally {
      this.generatingPdf = false;
    }
  }

  private buildPdf(jsPDF: any, autoTable: any) {
    const o = this.order!;
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const rs = (n: number) => 'Rs.' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    const date = new Date(o.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const payMethod = o.payment?.method || 'Cash on Delivery';
    const subtotal = o.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const delivery = subtotal >= 500 ? 0 : 99;

    // ── Header ──────────────────────────────────────────────
    doc.setFillColor(108, 99, 255);
    doc.rect(0, 0, 210, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22); doc.setFont('helvetica', 'bold');
    doc.text('ShopEase', 14, 17);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 195, 255);
    doc.text('Your Premium Shopping Destination', 14, 25);

    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('INVOICE', 196, 17, { align: 'right' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 195, 255);
    doc.text(`Order #${o.id}`, 196, 25, { align: 'right' });

    // ── Meta row ────────────────────────────────────────────
    doc.setFillColor(250, 250, 252);
    doc.rect(0, 38, 210, 30, 'F');
    doc.setDrawColor(235, 235, 235);
    doc.line(0, 68, 210, 68);

    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(170, 170, 170);
    doc.text('BILL TO', 14, 46);
    doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 46);
    const addrLines: string[] = doc.splitTextToSize(o.shippingAddress, 90);
    doc.text(addrLines.slice(0, 2), 14, 53);

    const meta = [
      { label: 'DATE', value: date, x: 118 },
      { label: 'STATUS', value: o.status, x: 153 },
      { label: 'PAYMENT', value: payMethod.length > 15 ? payMethod.slice(0, 15) + '...' : payMethod, x: 181 },
    ];
    meta.forEach(m => {
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(170, 170, 170);
      doc.text(m.label, m.x, 46);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(26, 26, 46);
      doc.text(m.value, m.x, 54);
    });

    // ── Items table ─────────────────────────────────────────
    autoTable(doc, {
      startY: 74,
      margin: { left: 14, right: 14 },
      head: [['#', 'Product', 'Qty', 'Unit Price', 'Total']],
      body: o.items.map((item, i) => [
        i + 1, item.productName, item.quantity,
        rs(item.unitPrice), rs(item.unitPrice * item.quantity)
      ]),
      headStyles: { fillColor: [108, 99, 255], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: 4 },
      bodyStyles: { fontSize: 9, textColor: [26, 26, 46], cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 247, 255] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
      },
    });

    // ── Price summary ───────────────────────────────────────
    let ry: number = (doc as any).lastAutoTable.finalY + 10;
    const sx = 118, rx = 196;

    const summaryLines: Array<{ label: string; value: string; green?: boolean }> = [
      { label: `Subtotal (${o.items.length} items)`, value: rs(subtotal) },
    ];
    if (o.discountAmount && o.discountAmount > 0)
      summaryLines.push({ label: `Discount (${o.couponCode})`, value: `-${rs(o.discountAmount)}`, green: true });
    if (o.pointsDiscountAmount && o.pointsDiscountAmount > 0)
      summaryLines.push({ label: `Loyalty Points Used (${o.pointsRedeemed} pts)`, value: `-${rs(o.pointsDiscountAmount)}`, green: true });
    summaryLines.push({ label: 'Delivery', value: delivery === 0 ? 'FREE' : rs(delivery), green: delivery === 0 });

    summaryLines.forEach(row => {
      if (row.green) doc.setTextColor(0, 184, 148); else doc.setTextColor(100, 100, 100);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(row.label, sx, ry);
      doc.text(row.value, rx, ry, { align: 'right' });
      doc.setDrawColor(235, 235, 235);
      doc.line(sx, ry + 2, rx, ry + 2);
      ry += 9;
    });

    doc.setFillColor(243, 240, 255);
    doc.roundedRect(sx - 2, ry, rx - sx + 4, 13, 2, 2, 'F');
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 26, 46);
    doc.text('Total Amount', sx + 3, ry + 8);
    doc.setTextColor(108, 99, 255);
    doc.text(rs(o.totalAmount), rx - 2, ry + 8, { align: 'right' });

    // ── Footer ──────────────────────────────────────────────
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 277, 210, 20, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 180);
    doc.text('Thank you for shopping with ShopEase!', 14, 288);
    doc.setTextColor(80, 80, 120);
    doc.text('shopease.in', 196, 288, { align: 'right' });

    doc.save(`ShopEase-Invoice-${o.id}.pdf`);
  }
}
