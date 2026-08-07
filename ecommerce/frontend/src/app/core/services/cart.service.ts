import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.models';
import { CartItem, CartItemServerRow } from '../models/cart.model';

function rowToCartItem(row: CartItemServerRow): CartItem {
  const product: Product = {
    id: row.productId, name: row.productName, description: '', price: row.price, stock: row.stock,
    category: row.category, imageUrl: row.imageUrl || '', isActive: true, averageRating: 0, reviewCount: 0,
    images: [], variants: []
  };
  return { product, quantity: row.quantity };
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly API = `${environment.apiUrl}/cart`;
  items = signal<CartItem[]>([]);
  totalItems = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  totalPrice = computed(() => this.items().reduce((s, i) => s + i.product.price * i.quantity, 0));

  constructor(private http: HttpClient) {
    if (this.loggedIn()) this.loadFromServer();
  }

  private loggedIn(): boolean { return !!localStorage.getItem('token'); }

  private loadFromServer() {
    this.http.get<CartItemServerRow[]>(this.API).subscribe({
      next: rows => this.items.set(rows.map(rowToCartItem)),
      error: () => {}
    });
  }

  addToCart(product: Product, quantity = 1) {
    this.items.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      if (existing) return items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      return [...items, { product, quantity }];
    });
    if (this.loggedIn()) {
      this.http.post(this.API, { productId: product.id, quantity }).subscribe({ error: () => {} });
    }
  }

  removeFromCart(productId: number) {
    this.items.update(items => items.filter(i => i.product.id !== productId));
    if (this.loggedIn()) {
      this.http.delete(`${this.API}/${productId}`).subscribe({ error: () => {} });
    }
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) { this.removeFromCart(productId); return; }
    this.items.update(items => items.map(i => i.product.id === productId ? { ...i, quantity } : i));
    if (this.loggedIn()) {
      this.http.put(`${this.API}/${productId}`, { quantity }).subscribe({ error: () => {} });
    }
  }

  clearCart() {
    this.items.set([]);
    if (this.loggedIn()) {
      this.http.delete(this.API).subscribe({ error: () => {} });
    }
  }

  /** Called right after login/register succeeds — merges any guest-session cart into the user's server cart. */
  mergeGuestCartOnLogin() {
    const guestItems = this.items();
    if (guestItems.length === 0) { this.loadFromServer(); return; }
    const payload = { items: guestItems.map(i => ({ productId: i.product.id, quantity: i.quantity })) };
    this.http.post<CartItemServerRow[]>(`${this.API}/merge`, payload).subscribe({
      next: rows => this.items.set(rows.map(rowToCartItem)),
      error: () => this.loadFromServer()
    });
  }
}
