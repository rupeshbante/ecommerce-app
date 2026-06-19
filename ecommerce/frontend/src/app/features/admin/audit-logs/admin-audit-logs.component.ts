import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-audit-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <h1>Audit Logs</h1>
    </div>

    <div class="container">
      <div class="loading" *ngIf="loading">Loading...</div>

      <div class="logs-card" *ngIf="!loading">
        <div class="log-stats">
          <span>Total: {{ total }} entries</span>
          <button class="btn-refresh" (click)="loadLogs()">Refresh</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let log of logs">
              <td class="time">{{ log.createdAt | date:'dd MMM, HH:mm:ss' }}</td>
              <td>{{ log.userEmail }}</td>
              <td><span [class]="'action-badge action-' + log.action.toLowerCase()">{{ log.action }}</span></td>
              <td>{{ log.entity }}<span *ngIf="log.entityId" class="entity-id"> #{{ log.entityId }}</span></td>
              <td class="details">{{ log.newValues }}</td>
              <td class="ip">{{ log.ipAddress }}</td>
            </tr>
            <tr *ngIf="logs.length === 0"><td colspan="6" class="no-data">No audit logs found</td></tr>
          </tbody>
        </table>
        <div class="pagination" *ngIf="total > pageSize">
          <button [disabled]="page === 1" (click)="changePage(page - 1)">Previous</button>
          <span>Page {{ page }} of {{ Math.ceil(total / pageSize) }}</span>
          <button [disabled]="page >= Math.ceil(total / pageSize)" (click)="changePage(page + 1)">Next</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f7f8fc; min-height: 100vh; }
    .page-header { background: linear-gradient(135deg,#1a1a2e,#16213e); padding: 2rem; }
    .page-header h1 { font-size: 1.5rem; font-weight: 800; color: #fff; max-width: 1300px; margin: 0 auto; }
    .container { max-width: 1300px; margin: 0 auto; padding: 2rem; }
    .loading { color: #888; padding: 2rem 0; }
    .logs-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.06); }
    .log-stats { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: #f7f8fc; border-bottom: 1px solid #eee; font-size: 0.875rem; color: #555; }
    .btn-refresh { background: #6c63ff; color: #fff; border: none; border-radius: 8px; padding: 0.4rem 1rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f7f8fc; padding: 0.85rem 1rem; font-size: 0.75rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
    td { padding: 0.85rem 1rem; font-size: 0.82rem; color: #333; border-bottom: 1px solid #f5f5f5; }
    .time { color: #888; font-size: 0.78rem; white-space: nowrap; }
    .action-badge { font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 20px; }
    .action-update { background: #e3f2fd; color: #1565c0; }
    .action-create { background: #e8f5e9; color: #2e7d32; }
    .action-delete { background: #fce4ec; color: #c62828; }
    .action-rolechange { background: #fff8e1; color: #f39c12; }
    .action-login { background: #f3e5f5; color: #6a1b9a; }
    .entity-id { color: #888; font-size: 0.78rem; }
    .details { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #888; font-size: 0.78rem; }
    .ip { color: #aaa; font-size: 0.78rem; font-family: monospace; }
    .no-data { text-align: center; color: #aaa; padding: 2rem; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem; font-size: 0.875rem; color: #555; }
    .pagination button { background: #6c63ff; color: #fff; border: none; border-radius: 8px; padding: 0.4rem 1rem; cursor: pointer; font-size: 0.82rem; }
    .pagination button:disabled { background: #ccc; cursor: not-allowed; }
  `]
})
export class AdminAuditLogsComponent implements OnInit {
  logs: any[] = [];
  loading = true;
  total = 0;
  page = 1;
  pageSize = 50;
  Math = Math;

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.loadLogs(); }

  loadLogs() {
    this.loading = true;
    this.adminService.getAuditLogs(this.page, this.pageSize).subscribe({
      next: (res: any) => { this.logs = res.data; this.total = res.total; this.loading = false; },
      error: () => this.loading = false
    });
  }

  changePage(p: number) { this.page = p; this.loadLogs(); }
}
