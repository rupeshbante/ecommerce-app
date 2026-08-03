import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { DashboardStats } from '../../../core/models/admin.models';
import { TrendChartComponent } from '../../../shared/charts/trend-chart.component';
import { StatusBreakdownBarComponent } from '../../../shared/charts/status-breakdown-bar.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TrendChartComponent, StatusBreakdownBarComponent],
  template: `
    <div class="dash-wrap">
      <div class="page-title">
        <h1>Dashboard</h1>
        <p>Welcome back, {{ greeting }}! Here's what's happening today.</p>
      </div>

      <!-- Stat cards -->
      <div class="stats-grid" *ngIf="stats">
        <div class="stat-card blue">
          <div class="stat-icon">📦</div>
          <div class="stat-body">
            <div class="stat-num">{{ stats.totalOrders }}</div>
            <div class="stat-label">Total Orders</div>
            <div class="stat-sub">{{ stats.pendingOrders }} pending</div>
          </div>
        </div>
        <div class="stat-card green">
          <div class="stat-icon">💰</div>
          <div class="stat-body">
            <div class="stat-num">₹{{ stats.totalSales | number:'1.0-0' }}</div>
            <div class="stat-label">Total Revenue</div>
            <div class="stat-sub">₹{{ stats.salesThisMonth | number:'1.0-0' }} this month</div>
          </div>
        </div>
        <div class="stat-card purple">
          <div class="stat-icon">👥</div>
          <div class="stat-body">
            <div class="stat-num">{{ stats.totalCustomers }}</div>
            <div class="stat-label">Customers</div>
            <div class="stat-sub">Registered users</div>
          </div>
        </div>
        <div class="stat-card orange">
          <div class="stat-icon">🛍️</div>
          <div class="stat-body">
            <div class="stat-num">{{ stats.totalProducts }}</div>
            <div class="stat-label">Products</div>
            <div class="stat-sub [class.warn]="stats.lowStockProducts > 0">{{ stats.lowStockProducts }} low stock</div>
          </div>
        </div>
        <div class="stat-card teal">
          <div class="stat-icon">📅</div>
          <div class="stat-body">
            <div class="stat-num">₹{{ stats.salesToday | number:'1.0-0' }}</div>
            <div class="stat-label">Today's Sales</div>
            <div class="stat-sub">{{ today }}</div>
          </div>
        </div>
        <div class="stat-card red">
          <div class="stat-icon">⚠️</div>
          <div class="stat-body">
            <div class="stat-num">{{ stats.lowStockProducts }}</div>
            <div class="stat-label">Low Stock Items</div>
            <div class="stat-sub">≤10 units remaining</div>
          </div>
        </div>
      </div>

      <!-- Skeleton -->
      <div class="stats-grid" *ngIf="!stats && loading">
        <div class="stat-card sk" *ngFor="let i of [1,2,3,4,5,6]"><div class="sk-inner"></div></div>
      </div>

      <div class="main-grid" *ngIf="stats">
        <!-- Revenue chart -->
        <div class="chart-card">
          <div class="card-head">
            <h3>Revenue — Last 7 Days</h3>
            <a routerLink="/admin/reports" class="view-all">Full Report →</a>
          </div>
          <app-trend-chart [data]="stats.revenueByDay" ariaLabel="Revenue over the last 7 days"></app-trend-chart>
        </div>

        <!-- Top products -->
        <div class="top-card">
          <div class="card-head">
            <h3>Top Products</h3>
            <a routerLink="/admin/reports" class="view-all">View all →</a>
          </div>
          <div *ngFor="let p of stats.topProducts; let i = index" class="top-row">
            <div class="rank">{{ i + 1 }}</div>
            <div class="top-info">
              <div class="top-name">{{ p.name }}</div>
              <div class="top-cat">{{ p.category }}</div>
            </div>
            <div class="top-stats">
              <div class="top-rev">₹{{ p.revenue | number:'1.0-0' }}</div>
              <div class="top-sold">{{ p.totalSold }} sold</div>
            </div>
          </div>
          <div *ngIf="stats.topProducts.length === 0" class="empty-msg">No sales data yet</div>
        </div>
      </div>

      <!-- Order status breakdown -->
      <div class="chart-card" *ngIf="stats">
        <div class="card-head">
          <h3>Orders by Status</h3>
        </div>
        <app-status-breakdown-bar [data]="stats.ordersByStatus"></app-status-breakdown-bar>
      </div>

      <!-- Recent orders -->
      <div class="recent-card" *ngIf="stats">
        <div class="card-head">
          <h3>Recent Orders</h3>
          <a routerLink="/admin/orders" class="view-all">View all →</a>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th><th>Customer</th><th>Email</th>
                <th>Items</th><th>Amount</th><th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let o of stats.recentOrders">
                <td><strong>#{{ o.id }}</strong></td>
                <td>{{ o.customerName }}</td>
                <td class="email-cell">{{ o.customerEmail }}</td>
                <td>{{ o.itemCount }}</td>
                <td><strong>₹{{ o.totalAmount | number }}</strong></td>
                <td><span [class]="'badge badge-' + o.status.toLowerCase()">{{ o.status }}</span></td>
                <td>{{ o.orderDate }}</td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="stats.recentOrders.length === 0" class="empty-msg">No orders yet</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .dash-wrap { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-title h1 { font-size: 1.6rem; font-weight: 800; color: #1e2a38; }
    .page-title p { font-size: 0.875rem; color: #888; margin-top: 0.25rem; }

    /* Stat cards */
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
    .stat-card { background: #fff; border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border-left: 4px solid #ddd; transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-card.blue { border-left-color: #0984e3; }
    .stat-card.green { border-left-color: #00b894; }
    .stat-card.purple { border-left-color: #6c63ff; }
    .stat-card.orange { border-left-color: #e17055; }
    .stat-card.teal { border-left-color: #00cec9; }
    .stat-card.red { border-left-color: #d63031; }
    .stat-icon { font-size: 2rem; flex-shrink: 0; }
    .stat-num { font-size: 1.6rem; font-weight: 800; color: #1e2a38; line-height: 1; }
    .stat-label { font-size: 0.82rem; color: #888; margin-top: 0.2rem; }
    .stat-sub { font-size: 0.75rem; color: #aaa; margin-top: 0.15rem; }
    .stat-card.sk { border-left-color: #eee; }
    .sk-inner { height: 60px; background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
    @keyframes shimmer { to { background-position: -400% 0; } }

    /* Main grid */
    .main-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }

    /* Charts */
    .chart-card, .top-card, .recent-card {
      background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .card-head h3 { font-size: 1rem; font-weight: 700; color: #1e2a38; }
    .view-all { font-size: 0.82rem; color: #6c63ff; text-decoration: none; font-weight: 600; }
    .view-all:hover { text-decoration: underline; }

    /* Top products */
    .top-row { display: flex; align-items: center; gap: 0.85rem; padding: 0.7rem 0; border-bottom: 1px solid #f5f5f5; }
    .top-row:last-child { border-bottom: none; }
    .rank { width: 24px; height: 24px; background: #f5f3ff; color: #6c63ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .top-info { flex: 1; min-width: 0; }
    .top-name { font-size: 0.875rem; font-weight: 600; color: #1e2a38; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .top-cat { font-size: 0.72rem; color: #888; }
    .top-stats { text-align: right; }
    .top-rev { font-size: 0.875rem; font-weight: 700; color: #1e2a38; }
    .top-sold { font-size: 0.72rem; color: #888; }

    /* Table */
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.5rem 0.75rem; border-bottom: 2px solid #f0f0f0; white-space: nowrap; }
    .data-table td { padding: 0.75rem; font-size: 0.875rem; color: #333; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f9f9ff; }
    .email-cell { color: #888; font-size: 0.8rem; }
    .badge { padding: 0.25rem 0.65rem; border-radius: 20px; font-size: 0.72rem; font-weight: 700; }
    .badge-pending { background: #fff8e1; color: #f39c12; }
    .badge-delivered { background: #e8f5e9; color: #2e7d32; }
    .badge-cancelled { background: #fce4ec; color: #c62828; }
    .badge-processing { background: #e3f2fd; color: #1976d2; }
    .empty-msg { text-align: center; color: #888; padding: 2rem; font-size: 0.875rem; }

    @media (max-width: 1100px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .main-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .stats-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  get greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getDashboard().subscribe({
      next: s => { this.stats = s; this.loading = false; },
      error: () => this.loading = false
    });
  }
}
