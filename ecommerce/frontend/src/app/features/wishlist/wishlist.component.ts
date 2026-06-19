import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../core/services/wishlist.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { WishlistItem } from '../../core/models/wishlist.models';
import { Product } from '../../core/models/product.models';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div class="header-inner">
        <h1>My Wishlist</h1>
        <nav class="breadcrumb">
          <a routerLink="/">Home</a><span>/</span><span>Wishlist</span>
        </nav>
      </div>
    </div>

    <div class="container">
      <div *ngIf="loading" class="loading-grid">
        <div class="sk-card" *ngFor="let i of [1,2,3,4]"></div>
      </div>

      <div *ngIf="!loading && items.length === 0" class="empty-state">
        <div class="empty-icon">❤️</div>
        <h2>Your wishlist is empty</h2>
        <p>Save products you love to buy them later!</p>
        <a routerLink="/products" class="btn-shop">Browse Products →</a>
      </div>

      <div *ngIf="!loading && items.length > 0">
        <div class="wish-header">
          <h2>{{ items.length }} saved item{{ items.length !== 1 ? 's' : '' }}</h2>
        </div>

        <div class="wish-grid">
          <div class="wish-card" *ngFor="let item of items">
            <div class="card-img">
              <a [routerLink]="['/products', item.productId]">
                <img [src]="item.productImageUrl" [alt]="item.productName"
                     (error)="$any($event.target).src='https://placehold.co/300x200?text=Product'">
              </a>
              <button class="remove-heart" (click)="removeItem(item)" title="Remove from wishlist">♥</button>
            </div>
            <div class="card-body">
              <span class="category">{{ item.productCategory }}</span>
              <a [routerLink]="['/products', item.productId]" class="prod-name">{{ item.productName }}</a>
              <div class="price-row">
                <span class="price">₹{{ item.productPrice | number }}</span>
                <span *ngIf="item.productStock > 0" class="in-stock">In Stock</span>
                <span *ngIf="item.productStock === 0" class="out-stock">Out of Stock</span>
              </div>
              <div class="card-actions">
                <button class="btn-cart" [disabled]="item.productStock === 0" (click)="addToCart(item)">
                  Add to Cart
                </button>
                <button class="btn-remove" (click)="removeItem(item)">Remove</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background: #f7f8fc; min-height: 100vh; }
    .page-header { background: linear-gradient(135deg,#1a1a2e,#16213e); padding: 2.5rem 2rem; }
    .header-inner { max-width: 1300px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .page-header h1 { font-size: 1.6rem; font-weight: 800; color: #fff; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
    .breadcrumb a { color: rgba(255,255,255,0.5); text-decoration: none; }
    .breadcrumb span { color: rgba(255,255,255,0.3); }
    .container { max-width: 1300px; margin: 0 auto; padding: 2rem; }

    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 1.5rem; }
    .sk-card { height: 320px; border-radius: 16px; background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { to { background-position: -400% 0; } }

    .empty-state { text-align: center; padding: 6rem 2rem; background: #fff; border-radius: 20px; }
    .empty-icon { font-size: 5rem; margin-bottom: 1rem; }
    .empty-state h2 { font-size: 1.5rem; font-weight: 800; color: #1a1a2e; margin-bottom: 0.5rem; }
    .empty-state p { color: #888; margin-bottom: 2rem; }
    .btn-shop { background: #6c63ff; color: #fff; text-decoration: none; padding: 0.9rem 2rem; border-radius: 30px; font-weight: 700; display: inline-block; }

    .wish-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .wish-header h2 { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; }

    .wish-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 1.5rem; }
    .wish-card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); transition: transform 0.2s, box-shadow 0.2s; }
    .wish-card:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(0,0,0,0.12); }

    .card-img { position: relative; height: 200px; overflow: hidden; }
    .card-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.3s; }
    .wish-card:hover .card-img img { transform: scale(1.04); }
    .remove-heart { position: absolute; top: 0.75rem; right: 0.75rem; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 34px; height: 34px; cursor: pointer; font-size: 1rem; color: #e17055; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.12); transition: transform 0.2s; }
    .remove-heart:hover { transform: scale(1.15); }

    .card-body { padding: 1rem 1.25rem; }
    .category { font-size: 0.7rem; color: #6c63ff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .prod-name { display: block; font-size: 0.95rem; font-weight: 600; color: #1a1a2e; text-decoration: none; margin: 0.35rem 0 0.6rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .prod-name:hover { color: #6c63ff; }
    .price-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .price { font-size: 1.1rem; font-weight: 800; color: #1a1a2e; }
    .in-stock { font-size: 0.75rem; color: #00b894; font-weight: 600; }
    .out-stock { font-size: 0.75rem; color: #e17055; font-weight: 600; }
    .card-actions { display: flex; gap: 0.5rem; }
    .btn-cart { flex: 1; background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.6rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: background 0.18s; }
    .btn-cart:hover:not(:disabled) { background: #5a52d5; }
    .btn-cart:disabled { background: #ccc; cursor: not-allowed; }
    .btn-remove { background: #fff5f5; color: #e17055; border: 1.5px solid #ffcdd2; border-radius: 10px; padding: 0.6rem 0.85rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.18s; }
    .btn-remove:hover { background: #ffe0db; }
  `]
})
export class WishlistComponent implements OnInit {
  items: WishlistItem[] = [];
  loading = true;

  constructor(
    private wishlistService: WishlistService,
    private cartService: CartService,
    private toasts: ToastService
  ) {}

  ngOnInit() {
    this.wishlistService.getWishlist().subscribe({
      next: items => { this.items = items; this.loading = false; },
      error: () => this.loading = false
    });
  }

  addToCart(item: WishlistItem) {
    const product: Product = {
      id: item.productId, name: item.productName, price: item.productPrice,
      imageUrl: item.productImageUrl, category: item.productCategory,
      stock: item.productStock, description: '', isActive: true, averageRating: 0, reviewCount: 0, images: [], variants: []
    };
    this.cartService.addToCart(product, 1);
    this.toasts.success(`${item.productName} added to cart!`);
  }

  removeItem(item: WishlistItem) {
    this.wishlistService.remove(item.productId).subscribe(() => {
      this.items = this.items.filter(i => i.id !== item.id);
      this.toasts.info('Removed from wishlist');
    });
  }
}
