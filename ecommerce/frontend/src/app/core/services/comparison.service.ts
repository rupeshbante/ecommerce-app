import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.models';

const MAX = 4;
const KEY = 'shopease_compare';

@Injectable({ providedIn: 'root' })
export class ComparisonService {
  private _products = signal<Product[]>(this.load());

  products = this._products.asReadonly();

  count() { return this._products().length; }
  isInComparison(id: number) { return this._products().some(p => p.id === id); }

  add(product: Product): 'added' | 'already' | 'full' {
    const list = this._products();
    if (list.some(p => p.id === product.id)) return 'already';
    if (list.length >= MAX) return 'full';
    const updated = [...list, product];
    this._products.set(updated);
    this.save(updated);
    return 'added';
  }

  remove(id: number) {
    const updated = this._products().filter(p => p.id !== id);
    this._products.set(updated);
    this.save(updated);
  }

  toggle(product: Product): 'added' | 'removed' | 'full' {
    if (this.isInComparison(product.id)) {
      this.remove(product.id);
      return 'removed';
    }
    const r = this.add(product);
    return r === 'full' ? 'full' : 'added';
  }

  clear() {
    this._products.set([]);
    localStorage.removeItem(KEY);
  }

  private load(): Product[] {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }

  private save(products: Product[]) {
    localStorage.setItem(KEY, JSON.stringify(products));
  }
}
