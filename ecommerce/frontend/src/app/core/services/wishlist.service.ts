import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { WishlistItem } from '../models/wishlist.models';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly API = `${environment.apiUrl}/wishlist`;
  private _items = signal<WishlistItem[]>([]);

  items = this._items.asReadonly();
  count = computed(() => this._items().length);

  constructor(private http: HttpClient) {}

  loadWishlist() {
    this.http.get<WishlistItem[]>(this.API).subscribe({
      next: items => this._items.set(items),
      error: () => {}
    });
  }

  getWishlist() {
    return this.http.get<WishlistItem[]>(this.API);
  }

  toggle(productId: number) {
    return this.http.post<{ added: boolean; message: string }>(`${this.API}/${productId}/toggle`, {});
  }

  check(productId: number) {
    return this.http.get<{ isInWishlist: boolean }>(`${this.API}/${productId}/check`);
  }

  remove(productId: number) {
    return this.http.delete(`${this.API}/${productId}`);
  }

  isInWishlist(productId: number): boolean {
    return this._items().some(i => i.productId === productId);
  }
}
