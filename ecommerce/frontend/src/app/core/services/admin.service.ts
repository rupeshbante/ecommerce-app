import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DashboardStats, AdminOrderSummary, AdminOrderDetail, AdminCustomer, CategoryItem, Coupon, SalesReport, AdminProduct } from '../models/admin.models';
import { Product, CreateProduct } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard() { return this.http.get<DashboardStats>(`${this.api}/admin/dashboard`); }
  getReport(days = 30) { return this.http.get<SalesReport>(`${this.api}/admin/report?days=${days}`); }

  // Orders
  getOrders(status?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<AdminOrderSummary[]>(`${this.api}/admin/orders`, { params });
  }
  getOrder(id: number) { return this.http.get<AdminOrderDetail>(`${this.api}/admin/orders/${id}`); }
  updateOrderStatus(id: number, status: string) { return this.http.put(`${this.api}/admin/orders/${id}/status`, { status }); }

  // Customers
  getCustomers() { return this.http.get<AdminCustomer[]>(`${this.api}/admin/customers`); }
  getCustomer(id: number) { return this.http.get<AdminCustomer>(`${this.api}/admin/customers/${id}`); }
  getCustomerOrders(id: number) { return this.http.get<AdminOrderSummary[]>(`${this.api}/admin/customers/${id}/orders`); }

  // Users
  updateUserRole(id: number, role: string) { return this.http.put(`${this.api}/admin/users/${id}/role`, { role }); }

  // Products
  getAllProducts() { return this.http.get<Product[]>(`${this.api}/products`); }
  createProduct(data: CreateProduct) { return this.http.post<Product>(`${this.api}/products`, data); }
  updateProduct(id: number, data: Partial<Product>) { return this.http.put<Product>(`${this.api}/products/${id}`, data); }
  deleteProduct(id: number) { return this.http.delete(`${this.api}/products/${id}`); }
  uploadImage(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${this.api}/admin/upload-image`, form);
  }
  getLowStockSummary() { return this.http.get<any[]>(`${this.api}/admin/low-stock-summary`); }

  // Bulk CSV Import
  bulkImportProducts(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ message: string }>(`${this.api}/products/bulk-import`, form);
  }
  downloadCsvTemplate() { return this.http.get(`${this.api}/products/bulk-import/template`, { responseType: 'blob' }); }

  // Categories
  getCategories() { return this.http.get<CategoryItem[]>(`${this.api}/categories`); }
  createCategory(data: any) { return this.http.post<CategoryItem>(`${this.api}/categories`, data); }
  updateCategory(id: number, data: any) { return this.http.put<CategoryItem>(`${this.api}/categories/${id}`, data); }
  deleteCategory(id: number) { return this.http.delete(`${this.api}/categories/${id}`); }

  // Coupons
  getCoupons() { return this.http.get<Coupon[]>(`${this.api}/coupons`); }
  createCoupon(data: any) { return this.http.post<Coupon>(`${this.api}/coupons`, data); }
  updateCoupon(id: number, data: any) { return this.http.put<Coupon>(`${this.api}/coupons/${id}`, data); }
  deleteCoupon(id: number) { return this.http.delete(`${this.api}/coupons/${id}`); }

  // Returns
  getReturns(status?: string) {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<any[]>(`${this.api}/admin/returns`, { params });
  }
  updateReturnStatus(id: number, status: string, adminNote = '') {
    return this.http.put(`${this.api}/admin/returns/${id}/status`, { status, adminNote });
  }

  // Audit Logs
  getAuditLogs(page = 1, pageSize = 50) {
    return this.http.get(`${this.api}/admin/audit-logs?page=${page}&pageSize=${pageSize}`);
  }

  // Export
  exportSalesCsv(days = 30) {
    return this.http.get(`${this.api}/admin/export/sales-csv?days=${days}`, { responseType: 'blob' });
  }
  exportProductsCsv() {
    return this.http.get(`${this.api}/admin/export/products-csv`, { responseType: 'blob' });
  }
}
