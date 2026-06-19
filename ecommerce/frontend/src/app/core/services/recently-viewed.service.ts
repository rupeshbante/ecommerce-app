import { Injectable } from '@angular/core';
import { Product } from '../models/product.models';

const KEY = 'shopease_recently_viewed';
const MAX = 8;

@Injectable({ providedIn: 'root' })
export class RecentlyViewedService {
  add(product: Product) {
    const current = this.get();
    const filtered = current.filter(p => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, MAX);
    try { localStorage.setItem(KEY, JSON.stringify(updated)); } catch {}
  }

  get(): Product[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  clear() {
    try { localStorage.removeItem(KEY); } catch {}
  }
}
