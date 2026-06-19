import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'products', loadComponent: () => import('./products/admin-products.component').then(m => m.AdminProductsComponent) },
      { path: 'categories', loadComponent: () => import('./categories/admin-categories.component').then(m => m.AdminCategoriesComponent) },
      { path: 'orders', loadComponent: () => import('./orders/admin-orders.component').then(m => m.AdminOrdersComponent) },
      { path: 'customers', loadComponent: () => import('./customers/admin-customers.component').then(m => m.AdminCustomersComponent) },
      { path: 'coupons', loadComponent: () => import('./coupons/admin-coupons.component').then(m => m.AdminCouponsComponent) },
      { path: 'reports', loadComponent: () => import('./reports/admin-reports.component').then(m => m.AdminReportsComponent) },
      { path: 'users', loadComponent: () => import('./users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'returns', loadComponent: () => import('./returns/admin-returns.component').then(m => m.AdminReturnsComponent) },
      { path: 'audit-logs', loadComponent: () => import('./audit-logs/admin-audit-logs.component').then(m => m.AdminAuditLogsComponent) },
    ]
  }
];
