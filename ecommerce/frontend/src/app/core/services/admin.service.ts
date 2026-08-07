import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DashboardStats, AdminOrderSummary, AdminOrderDetail, AdminCustomer, CategoryItem, Coupon, SalesReport, AdminProduct, PagedResult } from '../models/admin.models';
import { Product, CreateProduct } from '../models/product.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  // Dashboard
  getDashboard() { return this.http.get<DashboardStats>(`${this.api}/admin/dashboard`); }
  getReport(days = 30) { return this.http.get<SalesReport>(`${this.api}/admin/report?days=${days}`); }

  // Orders
  getOrders(status?: string, page = 1, pageSize = 20, search?: string) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    if (search) params = params.set('search', search);
    return this.http.get<PagedResult<AdminOrderSummary>>(`${this.api}/admin/orders`, { params });
  }
  getOrder(id: number) { return this.http.get<AdminOrderDetail>(`${this.api}/admin/orders/${id}`); }
  updateOrderStatus(id: number, status: string, trackingNumber?: string, carrier?: string) {
    return this.http.put(`${this.api}/admin/orders/${id}/status`, { status, trackingNumber, carrier });
  }

  // Customers
  getCustomers(page = 1, pageSize = 20, search?: string, role?: string) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (role) params = params.set('role', role);
    return this.http.get<PagedResult<AdminCustomer>>(`${this.api}/admin/customers`, { params });
  }
  getCustomer(id: number) { return this.http.get<AdminCustomer>(`${this.api}/admin/customers/${id}`); }
  getCustomerOrders(id: number) { return this.http.get<AdminOrderSummary[]>(`${this.api}/admin/customers/${id}/orders`); }

  // Users
  updateUserRole(id: number, role: string) { return this.http.put(`${this.api}/admin/users/${id}/role`, { role }); }

  // Products
  getAllProducts() { return this.http.get<Product[]>(`${this.api}/products`); }
  getAdminProducts(page = 1, pageSize = 20, search?: string, category?: string, isActive?: boolean) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);
    if (isActive !== undefined) params = params.set('isActive', isActive);
    return this.http.get<PagedResult<Product>>(`${this.api}/admin/products`, { params });
  }
  createProduct(data: CreateProduct) { return this.http.post<Product>(`${this.api}/products`, data); }
  updateProduct(id: number, data: Partial<Product>) { return this.http.put<Product>(`${this.api}/products/${id}`, data); }
  deleteProduct(id: number) { return this.http.delete(`${this.api}/products/${id}`); }
  uploadImage(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ url: string }>(`${this.api}/admin/upload-image`, form);
  }
  getLowStockSummary() { return this.http.get<any[]>(`${this.api}/admin/low-stock-summary`); }

  // Product Images
  getProductImages(productId: number) { return this.http.get<any[]>(`${this.api}/products/${productId}/images`); }
  addProductImage(productId: number, data: { url: string; isPrimary: boolean; sortOrder: number }) {
    return this.http.post<any>(`${this.api}/products/${productId}/images`, data);
  }
  deleteProductImage(productId: number, imageId: number) {
    return this.http.delete(`${this.api}/products/${productId}/images/${imageId}`);
  }

  // Product Variants
  getProductVariants(productId: number) { return this.http.get<any[]>(`${this.api}/products/${productId}/variants`); }
  addProductVariant(productId: number, data: { name: string; value: string; priceModifier: number; stock: number; sku: string }) {
    return this.http.post<any>(`${this.api}/products/${productId}/variants`, data);
  }
  updateProductVariant(productId: number, variantId: number, data: { name: string; value: string; priceModifier: number; stock: number; sku: string; isActive: boolean }) {
    return this.http.put<any>(`${this.api}/products/${productId}/variants/${variantId}`, data);
  }
  deleteProductVariant(productId: number, variantId: number) {
    return this.http.delete(`${this.api}/products/${productId}/variants/${variantId}`);
  }

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
  getCoupons(page = 1, pageSize = 20) {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<PagedResult<Coupon>>(`${this.api}/coupons`, { params });
  }
  createCoupon(data: any) { return this.http.post<Coupon>(`${this.api}/coupons`, data); }
  updateCoupon(id: number, data: any) { return this.http.put<Coupon>(`${this.api}/coupons/${id}`, data); }
  deleteCoupon(id: number) { return this.http.delete(`${this.api}/coupons/${id}`); }

  // Returns
  getReturns(status?: string, page = 1, pageSize = 20) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<any>>(`${this.api}/admin/returns`, { params });
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
