import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminCustomer, AdminOrderSummary } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-head">
        <div><h1>Customers</h1><p>{{ total }} registered customers</p></div>
      </div>
      <div class="filters-bar">
        <input [(ngModel)]="search" (ngModelChange)="onFilterChange()" placeholder="🔍 Search name, email..." class="search-input">
        <select [(ngModel)]="roleFilter" (ngModelChange)="onFilterChange()" class="sel">
          <option value="">All Roles</option>
          <option value="Customer">Customer</option>
          <option value="Manager">Manager</option>
        </select>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Orders</th><th>Total Spent</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="loading"><td colspan="8" class="empty-row">Loading...</td></tr>
              <tr *ngFor="let c of customers">
                <td><strong>#{{ c.id }}</strong></td>
                <td>
                  <div class="cust-row">
                    <div class="cust-avatar">{{ c.fullName.charAt(0).toUpperCase() }}</div>
                    <span class="cust-name">{{ c.fullName }}</span>
                  </div>
                </td>
                <td class="email-cell">{{ c.email }}</td>
                <td><span [class]="'role-badge role-' + c.role.toLowerCase()">{{ c.role }}</span></td>
                <td>{{ c.totalOrders }}</td>
                <td><strong>₹{{ c.totalSpent | number }}</strong></td>
                <td>{{ c.createdAt }}</td>
                <td>
                  <button class="btn-icon" (click)="viewCustomer(c)" title="View details">👁</button>
                </td>
              </tr>
              <tr *ngIf="!loading && customers.length === 0"><td colspan="8" class="empty-row">No customers found</td></tr>
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

    <!-- Detail panel -->
    <div class="modal-overlay" *ngIf="selected" (click)="selected = null">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h2>Customer Profile</h2>
          <button class="close-btn" (click)="selected = null">✕</button>
        </div>
        <div class="modal-body">
          <div class="profile-card">
            <div class="profile-avatar">{{ selected.fullName.charAt(0).toUpperCase() }}</div>
            <div>
              <h3>{{ selected.fullName }}</h3>
              <p>{{ selected.email }}</p>
              <span [class]="'role-badge role-' + selected.role.toLowerCase()">{{ selected.role }}</span>
            </div>
          </div>
          <div class="stats-row">
            <div class="mini-stat"><div class="ms-num">{{ selected.totalOrders }}</div><div class="ms-label">Orders</div></div>
            <div class="mini-stat"><div class="ms-num">₹{{ selected.totalSpent | number }}</div><div class="ms-label">Total Spent</div></div>
            <div class="mini-stat"><div class="ms-num">{{ selected.createdAt }}</div><div class="ms-label">Joined</div></div>
          </div>
          <div *ngIf="custOrders.length > 0">
            <h4 class="sec-label">Order History</h4>
            <div class="order-list">
              <div *ngFor="let o of custOrders" class="order-row">
                <span class="oid">#{{ o.id }}</span>
                <span class="oitems">{{ o.itemCount }} items</span>
                <span class="oamt">₹{{ o.totalAmount | number }}</span>
                <span [class]="'badge badge-' + o.status.toLowerCase()">{{ o.status }}</span>
                <span class="odate">{{ o.orderDate }}</span>
              </div>
            </div>
          </div>
          <p *ngIf="custOrders.length === 0" class="no-orders">No orders placed yet.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-wrap { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; }
    .page-head h1 { font-size: 1.5rem; font-weight: 800; color: #1e2a38; }
    .page-head p { font-size: 0.85rem; color: #888; }
    .filters-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 200px; padding: 0.6rem 1rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; }
    .search-input:focus { border-color: #6c63ff; }
    .sel { padding: 0.6rem 0.85rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; background: #fff; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.85rem 1rem; border-bottom: 2px solid #f0f0f0; background: #fafafa; white-space: nowrap; }
    .data-table td { padding: 0.75rem 1rem; font-size: 0.875rem; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .data-table tr:hover td { background: #f9f9ff; }
    .empty-row { text-align: center; color: #888; padding: 2.5rem !important; }
    .cust-row { display: flex; align-items: center; gap: 0.75rem; }
    .cust-avatar { width: 32px; height: 32px; background: #6c63ff; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
    .cust-name { font-weight: 600; color: #1e2a38; }
    .email-cell { color: #888; font-size: 0.8rem; }
    .role-badge { padding: 0.2rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
    .role-customer { background: #f0edff; color: #6c63ff; }
    .role-manager { background: #e3f2fd; color: #1976d2; }
    .role-admin { background: #fce4ec; color: #c62828; }
    .btn-icon { background: #f5f5f5; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; transition: all 0.18s; }
    .btn-icon:hover { background: #f0edff; transform: scale(1.1); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal { background: #fff; border-radius: 20px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #f0f0f0; }
    .modal-head h2 { font-size: 1.1rem; font-weight: 700; color: #1e2a38; }
    .close-btn { background: #f5f5f5; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .profile-card { display: flex; align-items: center; gap: 1.25rem; background: #f9f9ff; border-radius: 14px; padding: 1.25rem; }
    .profile-avatar { width: 60px; height: 60px; background: #6c63ff; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; flex-shrink: 0; }
    .profile-card h3 { font-size: 1.1rem; font-weight: 700; color: #1e2a38; margin-bottom: 0.2rem; }
    .profile-card p { color: #888; font-size: 0.85rem; margin-bottom: 0.5rem; }
    .stats-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.75rem; }
    .mini-stat { background: #f9f9ff; border-radius: 10px; padding: 1rem; text-align: center; }
    .ms-num { font-size: 1rem; font-weight: 800; color: #1e2a38; }
    .ms-label { font-size: 0.72rem; color: #888; margin-top: 0.15rem; }
    .sec-label { font-size: 0.85rem; font-weight: 700; color: #1e2a38; margin-bottom: 0.75rem; }
    .order-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .order-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.85rem; background: #f9f9ff; border-radius: 10px; font-size: 0.8rem; flex-wrap: wrap; }
    .oid { font-weight: 700; color: #6c63ff; }
    .oitems { color: #888; }
    .oamt { font-weight: 700; color: #1e2a38; }
    .odate { color: #aaa; margin-left: auto; }
    .badge { padding: 0.2rem 0.55rem; border-radius: 20px; font-size: 0.68rem; font-weight: 700; }
    .badge-pending { background: #fff8e1; color: #f39c12; }
    .badge-delivered { background: #e8f5e9; color: #2e7d32; }
    .badge-cancelled { background: #fce4ec; color: #c62828; }
    .no-orders { text-align: center; color: #888; font-size: 0.875rem; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem; font-size: 0.875rem; color: #555; border-top: 1px solid #f5f5f5; }
    .pagination button { background: #6c63ff; color: #fff; border: none; border-radius: 8px; padding: 0.4rem 1rem; cursor: pointer; font-size: 0.82rem; }
    .pagination button:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class AdminCustomersComponent implements OnInit {
  customers: AdminCustomer[] = [];
  loading = true; search = ''; roleFilter = '';
  page = 1; pageSize = 20; total = 0;
  Math = Math;
  private searchDebounce: any;
  selected: AdminCustomer | null = null;
  custOrders: AdminOrderSummary[] = [];

  constructor(private adminService: AdminService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.adminService.getCustomers(this.page, this.pageSize, this.search || undefined, this.roleFilter || undefined).subscribe({
      next: res => { this.customers = res.data; this.total = res.total; this.loading = false; },
      error: () => this.loading = false
    });
  }

  changePage(p: number) { this.page = p; this.load(); }
  onFilterChange() {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.page = 1; this.load(); }, 350);
  }

  viewCustomer(c: AdminCustomer) {
    this.selected = c;
    this.custOrders = [];
    this.adminService.getCustomerOrders(c.id).subscribe({ next: o => this.custOrders = o });
  }
}
