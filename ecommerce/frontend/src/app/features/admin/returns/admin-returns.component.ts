import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Return Requests</h1>
    </div>

    <div class="container">
      <!-- Filter -->
      <div class="filter-row">
        <select [(ngModel)]="filterStatus" (change)="loadReturns()">
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div class="loading" *ngIf="loading">Loading...</div>

      <div class="returns-table" *ngIf="!loading">
        <table>
          <thead>
            <tr>
              <th>Return #</th>
              <th>Order #</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of returns">
              <td>#{{ r.id }}</td>
              <td>#{{ r.orderId }}</td>
              <td>{{ r.reason }}</td>
              <td><span [class]="'badge status-' + r.status.toLowerCase()">{{ r.status }}</span></td>
              <td>{{ r.requestedAt | date:'dd MMM yyyy' }}</td>
              <td>
                <button *ngIf="r.status === 'Pending'" class="btn-approve" (click)="updateStatus(r, 'Approved')">Approve</button>
                <button *ngIf="r.status === 'Pending'" class="btn-reject" (click)="updateStatus(r, 'Rejected')">Reject</button>
                <button *ngIf="r.status === 'Approved'" class="btn-complete" (click)="updateStatus(r, 'Completed')">Complete</button>
              </td>
            </tr>
            <tr *ngIf="returns.length === 0">
              <td colspan="6" class="no-data">No return requests found</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f7f8fc; min-height: 100vh; }
    .page-header { background: linear-gradient(135deg,#1a1a2e,#16213e); padding: 2rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 800; color: #fff; max-width: 1300px; margin: 0 auto; }
    .container { max-width: 1300px; margin: 0 auto; padding: 2rem; }
    .filter-row { margin-bottom: 1.5rem; }
    .filter-row select { border: 1.5px solid #e9ecef; border-radius: 10px; padding: 0.6rem 1rem; font-size: 0.875rem; outline: none; background: #fff; }
    .loading { color: #888; padding: 2rem 0; }
    .returns-table { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.06); }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f7f8fc; padding: 1rem 1.25rem; font-size: 0.78rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
    td { padding: 1rem 1.25rem; font-size: 0.875rem; color: #333; border-bottom: 1px solid #f5f5f5; }
    .badge { padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .status-pending { background: #fff8e1; color: #f39c12; }
    .status-approved { background: #e8f5e9; color: #2e7d32; }
    .status-rejected { background: #fce4ec; color: #c62828; }
    .status-completed { background: #e3f2fd; color: #1565c0; }
    .btn-approve, .btn-reject, .btn-complete { font-size: 0.8rem; font-weight: 600; border: none; border-radius: 8px; padding: 0.4rem 0.9rem; cursor: pointer; margin-right: 0.35rem; }
    .btn-approve { background: #e8f5e9; color: #2e7d32; }
    .btn-reject { background: #fce4ec; color: #c62828; }
    .btn-complete { background: #e3f2fd; color: #1565c0; }
    .no-data { text-align: center; color: #aaa; padding: 2rem; }
  `]
})
export class AdminReturnsComponent implements OnInit {
  returns: any[] = [];
  loading = true;
  filterStatus = '';

  constructor(private adminService: AdminService, private toasts: ToastService) {}

  ngOnInit() { this.loadReturns(); }

  loadReturns() {
    this.loading = true;
    this.adminService.getReturns(this.filterStatus).subscribe({
      next: r => { this.returns = r; this.loading = false; },
      error: () => this.loading = false
    });
  }

  updateStatus(r: any, status: string) {
    const note = status === 'Rejected' ? prompt('Reason for rejection (optional):') ?? '' : '';
    this.adminService.updateReturnStatus(r.id, status, note).subscribe(() => {
      r.status = status;
      this.toasts.success(`Return #${r.id} ${status}`);
    });
  }
}
