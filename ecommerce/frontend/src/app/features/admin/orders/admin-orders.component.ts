import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminOrderSummary, AdminOrderDetail } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-head">
        <div><h1>Orders</h1><p>{{ total }} orders found</p></div>
        <div class="status-tabs">
          <button *ngFor="let s of statuses" [class.active]="activeStatus === s.val" (click)="setStatus(s.val)">
            {{ s.label }}
          </button>
        </div>
      </div>

      <div class="filters-bar">
        <input [(ngModel)]="search" (ngModelChange)="onSearchChange()" placeholder="🔍 Search by customer, email, order #..." class="search-input">
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>#</th><th>Customer</th><th>Email</th><th>Items</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="loading"><td colspan="8" class="empty-row">Loading orders...</td></tr>
              <tr *ngFor="let o of orders">
                <td><strong>#{{ o.id }}</strong></td>
                <td>{{ o.customerName }}</td>
                <td class="email-cell">{{ o.customerEmail }}</td>
                <td>{{ o.itemCount }}</td>
                <td><strong>₹{{ o.totalAmount | number }}</strong></td>
                <td>
                  <select [value]="o.status" (change)="updateStatus(o, $any($event.target).value)" class="status-sel" [class]="'status-sel-' + o.status.toLowerCase()">
                    <option *ngFor="let s of statusOptions" [value]="s">{{ s }}</option>
                  </select>
                </td>
                <td>{{ o.orderDate }}</td>
                <td>
                  <button class="btn-icon" (click)="viewDetail(o.id)" title="View details">👁</button>
                </td>
              </tr>
              <tr *ngIf="!loading && orders.length === 0"><td colspan="8" class="empty-row">No orders found</td></tr>
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

    <!-- Detail modal -->
    <div class="modal-overlay" *ngIf="detail" (click)="closeDetail()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h2>Order #{{ detail.id }} — Details</h2>
          <button class="close-btn" (click)="closeDetail()">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-block">
              <h4>Customer</h4>
              <p>{{ detail.customerName }}</p>
              <p class="sub">{{ detail.customerEmail }}</p>
            </div>
            <div class="detail-block">
              <h4>Order Info</h4>
              <p>Date: {{ detail.orderDate }}</p>
              <p>Status: <span [class]="'badge badge-' + detail.status.toLowerCase()">{{ detail.status }}</span></p>
            </div>
            <div class="detail-block full">
              <h4>Shipping Address</h4>
              <p>{{ detail.shippingAddress }}</p>
            </div>
          </div>
          <div class="items-section">
            <h4>Order Items</h4>
            <table class="items-table">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                <tr *ngFor="let item of detail.items">
                  <td>{{ item.productName }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>₹{{ item.unitPrice | number }}</td>
                  <td><strong>₹{{ (item.unitPrice * item.quantity) | number }}</strong></td>
                </tr>
              </tbody>
              <tfoot>
                <tr><td colspan="3" class="total-label">Total</td><td><strong>₹{{ detail.totalAmount | number }}</strong></td></tr>
              </tfoot>
            </table>
          </div>
          <div class="status-update">
            <h4>Update Status</h4>
            <div class="status-row">
              <select [(ngModel)]="newStatus" class="sel"><option *ngFor="let s of statusOptions" [value]="s">{{ s }}</option></select>
              <button class="btn-update" (click)="applyStatusUpdate()">Update</button>
            </div>
            <div class="tracking-row" *ngIf="newStatus === 'Shipped' || detail.trackingNumber">
              <input [(ngModel)]="trackingNumber" placeholder="Tracking number (optional)" class="sel">
              <input [(ngModel)]="carrier" placeholder="Carrier e.g. BlueDart (optional)" class="sel">
            </div>
          </div>
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
    .status-tabs { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .status-tabs button { background: #f5f5f5; border: none; border-radius: 20px; padding: 0.4rem 0.85rem; font-size: 0.8rem; font-weight: 600; cursor: pointer; color: #555; transition: all 0.18s; display: flex; align-items: center; gap: 0.4rem; }
    .status-tabs button.active { background: #6c63ff; color: #fff; }
    .tab-count { background: rgba(255,255,255,0.25); border-radius: 20px; padding: 0 0.4rem; font-size: 0.7rem; }
    .filters-bar { display: flex; gap: 0.75rem; }
    .search-input { flex: 1; padding: 0.6rem 1rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; }
    .search-input:focus { border-color: #6c63ff; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.85rem 1rem; border-bottom: 2px solid #f0f0f0; background: #fafafa; white-space: nowrap; }
    .data-table td { padding: 0.75rem 1rem; font-size: 0.875rem; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .data-table tr:hover td { background: #f9f9ff; }
    .empty-row { text-align: center; color: #888; padding: 2.5rem !important; }
    .email-cell { color: #888; font-size: 0.8rem; }
    .status-sel { padding: 0.3rem 0.5rem; border: 1.5px solid #e9ecef; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; outline: none; }
    .status-sel-pending { background: #fff8e1; color: #f39c12; border-color: #f39c12; }
    .status-sel-delivered { background: #e8f5e9; color: #2e7d32; border-color: #2e7d32; }
    .status-sel-cancelled { background: #fce4ec; color: #c62828; border-color: #c62828; }
    .status-sel-processing { background: #e3f2fd; color: #1976d2; border-color: #1976d2; }
    .btn-icon { background: #f5f5f5; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; transition: all 0.18s; }
    .btn-icon:hover { background: #f0edff; transform: scale(1.1); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal { background: #fff; border-radius: 20px; width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #f0f0f0; }
    .modal-head h2 { font-size: 1.1rem; font-weight: 700; color: #1e2a38; }
    .close-btn { background: #f5f5f5; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .detail-block { background: #f9f9ff; border-radius: 10px; padding: 1rem; }
    .detail-block.full { grid-column: 1/-1; }
    .detail-block h4 { font-size: 0.75rem; font-weight: 700; color: #888; text-transform: uppercase; margin-bottom: 0.5rem; }
    .detail-block p { font-size: 0.875rem; color: #333; }
    .detail-block .sub { color: #888; font-size: 0.8rem; }
    .badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
    .badge-pending { background: #fff8e1; color: #f39c12; }
    .badge-delivered { background: #e8f5e9; color: #2e7d32; }
    .badge-cancelled { background: #fce4ec; color: #c62828; }
    .items-section h4, .status-update h4 { font-size: 0.85rem; font-weight: 700; color: #1e2a38; margin-bottom: 0.75rem; }
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #888; padding: 0.5rem; border-bottom: 1px solid #eee; }
    .items-table td { padding: 0.6rem 0.5rem; font-size: 0.85rem; border-bottom: 1px solid #f5f5f5; }
    .items-table tfoot td { border-top: 2px solid #eee; padding-top: 0.75rem; }
    .total-label { text-align: right; font-weight: 700; color: #555; }
    .status-row { display: flex; gap: 0.75rem; }
    .tracking-row { display: flex; gap: 0.75rem; margin-top: 0.75rem; }
    .sel { padding: 0.6rem 0.85rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; flex: 1; }
    .btn-update { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.25rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem; font-size: 0.875rem; color: #555; border-top: 1px solid #f5f5f5; }
    .pagination button { background: #6c63ff; color: #fff; border: none; border-radius: 8px; padding: 0.4rem 1rem; cursor: pointer; font-size: 0.82rem; }
    .pagination button:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class AdminOrdersComponent implements OnInit {
  orders: AdminOrderSummary[] = [];
  detail: AdminOrderDetail | null = null;
  loading = true; search = ''; activeStatus = '';
  page = 1; pageSize = 20; total = 0;
  Math = Math;
  private searchDebounce: any;
  newStatus = 'Pending';
  trackingNumber = ''; carrier = '';
  statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  statuses = [
    { label: 'All', val: '' },
    { label: 'Pending', val: 'Pending' },
    { label: 'Processing', val: 'Processing' },
    { label: 'Delivered', val: 'Delivered' },
    { label: 'Cancelled', val: 'Cancelled' },
  ];

  constructor(private adminService: AdminService, private toasts: ToastService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.adminService.getOrders(this.activeStatus || undefined, this.page, this.pageSize, this.search || undefined).subscribe({
      next: res => { this.orders = res.data; this.total = res.total; this.loading = false; },
      error: () => this.loading = false
    });
  }

  setStatus(s: string) { this.activeStatus = s; this.page = 1; this.load(); }
  changePage(p: number) { this.page = p; this.load(); }
  onSearchChange() {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.page = 1; this.load(); }, 350);
  }

  updateStatus(o: AdminOrderSummary, status: string) {
    this.adminService.updateOrderStatus(o.id, status).subscribe({
      next: () => { o.status = status; this.toasts.success(`Order #${o.id} marked as ${status}`); },
      error: () => this.toasts.error('Failed to update.')
    });
  }

  viewDetail(id: number) {
    this.adminService.getOrder(id).subscribe({ next: d => {
      this.detail = d;
      this.newStatus = d.status;
      this.trackingNumber = d.trackingNumber || '';
      this.carrier = d.carrier || '';
    } });
  }

  closeDetail() { this.detail = null; }

  applyStatusUpdate() {
    if (!this.detail) return;
    this.adminService.updateOrderStatus(this.detail.id, this.newStatus, this.trackingNumber || undefined, this.carrier || undefined).subscribe({
      next: () => {
        this.detail!.status = this.newStatus;
        this.detail!.trackingNumber = this.trackingNumber || this.detail!.trackingNumber;
        this.detail!.carrier = this.carrier || this.detail!.carrier;
        this.toasts.success('Status updated!'); this.load();
      },
      error: () => this.toasts.error('Failed.')
    });
  }
}
