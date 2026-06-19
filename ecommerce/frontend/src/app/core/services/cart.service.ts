import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.models';
import { CartItem } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([]);
  totalItems = computed(() => this.items().reduce((s, i) => s + i.quantity, 0));
  totalPrice = computed(() => this.items().reduce((s, i) => s + i.product.price * i.quantity, 0));

  addToCart(product: Product, quantity = 1) {
    this.items.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      if (existing) return items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i);
      return [...items, { product, quantity }];
    });
  }

  removeFromCart(productId: number) {
    this.items.update(items => items.filter(i => i.product.id !== productId));
  }

  updateQuantity(productId: number, quantity: number) {
    if (quantity <= 0) { this.removeFromCart(productId); return; }
    this.items.update(items => items.map(i => i.product.id === productId ? { ...i, quantity } : i));
  }

  clearCart() { this.items.set([]); }
}
