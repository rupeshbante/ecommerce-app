import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { SalesReport } from '../../../core/models/admin.models';
import { TrendChartComponent } from '../../../shared/charts/trend-chart.component';
import { StatusBreakdownBarComponent } from '../../../shared/charts/status-breakdown-bar.component';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TrendChartComponent, StatusBreakdownBarComponent],
  template: `
    <div class="page-wrap">
      <div class="page-head">
        <div><h1>Reports & Analytics</h1><p>Sales performance, product insights, customer data</p></div>
        <div class="range-selector">
          <select [(ngModel)]="days" (ngModelChange)="load()">
            <option [value]="7">Last 7 days</option>
            <option [value]="30">Last 30 days</option>
            <option [value]="90">Last 90 days</option>
            <option [value]="365">Last year</option>
          </select>
          <button class="btn-export" (click)="exportSalesCsv()">⬇️ Export Sales CSV</button>
          <button class="btn-export btn-products" (click)="exportProductsCsv()">⬇️ Export Products CSV</button>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">Loading report data...</div>

      <ng-container *ngIf="report && !loading">
        <!-- Summary cards -->
        <div class="summary-grid">
          <div class="sum-card blue"><div class="sc-icon">💰</div><div><div class="sc-num">₹{{ report.totalRevenue | number:'1.0-0' }}</div><div class="sc-label">Total Revenue</div></div></div>
          <div class="sum-card green"><div class="sc-icon">📦</div><div><div class="sc-num">{{ report.totalOrders }}</div><div class="sc-label">Total Orders</div></div></div>
          <div class="sum-card purple"><div class="sc-icon">👥</div><div><div class="sc-num">{{ report.totalCustomers }}</div><div class="sc-label">Customers</div></div></div>
          <div class="sum-card orange"><div class="sc-icon">🛍️</div><div><div class="sc-num">{{ report.totalProducts }}</div><div class="sc-label">Active Products</div></div></div>
          <div class="sum-card teal"><div class="sc-icon">🧾</div><div><div class="sc-num">₹{{ avgOrder | number:'1.0-0' }}</div><div class="sc-label">Avg Order Value</div></div></div>
        </div>

        <!-- Daily revenue chart -->
        <div class="chart-card">
          <h3>Daily Revenue ({{ days }} days)</h3>
          <app-trend-chart [data]="report.dailyRevenue" ariaLabel="Daily revenue trend"></app-trend-chart>
        </div>

        <!-- Monthly revenue chart (only meaningful once a range spans more than one month) -->
        <div class="chart-card" *ngIf="report.monthlyRevenue.length > 1">
          <h3>Monthly Revenue</h3>
          <app-trend-chart [data]="report.monthlyRevenue" ariaLabel="Monthly revenue trend"></app-trend-chart>
        </div>

        <!-- Order status breakdown -->
        <div class="chart-card">
          <h3>Orders by Status</h3>
          <app-status-breakdown-bar [data]="report.ordersByStatus"></app-status-breakdown-bar>
        </div>

        <div class="two-col">
          <!-- Top products -->
          <div class="data-card">
            <h3>Top Products by Revenue</h3>
            <div *ngFor="let p of report.topProducts; let i = index" class="top-row">
              <div class="rank">{{ i + 1 }}</div>
              <div class="top-info"><div class="top-name">{{ p.name }}</div><div class="top-cat">{{ p.category }}</div></div>
              <div class="top-stats"><div class="top-rev">₹{{ p.revenue | number:'1.0-0' }}</div><div class="top-sold">{{ p.totalSold }} sold</div></div>
              <div class="bar-mini">
                <div class="bar-mini-fill" [style.width.%]="(p.revenue / report.topProducts[0].revenue) * 100"></div>
              </div>
            </div>
            <div *ngIf="report.topProducts.length === 0" class="empty-msg">No sales data</div>
          </div>

          <!-- Category revenue -->
          <div class="data-card">
            <h3>Revenue by Category</h3>
            <div *ngFor="let c of report.categoryRevenue" class="cat-rev-row">
              <div class="cr-info">
                <div class="cr-name">{{ c.category }}</div>
                <div class="cr-orders">{{ c.orders }} orders</div>
              </div>
              <div class="cr-bar-wrap">
                <div class="cr-bar">
                  <div class="cr-bar-fill" [style.width.%]="catBarWidth(c.revenue)"></div>
                </div>
              </div>
              <div class="cr-rev">₹{{ c.revenue | number:'1.0-0' }}</div>
            </div>
            <div *ngIf="report.categoryRevenue.length === 0" class="empty-msg">No data</div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-wrap { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .page-head h1 { font-size: 1.5rem; font-weight: 800; color: #1e2a38; }
    .page-head p { font-size: 0.85rem; color: #888; }
    .range-selector { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .range-selector select { padding: 0.6rem 0.85rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; background: #fff; cursor: pointer; }
    .btn-export { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.6rem 1rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
    .btn-export:hover { background: #5a52d5; }
    .btn-export.btn-products { background: #00b894; }
    .btn-export.btn-products:hover { background: #00a38a; }
    .loading-state { text-align: center; padding: 4rem; color: #888; }

    .summary-grid { display: grid; grid-template-columns: repeat(5,1fr); gap: 1rem; }
    .sum-card { background: #fff; border-radius: 14px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); border-left: 4px solid #ddd; }
    .sum-card.blue { border-left-color: #0984e3; }
    .sum-card.green { border-left-color: #00b894; }
    .sum-card.purple { border-left-color: #6c63ff; }
    .sum-card.orange { border-left-color: #e17055; }
    .sum-card.teal { border-left-color: #00cec9; }
    .sc-icon { font-size: 1.6rem; flex-shrink: 0; }
    .sc-num { font-size: 1.35rem; font-weight: 800; color: #1e2a38; }
    .sc-label { font-size: 0.75rem; color: #888; }

    .chart-card, .data-card { background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .chart-card h3, .data-card h3 { font-size: 1rem; font-weight: 700; color: #1e2a38; margin-bottom: 1.25rem; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

    .top-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0; border-bottom: 1px solid #f5f5f5; flex-wrap: wrap; }
    .top-row:last-child { border-bottom: none; }
    .rank { width: 22px; height: 22px; background: #f5f3ff; color: #6c63ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 700; flex-shrink: 0; }
    .top-info { flex: 1; min-width: 0; }
    .top-name { font-size: 0.85rem; font-weight: 600; color: #1e2a38; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .top-cat { font-size: 0.72rem; color: #888; }
    .top-stats { text-align: right; flex-shrink: 0; }
    .top-rev { font-size: 0.85rem; font-weight: 700; color: #1e2a38; }
    .top-sold { font-size: 0.7rem; color: #888; }
    .bar-mini { width: 100%; background: #f0f2f5; border-radius: 3px; height: 4px; margin-top: 0.3rem; grid-column: 1/-1; }
    .bar-mini-fill { height: 100%; background: #2a78d6; border-radius: 3px; }

    .cat-rev-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0; border-bottom: 1px solid #f5f5f5; }
    .cat-rev-row:last-child { border-bottom: none; }
    .cr-info { width: 100px; flex-shrink: 0; }
    .cr-name { font-size: 0.85rem; font-weight: 600; color: #1e2a38; }
    .cr-orders { font-size: 0.72rem; color: #888; }
    .cr-bar-wrap { flex: 1; }
    .cr-bar { background: #f0f2f5; border-radius: 4px; height: 8px; }
    .cr-bar-fill { height: 100%; background: #2a78d6; border-radius: 4px; transition: width 0.5s ease; }
    .cr-rev { font-size: 0.82rem; font-weight: 700; color: #1e2a38; width: 90px; text-align: right; flex-shrink: 0; }
    .empty-msg { text-align: center; color: #888; padding: 2rem; font-size: 0.85rem; }

    @media (max-width: 1100px) { .summary-grid { grid-template-columns: repeat(3,1fr); } }
    @media (max-width: 900px) { .two-col { grid-template-columns: 1fr; } }
    @media (max-width: 640px) { .summary-grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class AdminReportsComponent implements OnInit {
  report: SalesReport | null = null;
  loading = true;
  days = 30;

  get avgOrder() { return this.report && this.report.totalOrders > 0 ? this.report.totalRevenue / this.report.totalOrders : 0; }

  constructor(private adminService: AdminService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.adminService.getReport(this.days).subscribe({ next: r => { this.report = r; this.loading = false; }, error: () => this.loading = false });
  }

  exportSalesCsv() {
    this.adminService.exportSalesCsv(this.days).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `sales_report_${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    });
  }

  exportProductsCsv() {
    this.adminService.exportProductsCsv().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `products_${new Date().toISOString().slice(0,10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    });
  }

  catBarWidth(rev: number) {
    if (!this.report || this.report.categoryRevenue.length === 0) return 0;
    const max = Math.max(...this.report.categoryRevenue.map(c => c.revenue), 1);
    return (rev / max) * 100;
  }
}
