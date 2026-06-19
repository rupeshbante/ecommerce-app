import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminCustomer } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-head">
        <div><h1>Users & Roles</h1><p>Manage user accounts and permissions</p></div>
      </div>

      <!-- Role legend -->
      <div class="role-legend">
        <div class="rl-card" *ngFor="let r of roleInfo">
          <div class="rl-icon">{{ r.icon }}</div>
          <div>
            <div class="rl-title">{{ r.role }}</div>
            <div class="rl-desc">{{ r.desc }}</div>
          </div>
        </div>
      </div>

      <div class="filters-bar">
        <input [(ngModel)]="search" (ngModelChange)="applyFilter()" placeholder="🔍 Search users..." class="search-input">
        <select [(ngModel)]="roleFilter" (ngModelChange)="applyFilter()" class="sel">
          <option value="">All Roles</option>
          <option value="Admin">Admin</option>
          <option value="Manager">Manager</option>
          <option value="Customer">Customer</option>
        </select>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>ID</th><th>User</th><th>Email</th><th>Current Role</th><th>Orders</th><th>Total Spent</th><th>Joined</th><th>Change Role</th></tr></thead>
            <tbody>
              <tr *ngIf="loading"><td colspan="8" class="empty-row">Loading users...</td></tr>
              <tr *ngFor="let u of filtered">
                <td><strong>#{{ u.id }}</strong></td>
                <td>
                  <div class="user-row">
                    <div class="avatar" [style.background]="avatarColor(u.role)">{{ u.fullName.charAt(0).toUpperCase() }}</div>
                    <span>{{ u.fullName }}</span>
                  </div>
                </td>
                <td class="email-cell">{{ u.email }}</td>
                <td><span [class]="'role-badge role-' + u.role.toLowerCase()">{{ u.role }}</span></td>
                <td>{{ u.totalOrders }}</td>
                <td>₹{{ u.totalSpent | number }}</td>
                <td>{{ u.createdAt }}</td>
                <td>
                  <div class="role-change">
                    <select [(ngModel)]="roleChanges[u.id]" class="role-sel">
                      <option *ngFor="let r of roles" [value]="r">{{ r }}</option>
                    </select>
                    <button class="btn-apply" (click)="applyRole(u)" [disabled]="roleChanges[u.id] === u.role">Apply</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!loading && filtered.length === 0"><td colspan="8" class="empty-row">No users found</td></tr>
            </tbody>
          </table>
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
    .role-legend { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; }
    .rl-card { background: #fff; border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .rl-icon { font-size: 2rem; flex-shrink: 0; }
    .rl-title { font-size: 0.9rem; font-weight: 700; color: #1e2a38; }
    .rl-desc { font-size: 0.78rem; color: #888; margin-top: 0.15rem; }
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
    .user-row { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
    .email-cell { color: #888; font-size: 0.8rem; }
    .role-badge { padding: 0.2rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
    .role-admin { background: #fce4ec; color: #c62828; }
    .role-manager { background: #e3f2fd; color: #1976d2; }
    .role-customer { background: #f0edff; color: #6c63ff; }
    .role-change { display: flex; gap: 0.5rem; align-items: center; }
    .role-sel { padding: 0.35rem 0.6rem; border: 1.5px solid #e9ecef; border-radius: 8px; font-size: 0.8rem; outline: none; }
    .btn-apply { background: #6c63ff; color: #fff; border: none; border-radius: 8px; padding: 0.35rem 0.75rem; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.18s; white-space: nowrap; }
    .btn-apply:hover:not(:disabled) { background: #5a52d5; }
    .btn-apply:disabled { opacity: 0.4; cursor: not-allowed; }
    @media (max-width: 768px) { .role-legend { grid-template-columns: 1fr; } }
  `]
})
export class AdminUsersComponent implements OnInit {
  users: AdminCustomer[] = [];
  filtered: AdminCustomer[] = [];
  loading = true; search = ''; roleFilter = '';
  roles = ['Admin', 'Manager', 'Customer'];
  roleChanges: Record<number, string> = {};

  roleInfo = [
    { icon: '👑', role: 'Admin', desc: 'Full access to all features, user management, and system settings.' },
    { icon: '🔧', role: 'Manager', desc: 'Can manage products, categories, orders, and coupons.' },
    { icon: '🛒', role: 'Customer', desc: 'Can browse products, place orders, and view order history.' },
  ];

  constructor(private adminService: AdminService, private toasts: ToastService) {}

  ngOnInit() {
    this.loading = true;
    this.adminService.getCustomers().subscribe({
      next: u => {
        this.users = u;
        this.roleChanges = {};
        u.forEach(x => this.roleChanges[x.id] = x.role);
        this.applyFilter(); this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilter() {
    this.filtered = this.users.filter(u => {
      const matchSearch = !this.search || u.fullName.toLowerCase().includes(this.search.toLowerCase()) || u.email.toLowerCase().includes(this.search.toLowerCase());
      const matchRole = !this.roleFilter || u.role === this.roleFilter;
      return matchSearch && matchRole;
    });
  }

  applyRole(u: AdminCustomer) {
    const newRole = this.roleChanges[u.id];
    this.adminService.updateUserRole(u.id, newRole).subscribe({
      next: () => { u.role = newRole; this.toasts.success(`${u.fullName}'s role changed to ${newRole}`); },
      error: () => this.toasts.error('Failed to update role.')
    });
  }

  avatarColor(role: string) {
    const colors: Record<string, string> = { Admin: '#c62828', Manager: '#1976d2', Customer: '#6c63ff' };
    return colors[role] ?? '#888';
  }
}
