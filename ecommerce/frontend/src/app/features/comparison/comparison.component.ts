import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ComparisonService } from '../../core/services/comparison.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models/product.models';

@Component({
  selector: 'app-comparison',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-wrap">
      <!-- Header -->
      <div class="page-header">
        <div class="header-inner">
          <div>
            <h1>Compare Products</h1>
            <p class="sub">{{ comparison.count() }} of 4 products selected</p>
          </div>
          <div class="header-actions">
            <button *ngIf="comparison.count() > 0" class="btn-clear" (click)="clearAll()">✕ Clear All</button>
            <a routerLink="/products" class="btn-browse">+ Add More Products</a>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="comparison.count() === 0" class="empty">
        <div class="empty-icon">⚖️</div>
        <h2>No products to compare</h2>
        <p>Go to Products and click "Compare" on items you want to compare side by side.</p>
        <a routerLink="/products" class="btn-go">Browse Products</a>
      </div>

      <!-- Comparison table -->
      <div *ngIf="comparison.count() > 0" class="compare-wrap">
        <div class="compare-table">
          <!-- Product headers -->
          <div class="table-row header-row">
            <div class="row-label"></div>
            <div *ngFor="let p of comparison.products()" class="col">
              <div class="prod-header">
                <button class="remove-btn" (click)="remove(p)" title="Remove">✕</button>
                <a [routerLink]="['/products', p.id]" class="prod-img-wrap">
                  <img [src]="p.imageUrl" [alt]="p.name"
                       (error)="$any($event.target).src='https://placehold.co/200x160?text=Product'">
                </a>
                <a [routerLink]="['/products', p.id]" class="prod-title">{{ p.name }}</a>
                <div class="prod-cat-badge">{{ p.category }}</div>
                <div class="prod-price-block">
                  <span class="prod-price" [class.on-sale]="p.salePrice">
                    ₹{{ (p.salePrice || p.price) | number }}
                  </span>
                  <span class="orig-price" *ngIf="p.salePrice">₹{{ p.price | number }}</span>
                  <span class="discount-badge" *ngIf="p.salePrice">
                    {{ discount(p) }}% OFF
                  </span>
                </div>
                <button class="btn-cart" [disabled]="p.stock === 0" (click)="addToCart(p)">
                  {{ p.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
                </button>
              </div>
            </div>
            <!-- Empty slots -->
            <div *ngFor="let slot of emptySlots" class="col empty-col">
              <a routerLink="/products" class="add-slot">
                <span class="plus-icon">+</span>
                <span>Add Product</span>
              </a>
            </div>
          </div>

          <!-- Row: Rating -->
          <div class="table-row">
            <div class="row-label">Rating</div>
            <div *ngFor="let p of comparison.products()" class="col">
              <div class="stars">{{ stars(p.averageRating) }}</div>
              <div class="rating-val">{{ p.averageRating || 0 }} / 5 ({{ p.reviewCount }} reviews)</div>
            </div>
            <div *ngFor="let s of emptySlots" class="col empty-data">—</div>
          </div>

          <!-- Row: Category -->
          <div class="table-row">
            <div class="row-label">Category</div>
            <div *ngFor="let p of comparison.products()" class="col">{{ p.category }}</div>
            <div *ngFor="let s of emptySlots" class="col empty-data">—</div>
          </div>

          <!-- Row: Price -->
          <div class="table-row">
            <div class="row-label">Price</div>
            <div *ngFor="let p of comparison.products()" class="col">
              <span [class.best-val]="isBestPrice(p)">₹{{ p.price | number }}</span>
              <span *ngIf="isBestPrice(p)" class="best-tag">Best Price</span>
            </div>
            <div *ngFor="let s of emptySlots" class="col empty-data">—</div>
          </div>

          <!-- Row: Sale Price -->
          <div class="table-row">
            <div class="row-label">Sale Price</div>
            <div *ngFor="let p of comparison.products()" class="col">
              <span *ngIf="p.salePrice" class="sale-val">₹{{ p.salePrice | number }}</span>
              <span *ngIf="!p.salePrice" class="no-sale">—</span>
            </div>
            <div *ngFor="let s of emptySlots" class="col empty-data">—</div>
          </div>

          <!-- Row: Stock -->
          <div class="table-row">
            <div class="row-label">Stock Status</div>
            <div *ngFor="let p of comparison.products()" class="col">
              <span *ngIf="p.stock > 5" class="status in-stock">✓ In Stock</span>
              <span *ngIf="p.stock > 0 && p.stock <= 5" class="status low-stock">⚠ Only {{ p.stock }} left</span>
              <span *ngIf="p.stock === 0" class="status out-stock">✕ Out of Stock</span>
            </div>
            <div *ngFor="let s of emptySlots" class="col empty-data">—</div>
          </div>

          <!-- Row: Variants -->
          <div class="table-row" *ngIf="hasAnyVariants">
            <div class="row-label">Variants</div>
            <div *ngFor="let p of comparison.products()" class="col">
              <ng-container *ngIf="p.variants && p.variants.length > 0; else noVariants">
                <div *ngFor="let group of groupVariants(p)" class="variant-group">
                  <span class="vg-name">{{ group.name }}:</span>
                  <span *ngFor="let v of group.values; let last = last" class="vg-val">
                    {{ v }}<span *ngIf="!last">, </span>
                  </span>
                </div>
              </ng-container>
              <ng-template #noVariants><span class="no-sale">—</span></ng-template>
            </div>
            <div *ngFor="let s of emptySlots" class="col empty-data">—</div>
          </div>

          <!-- Row: Description -->
          <div class="table-row desc-row">
            <div class="row-label">Description</div>
            <div *ngFor="let p of comparison.products()" class="col desc-col">
              {{ p.description | slice:0:120 }}{{ p.description.length > 120 ? '…' : '' }}
            </div>
            <div *ngFor="let s of emptySlots" class="col empty-data">—</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-header {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      padding: 2.5rem 2rem;
    }
    .header-inner {
      max-width: 1300px; margin: 0 auto;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
    }
    .page-header h1 { font-size: 1.6rem; font-weight: 800; color: #fff; }
    .sub { font-size: 0.85rem; color: rgba(255,255,255,0.45); margin-top: 0.2rem; }
    .header-actions { display: flex; gap: 0.75rem; align-items: center; }
    .btn-clear {
      padding: 0.55rem 1.2rem; border: 1.5px solid #e17055; background: transparent;
      color: #e17055; border-radius: 20px; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: all 0.18s;
    }
    .btn-clear:hover { background: #e17055; color: #fff; }
    .btn-browse {
      padding: 0.55rem 1.2rem; background: #6c63ff; color: #fff; text-decoration: none;
      border-radius: 20px; font-size: 0.875rem; font-weight: 600; transition: all 0.18s;
    }
    .btn-browse:hover { background: #5a52d5; }

    /* Empty state */
    .empty {
      max-width: 480px; margin: 6rem auto; text-align: center; padding: 2rem;
    }
    .empty-icon { font-size: 4rem; margin-bottom: 1.5rem; }
    .empty h2 { font-size: 1.5rem; font-weight: 700; color: #2d3436; margin-bottom: 0.5rem; }
    .empty p { color: #636e72; line-height: 1.7; margin-bottom: 1.75rem; }
    .btn-go {
      display: inline-block; padding: 0.75rem 2rem; background: #6c63ff;
      color: #fff; text-decoration: none; border-radius: 25px; font-weight: 600; transition: all 0.18s;
    }
    .btn-go:hover { background: #5a52d5; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(108,99,255,0.35); }

    /* Compare wrap */
    .compare-wrap {
      max-width: 1300px; margin: 2rem auto; padding: 0 2rem 4rem;
      overflow-x: auto;
    }
    .compare-table {
      min-width: 700px; border-radius: 16px; overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08); background: #fff;
    }

    /* Rows */
    .table-row {
      display: grid;
      grid-template-columns: 160px repeat(4, 1fr);
      border-bottom: 1.5px solid #f0f0f6;
    }
    .table-row:last-child { border-bottom: none; }
    .table-row:nth-child(even) { background: #fafafa; }

    .row-label {
      padding: 1.25rem 1.5rem; font-size: 0.8rem; font-weight: 700;
      color: #888; text-transform: uppercase; letter-spacing: 0.6px;
      display: flex; align-items: center; border-right: 1.5px solid #f0f0f6;
      background: #f8f7ff;
    }
    .col {
      padding: 1.25rem 1.2rem; font-size: 0.9rem; color: #2d3436;
      border-right: 1.5px solid #f0f0f6; display: flex; flex-direction: column;
      align-items: center; text-align: center; justify-content: flex-start; gap: 0.25rem;
    }
    .col:last-child { border-right: none; }

    /* Product header col */
    .header-row { background: #fff; }
    .header-row .row-label { background: #f8f7ff; }
    .header-row .col { padding: 1.5rem 1.2rem; }
    .prod-header {
      display: flex; flex-direction: column; align-items: center; gap: 0.6rem; width: 100%; position: relative;
    }
    .remove-btn {
      position: absolute; top: -0.5rem; right: -0.5rem;
      background: #e17055; color: #fff; border: none; border-radius: 50%;
      width: 24px; height: 24px; font-size: 0.7rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center; transition: all 0.18s;
    }
    .remove-btn:hover { background: #c0392b; transform: scale(1.1); }
    .prod-img-wrap { display: block; width: 100%; max-width: 160px; }
    .prod-img-wrap img {
      width: 100%; aspect-ratio: 4/3; object-fit: cover;
      border-radius: 12px; border: 1.5px solid #eee;
    }
    .prod-title {
      font-size: 0.925rem; font-weight: 700; color: #2d3436;
      text-decoration: none; line-height: 1.4; text-align: center;
    }
    .prod-title:hover { color: #6c63ff; }
    .prod-cat-badge {
      font-size: 0.72rem; background: #f0efff; color: #6c63ff;
      padding: 0.2rem 0.65rem; border-radius: 20px; font-weight: 600;
    }
    .prod-price-block { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; }
    .prod-price { font-size: 1.1rem; font-weight: 800; color: #2d3436; }
    .prod-price.on-sale { color: #e17055; }
    .orig-price { font-size: 0.78rem; color: #aaa; text-decoration: line-through; }
    .discount-badge {
      font-size: 0.7rem; background: #ff6b6b; color: #fff;
      padding: 0.15rem 0.5rem; border-radius: 20px; font-weight: 700;
    }
    .btn-cart {
      margin-top: 0.4rem; padding: 0.55rem 1.1rem;
      background: #6c63ff; color: #fff; border: none; border-radius: 20px;
      font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.18s; width: 100%;
    }
    .btn-cart:hover:not(:disabled) { background: #5a52d5; }
    .btn-cart:disabled { background: #ccc; cursor: not-allowed; }

    /* Empty add slot */
    .empty-col { padding: 1.5rem; }
    .add-slot {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 0.75rem; width: 100%; height: 100%; min-height: 220px;
      border: 2px dashed #ddd; border-radius: 12px; text-decoration: none;
      color: #aaa; font-size: 0.85rem; font-weight: 500; transition: all 0.18s;
    }
    .add-slot:hover { border-color: #6c63ff; color: #6c63ff; background: #f5f3ff; }
    .plus-icon { font-size: 2rem; font-weight: 300; }

    /* Data rows */
    .stars { font-size: 1rem; color: #f39c12; letter-spacing: 1px; }
    .rating-val { font-size: 0.78rem; color: #888; }
    .best-val { color: #00b894; font-weight: 700; font-size: 1rem; }
    .best-tag {
      font-size: 0.68rem; background: #00b894; color: #fff;
      padding: 0.15rem 0.5rem; border-radius: 20px; font-weight: 700;
    }
    .sale-val { color: #e17055; font-weight: 700; }
    .no-sale { color: #ccc; }

    .status { font-size: 0.82rem; font-weight: 600; padding: 0.25rem 0.6rem; border-radius: 20px; }
    .in-stock { background: #d4edda; color: #155724; }
    .low-stock { background: #fff3cd; color: #856404; }
    .out-stock { background: #f8d7da; color: #842029; }

    .variant-group { font-size: 0.82rem; color: #555; text-align: center; }
    .vg-name { font-weight: 700; color: #333; }
    .vg-val { color: #6c63ff; }

    .desc-row .col { align-items: flex-start; text-align: left; }
    .desc-col { font-size: 0.83rem; color: #636e72; line-height: 1.6; }
    .empty-data { color: #ddd; justify-content: center; }

    @media (max-width: 900px) {
      .compare-wrap { padding: 0 1rem 3rem; }
      .table-row { grid-template-columns: 120px repeat(4, 1fr); }
      .row-label { padding: 1rem; font-size: 0.72rem; }
      .col { padding: 1rem 0.75rem; }
    }
  `]
})
export class ComparisonComponent {
  constructor(
    public comparison: ComparisonService,
    private cart: CartService,
    private toasts: ToastService
  ) {}

  get emptySlots(): number[] {
    return Array(4 - this.comparison.count()).fill(0);
  }

  get hasAnyVariants(): boolean {
    return this.comparison.products().some(p => p.variants && p.variants.length > 0);
  }

  stars(rating: number): string {
    const full = Math.round(rating || 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  discount(p: Product): number {
    if (!p.salePrice) return 0;
    return Math.round((1 - p.salePrice / p.price) * 100);
  }

  isBestPrice(p: Product): boolean {
    const products = this.comparison.products();
    if (products.length < 2) return false;
    const minPrice = Math.min(...products.map(x => x.price));
    return p.price === minPrice;
  }

  groupVariants(p: Product): { name: string; values: string[] }[] {
    const map = new Map<string, string[]>();
    (p.variants || []).filter(v => v.isActive).forEach(v => {
      if (!map.has(v.name)) map.set(v.name, []);
      map.get(v.name)!.push(v.value);
    });
    return Array.from(map.entries()).map(([name, values]) => ({ name, values }));
  }

  addToCart(p: Product) {
    if (p.stock === 0) return;
    this.cart.addToCart(p, 1);
    this.toasts.success(`${p.name} added to cart!`);
  }

  remove(p: Product) {
    this.comparison.remove(p.id);
  }

  clearAll() {
    this.comparison.clear();
    this.toasts.info('Comparison cleared.');
  }
}
