import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product, CreateProduct, ProductVariant, ProductImage } from '../models/product.models';

export interface ProductFilter {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API = `${environment.apiUrl}/products`;
  constructor(private http: HttpClient) {}

  getAll(filter: ProductFilter = {}) {
    let params = new HttpParams();
    if (filter.category) params = params.set('category', filter.category);
    if (filter.search) params = params.set('search', filter.search);
    if (filter.minPrice != null) params = params.set('minPrice', filter.minPrice.toString());
    if (filter.maxPrice != null) params = params.set('maxPrice', filter.maxPrice.toString());
    if (filter.minRating != null) params = params.set('minRating', filter.minRating.toString());
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    return this.http.get<Product[]>(this.API, { params });
  }

  getById(id: number) { return this.http.get<Product>(`${this.API}/${id}`); }
  create(data: CreateProduct) { return this.http.post<Product>(this.API, data); }
  update(id: number, data: Partial<Product>) { return this.http.put<Product>(`${this.API}/${id}`, data); }
  delete(id: number) { return this.http.delete(`${this.API}/${id}`); }

  // Images
  getImages(id: number) { return this.http.get<ProductImage[]>(`${this.API}/${id}/images`); }
  addImage(id: number, data: { url: string; isPrimary: boolean; sortOrder: number }) {
    return this.http.post<ProductImage>(`${this.API}/${id}/images`, { ...data, productId: id });
  }
  deleteImage(productId: number, imageId: number) {
    return this.http.delete(`${this.API}/${productId}/images/${imageId}`);
  }

  // Variants
  getVariants(id: number) { return this.http.get<ProductVariant[]>(`${this.API}/${id}/variants`); }
  addVariant(id: number, data: Partial<ProductVariant>) {
    return this.http.post<ProductVariant>(`${this.API}/${id}/variants`, data);
  }
  updateVariant(productId: number, variantId: number, data: Partial<ProductVariant>) {
    return this.http.put<ProductVariant>(`${this.API}/${productId}/variants/${variantId}`, data);
  }
  deleteVariant(productId: number, variantId: number) {
    return this.http.delete(`${this.API}/${productId}/variants/${variantId}`);
  }

  // Bulk
  downloadTemplate() { return this.http.get(`${this.API}/bulk-import/template`, { responseType: 'blob' }); }
  getLowStock(threshold = 5) { return this.http.get<Product[]>(`${this.API}/low-stock?threshold=${threshold}`); }
  notifyMe(productId: number, email: string, userName: string) {
    return this.http.post<{ message: string }>(`${this.API}/${productId}/notify-me`, { email, userName });
  }
}
