import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell" [class.collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo" *ngIf="!sidebarCollapsed()">
            <span class="logo-icon">⚙️</span>
            <span class="logo-text">ShopEase Admin</span>
          </div>
          <span *ngIf="sidebarCollapsed()" class="logo-mini">⚙️</span>
          <button class="collapse-btn" (click)="toggleSidebar()" title="Toggle sidebar">
            {{ sidebarCollapsed() ? '▶' : '◀' }}
          </button>
        </div>

        <nav class="nav-menu">
          <div class="nav-section-label" *ngIf="!sidebarCollapsed()">MAIN</div>
          <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="active"
             class="nav-item" [title]="item.label">
            <span class="nav-icon">{{ item.icon }}</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">{{ item.label }}</span>
          </a>
          <div class="nav-divider"></div>
          <div class="nav-section-label" *ngIf="!sidebarCollapsed()">ACCOUNT</div>
          <a routerLink="/" class="nav-item" title="Back to Store">
            <span class="nav-icon">🏪</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Back to Store</span>
          </a>
          <button class="nav-item logout-btn" (click)="auth.logout()" title="Logout">
            <span class="nav-icon">🚪</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed()">Logout</span>
          </button>
        </nav>

        <div class="sidebar-footer" *ngIf="!sidebarCollapsed()">
          <div class="admin-badge">
            <div class="admin-avatar">{{ auth.currentUser()?.fullName?.charAt(0)?.toUpperCase() }}</div>
            <div>
              <div class="admin-name">{{ auth.currentUser()?.fullName }}</div>
              <div class="admin-role">{{ auth.currentUser()?.role }}</div>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main content -->
      <div class="main-area">
        <header class="topbar">
          <button class="mobile-toggle" (click)="toggleSidebar()">☰</button>
          <div class="topbar-right">
            <span class="topbar-time">{{ now | date:'EEE, d MMM yyyy, h:mm a' }}</span>
            <a routerLink="/" class="store-link">🏪 View Store</a>
          </div>
        </header>
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .admin-shell { display: flex; min-height: 100vh; background: #f0f2f5; }

    /* Sidebar */
    .sidebar {
      width: 240px; background: #1e2a38; color: #fff; display: flex; flex-direction: column;
      position: sticky; top: 0; height: 100vh; transition: width 0.25s ease; flex-shrink: 0; z-index: 200;
    }
    .admin-shell.collapsed .sidebar { width: 64px; }
    .sidebar-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.08); min-height: 68px;
    }
    .logo { display: flex; align-items: center; gap: 0.6rem; overflow: hidden; }
    .logo-icon { font-size: 1.3rem; flex-shrink: 0; }
    .logo-text { font-size: 0.95rem; font-weight: 800; color: #a29bfe; white-space: nowrap; }
    .logo-mini { font-size: 1.4rem; }
    .collapse-btn {
      background: rgba(255,255,255,0.08); border: none; color: rgba(255,255,255,0.5);
      width: 28px; height: 28px; border-radius: 8px; cursor: pointer; font-size: 0.7rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s;
    }
    .collapse-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

    .nav-menu { flex: 1; padding: 1rem 0.6rem; display: flex; flex-direction: column; gap: 0.2rem; overflow-y: auto; }
    .nav-section-label { font-size: 0.65rem; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; padding: 0.5rem 0.6rem 0.25rem; margin-top: 0.25rem; }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 0.8rem;
      border-radius: 10px; text-decoration: none; color: rgba(255,255,255,0.65);
      font-size: 0.875rem; font-weight: 500; transition: all 0.18s; cursor: pointer;
      background: none; border: none; width: 100%; text-align: left;
    }
    .nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
    .nav-item.active { background: rgba(108,99,255,0.3); color: #a29bfe; font-weight: 600; }
    .nav-icon { font-size: 1.1rem; flex-shrink: 0; width: 20px; text-align: center; }
    .nav-label { white-space: nowrap; overflow: hidden; }
    .nav-divider { border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 0.5rem 0; }
    .logout-btn { color: rgba(255,100,100,0.7); }
    .logout-btn:hover { background: rgba(255,100,100,0.1); color: #ff6b6b; }

    .sidebar-footer { padding: 0.85rem 1rem; border-top: 1px solid rgba(255,255,255,0.08); }
    .admin-badge { display: flex; align-items: center; gap: 0.75rem; }
    .admin-avatar { width: 34px; height: 34px; background: #6c63ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
    .admin-name { font-size: 0.82rem; font-weight: 600; color: #fff; }
    .admin-role { font-size: 0.72rem; color: rgba(255,255,255,0.4); }

    /* Main area */
    .main-area { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
    .topbar {
      background: #fff; border-bottom: 1px solid #e9ecef;
      padding: 0 1.5rem; height: 60px; display: flex; align-items: center; justify-content: space-between;
      position: sticky; top: 0; z-index: 100; box-shadow: 0 1px 8px rgba(0,0,0,0.06);
    }
    .mobile-toggle { display: none; background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666; }
    .topbar-right { display: flex; align-items: center; gap: 1.5rem; }
    .topbar-time { font-size: 0.82rem; color: #888; }
    .store-link { color: #6c63ff; text-decoration: none; font-size: 0.85rem; font-weight: 600; background: #f5f3ff; padding: 0.4rem 0.9rem; border-radius: 20px; transition: background 0.18s; }
    .store-link:hover { background: #ebe7ff; }
    .page-content { flex: 1; padding: 1.75rem; overflow-y: auto; }

    @media (max-width: 768px) {
      .mobile-toggle { display: block; }
      .sidebar { position: fixed; left: 0; top: 0; transform: translateX(-100%); transition: transform 0.25s ease, width 0.25s ease; }
      .admin-shell:not(.collapsed) .sidebar { transform: translateX(0); }
    }
  `]
})
export class AdminLayoutComponent {
  sidebarCollapsed = signal(false);
  now = new Date();

  navItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/products', icon: '📦', label: 'Products' },
    { path: '/admin/categories', icon: '🗂️', label: 'Categories' },
    { path: '/admin/orders', icon: '🛒', label: 'Orders' },
    { path: '/admin/returns', icon: '↩️', label: 'Returns' },
    { path: '/admin/customers', icon: '👥', label: 'Customers' },
    { path: '/admin/coupons', icon: '🎟️', label: 'Coupons' },
    { path: '/admin/reports', icon: '📈', label: 'Reports' },
    { path: '/admin/users', icon: '🔐', label: 'Users & Roles' },
    { path: '/admin/audit-logs', icon: '📋', label: 'Audit Logs' },
  ];

  constructor(public auth: AuthService) {
    setInterval(() => this.now = new Date(), 30000);
  }

  toggleSidebar() { this.sidebarCollapsed.update(v => !v); }
}
