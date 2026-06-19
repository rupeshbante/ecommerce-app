import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ComparisonService } from '../../../core/services/comparison.service';
import { Product } from '../../../core/models/product.models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],

  template: `
    <div class="page-wrap">
      <!-- Page header -->
      <div class="page-header">
        <div class="header-inner">
          <div>
            <h1>{{ activeCategory || 'All Products' }}</h1>
            <p class="count">{{ filtered.length }} product{{ filtered.length !== 1 ? 's' : '' }} found</p>
          </div>
          <nav class="breadcrumb">
            <a routerLink="/">Home</a> <span>/</span>
            <a routerLink="/products">Products</a>
            <ng-container *ngIf="activeCategory"><span>/</span><span>{{ activeCategory }}</span></ng-container>
          </nav>
        </div>
      </div>

      <!-- Active filter chips -->
      <div class="chips-bar" *ngIf="activeChips.length > 0">
        <div class="chips-inner">
          <span class="chips-label">Active filters:</span>
          <button *ngFor="let chip of activeChips" class="chip" (click)="removeChip(chip.type)">
            {{ chip.label }} <span class="chip-x">✕</span>
          </button>
          <button class="chip chip-clear" (click)="clearFilters()">Clear all</button>
        </div>
      </div>

      <div class="content-wrap">
        <!-- Sidebar filters -->
        <aside class="sidebar">
          <div class="filter-section">
            <h3>Search</h3>
            <div class="search-box">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input [(ngModel)]="search" (ngModelChange)="onSearchChange()" placeholder="Search products..." autocomplete="off">
            </div>
          </div>

          <div class="filter-section">
            <h3>Category</h3>
            <div class="cat-options">
              <button *ngFor="let c of categories" [class.active]="activeCategory === c.key" (click)="selectCategory(c.key)">
                <span>{{ c.icon }}</span> {{ c.label }}
                <span class="cat-count">{{ c.count }}</span>
              </button>
            </div>
          </div>

          <div class="filter-section">
            <h3>Price Range</h3>
            <div class="price-chips">
              <button *ngFor="let r of priceRanges" [class.active]="priceRange === r.key" (click)="setPriceRange(r.key)">{{ r.label }}</button>
            </div>
          </div>

          <div class="filter-section">
            <h3>Min Rating</h3>
            <div class="rating-options">
              <button *ngFor="let r of ratingFilters" [class.active]="minRating === r.key" (click)="setMinRating(r.key)">
                <span *ngIf="r.key > 0" class="star-inline">{{ '★'.repeat(r.key) }}{{ '☆'.repeat(5 - r.key) }}</span>
                {{ r.label }}
              </button>
            </div>
          </div>

          <div class="filter-section">
            <h3>Sort By</h3>
            <div class="sort-options">
              <button *ngFor="let s of sortOptions" [class.active]="sortBy === s.key" (click)="setSortBy(s.key)">{{ s.label }}</button>
            </div>
          </div>

          <button *ngIf="hasFilters()" class="clear-btn" (click)="clearFilters()">✕ Clear all filters</button>
        </aside>

        <!-- Product grid area -->
        <div class="grid-area">
          <!-- Toolbar -->
          <div class="toolbar" *ngIf="!loading">
            <span class="results-text">
              <strong>{{ filtered.length }}</strong> product{{ filtered.length !== 1 ? 's' : '' }}
              <ng-container *ngIf="totalPages > 1"> &mdash; Page {{ currentPage }} of {{ totalPages }}</ng-container>
            </span>
            <div class="view-toggle">
              <button [class.active]="viewMode === 'grid'" (click)="setView('grid')" title="Grid view">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7"/><rect x="9" y="0" width="7" height="7"/><rect x="0" y="9" width="7" height="7"/><rect x="9" y="9" width="7" height="7"/></svg>
              </button>
              <button [class.active]="viewMode === 'list'" (click)="setView('list')" title="List view">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="16" height="3"/><rect x="0" y="6" width="16" height="3"/><rect x="0" y="12" width="16" height="3"/></svg>
              </button>
            </div>
          </div>

          <!-- Skeleton loading -->
          <ng-container *ngIf="loading">
            <div class="products-grid">
              <div class="skeleton-card" *ngFor="let i of [1,2,3,4,5,6,7,8]">
                <div class="sk-img"></div>
                <div class="sk-body">
                  <div class="sk-line sk-short"></div>
                  <div class="sk-line sk-long"></div>
                  <div class="sk-line sk-med"></div>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Empty state -->
          <div *ngIf="!loading && filtered.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>No products found</h3>
            <p>Try adjusting your filters or search query.</p>
            <button (click)="clearFilters()" class="btn-reset">Reset Filters</button>
          </div>

          <!-- Grid view -->
          <div *ngIf="!loading && paginated.length > 0 && viewMode === 'grid'" class="products-grid">
            <div *ngFor="let p of paginated" class="product-card">
              <a [routerLink]="['/products', p.id]" class="card-img-wrap">
                <img [src]="p.imageUrl" [alt]="p.name" loading="lazy"
                     (error)="$any($event.target).src='https://placehold.co/400x280?text=Product'">
                <span *ngIf="p.stock <= 5 && p.stock > 0" class="badge badge-hot">Only {{ p.stock }} left!</span>
                <span *ngIf="p.stock === 0" class="badge badge-out">Out of Stock</span>
                <span *ngIf="p.salePrice && p.stock > 0" class="badge badge-sale">🔥 SALE</span>
                <button *ngIf="auth.isLoggedIn()" class="wish-icon" [class.wishlisted]="wishlistService.isInWishlist(p.id)" (click)="toggleWishlist($event, p)">{{ wishlistService.isInWishlist(p.id) ? '♥' : '♡' }}</button>
              </a>
              <div class="card-body">
                <span class="prod-cat">{{ p.category }}</span>
                <a [routerLink]="['/products', p.id]" class="prod-name">{{ p.name }}</a>
                <div class="stars">{{ starDisplay(p.averageRating) }} <span class="rating-val">{{ p.averageRating || 0 }} ({{ p.reviewCount }})</span></div>
                <p class="prod-desc">{{ p.description | slice:0:75 }}{{ p.description.length > 75 ? '…' : '' }}</p>
                <div class="card-footer">
                  <div class="card-row">
                    <div class="price-wrap">
                      <span class="price" [class.price-sale]="p.salePrice">₹{{ (p.salePrice || p.price) | number }}</span>
                      <span class="orig-price" *ngIf="p.salePrice">₹{{ p.price | number }}</span>
                    </div>
                    <div class="card-actions">
                      <a [routerLink]="['/products', p.id]" class="btn-view" title="View details">👁</a>
                      <button class="btn-cart" [disabled]="p.stock === 0" (click)="addToCart(p)" title="Add to cart">
                        {{ p.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
                      </button>
                    </div>
                  </div>
                  <button class="btn-compare" [class.comparing]="comparisonService.isInComparison(p.id)" (click)="toggleCompare(p)">
                    {{ comparisonService.isInComparison(p.id) ? '✓ Comparing' : '⚖ Compare' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- List view -->
          <div *ngIf="!loading && paginated.length > 0 && viewMode === 'list'" class="products-list">
            <div *ngFor="let p of paginated" class="list-card">
              <a [routerLink]="['/products', p.id]" class="list-img-wrap">
                <img [src]="p.imageUrl" [alt]="p.name" loading="lazy"
                     (error)="$any($event.target).src='https://placehold.co/180x140?text=Product'">
                <span *ngIf="p.stock <= 5 && p.stock > 0" class="badge badge-hot">Only {{ p.stock }} left!</span>
                <span *ngIf="p.stock === 0" class="badge badge-out">Out of Stock</span>
              </a>
              <div class="list-body">
                <div class="list-info">
                  <span class="prod-cat">{{ p.category }}</span>
                  <a [routerLink]="['/products', p.id]" class="prod-name list-name">{{ p.name }}</a>
                  <div class="stars">{{ starDisplay(p.averageRating) }} <span class="rating-val">{{ p.averageRating || 0 }} ({{ p.reviewCount }})</span></div>
                  <p class="prod-desc list-desc">{{ p.description | slice:0:140 }}{{ p.description.length > 140 ? '…' : '' }}</p>
                </div>
                <div class="list-footer">
                  <div class="price-wrap">
                    <span class="price list-price" [class.price-sale]="p.salePrice">₹{{ (p.salePrice || p.price) | number }}</span>
                    <span class="orig-price" *ngIf="p.salePrice">₹{{ p.price | number }}</span>
                  </div>
                  <div class="card-actions">
                    <button *ngIf="auth.isLoggedIn()" class="wish-icon" [class.wishlisted]="wishlistService.isInWishlist(p.id)" (click)="toggleWishlist($event, p)">{{ wishlistService.isInWishlist(p.id) ? '♥' : '♡' }}</button>
                    <a [routerLink]="['/products', p.id]" class="btn-view" title="View details">👁</a>
                    <button class="btn-cart" [disabled]="p.stock === 0" (click)="addToCart(p)">
                      {{ p.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
                    </button>
                    <button class="btn-compare" [class.comparing]="comparisonService.isInComparison(p.id)" (click)="toggleCompare(p)">
                      {{ comparisonService.isInComparison(p.id) ? '✓ Comparing' : '⚖ Compare' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div class="pagination" *ngIf="!loading && totalPages > 1">
            <button class="page-btn nav-btn" [disabled]="currentPage === 1" (click)="goToPage(currentPage - 1)">← Prev</button>
            <ng-container *ngFor="let pg of pageNumbers">
              <span *ngIf="pg === -1" class="page-ellipsis">…</span>
              <button *ngIf="pg !== -1" class="page-btn" [class.active]="pg === currentPage" (click)="goToPage(pg)">{{ pg }}</button>
            </ng-container>
            <button class="page-btn nav-btn" [disabled]="currentPage === totalPages" (click)="goToPage(currentPage + 1)">Next →</button>
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
    .count { font-size: 0.85rem; color: rgba(255,255,255,0.45); margin-top: 0.2rem; }
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; }
    .breadcrumb a { color: rgba(255,255,255,0.5); text-decoration: none; }
    .breadcrumb a:hover { color: #a29bfe; }
    .breadcrumb span { color: rgba(255,255,255,0.3); }

    /* Active filter chips bar */
    .chips-bar {
      background: #f5f3ff; border-bottom: 1.5px solid #e0dcff; padding: 0.6rem 2rem;
    }
    .chips-inner {
      max-width: 1300px; margin: 0 auto;
      display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem;
    }
    .chips-label { font-size: 0.78rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 0.25rem; }
    .chip {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.3rem 0.75rem; background: #6c63ff; color: #fff;
      border: none; border-radius: 20px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; transition: all 0.18s;
    }
    .chip:hover { background: #5a52d5; transform: scale(1.04); }
    .chip-x { opacity: 0.75; font-size: 0.7rem; }
    .chip-clear {
      background: none; border: 1.5px solid #e17055; color: #e17055;
    }
    .chip-clear:hover { background: #fff5f5; }

    .content-wrap {
      max-width: 1300px; margin: 0 auto; padding: 2rem;
      display: grid; grid-template-columns: 260px 1fr; gap: 2rem; align-items: start;
    }

    /* Sidebar */
    .sidebar { background: var(--bg-surface); border-radius: 16px; padding: 1.5rem; box-shadow: 0 2px 16px var(--shadow-sm); position: sticky; top: 84px; }
    .filter-section { margin-bottom: 1.75rem; }
    .filter-section:last-of-type { margin-bottom: 0; }
    .filter-section h3 { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.85rem; }
    .search-box { position: relative; }
    .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: #aaa; pointer-events: none; }
    .search-box input {
      width: 100%; padding: 0.65rem 0.75rem 0.65rem 2.25rem;
      border: 1.5px solid var(--border); border-radius: 10px; font-size: 0.875rem;
      outline: none; transition: border-color 0.18s; background: var(--bg-input);
      color: var(--text-body); box-sizing: border-box;
    }
    .search-box input:focus { border-color: #6c63ff; background: var(--bg-surface); }

    .cat-options { display: flex; flex-direction: column; gap: 0.35rem; }
    .cat-options button {
      display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.85rem;
      background: none; border: 1.5px solid transparent; border-radius: 10px;
      color: var(--text-secondary); font-size: 0.875rem; cursor: pointer; text-align: left; width: 100%;
      transition: all 0.18s;
    }
    .cat-options button:hover { background: var(--bg-chip); color: #6c63ff; border-color: #e0dcff; }
    .cat-options button.active { background: var(--bg-chip); color: #6c63ff; border-color: #6c63ff; font-weight: 600; }
    .cat-count { margin-left: auto; font-size: 0.75rem; background: var(--border); color: var(--text-muted); border-radius: 20px; padding: 0.1rem 0.5rem; }
    .cat-options button.active .cat-count { background: #e0dcff; color: #6c63ff; }

    .sort-options { display: flex; flex-direction: column; gap: 0.3rem; }
    .sort-options button {
      padding: 0.55rem 0.85rem; background: none; border: 1.5px solid transparent; border-radius: 10px;
      color: #555; font-size: 0.875rem; cursor: pointer; text-align: left; transition: all 0.18s;
    }
    .sort-options button:hover { background: #f5f3ff; color: #6c63ff; }
    .sort-options button.active { background: #f5f3ff; color: #6c63ff; border-color: #6c63ff; font-weight: 600; }

    .price-chips { display: flex; flex-direction: column; gap: 0.3rem; }
    .price-chips button {
      padding: 0.55rem 0.85rem; background: none; border: 1.5px solid transparent; border-radius: 10px;
      color: #555; font-size: 0.875rem; cursor: pointer; text-align: left; transition: all 0.18s;
    }
    .price-chips button:hover { background: #f5f3ff; color: #6c63ff; }
    .price-chips button.active { background: #f5f3ff; color: #6c63ff; border-color: #6c63ff; font-weight: 600; }

    /* Rating filter */
    .rating-options { display: flex; flex-direction: column; gap: 0.3rem; }
    .rating-options button {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.55rem 0.85rem; background: none; border: 1.5px solid transparent; border-radius: 10px;
      color: #555; font-size: 0.875rem; cursor: pointer; text-align: left; transition: all 0.18s;
    }
    .rating-options button:hover { background: #fffbf0; color: #f39c12; border-color: #fde68a; }
    .rating-options button.active { background: #fffbf0; color: #f39c12; border-color: #f59e0b; font-weight: 600; }
    .star-inline { color: #f39c12; letter-spacing: 1px; font-size: 0.8rem; }

    .clear-btn {
      width: 100%; padding: 0.6rem; margin-top: 1.25rem; border: 1.5px solid #ffcdd2;
      border-radius: 10px; background: #fff5f5; color: #e17055; font-size: 0.85rem;
      font-weight: 600; cursor: pointer; transition: all 0.18s;
    }
    .clear-btn:hover { background: #ffe0db; }

    /* Toolbar */
    .toolbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 0; margin-bottom: 1rem; border-bottom: 1.5px solid #f0f0f0;
    }
    .results-text { font-size: 0.875rem; color: #666; }
    .results-text strong { color: #1a1a2e; }
    .view-toggle { display: flex; gap: 0.35rem; }
    .view-toggle button {
      width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;
      background: none; border: 1.5px solid #e9ecef; border-radius: 8px; cursor: pointer;
      color: #aaa; transition: all 0.18s;
    }
    .view-toggle button:hover { border-color: #6c63ff; color: #6c63ff; }
    .view-toggle button.active { background: #f5f3ff; border-color: #6c63ff; color: #6c63ff; }

    /* Skeleton */
    .skeleton-card { background: #fff; border-radius: 16px; overflow: hidden; }
    .sk-img { height: 200px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; }
    .sk-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.65rem; }
    .sk-line { height: 12px; border-radius: 6px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; }
    .sk-short { width: 45%; }
    .sk-long { width: 85%; }
    .sk-med { width: 60%; }
    @keyframes shimmer { to { background-position: -400% 0; } }

    /* Empty state */
    .empty-state { text-align: center; padding: 5rem 2rem; background: #fff; border-radius: 20px; }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.25rem; font-weight: 700; color: #1a1a2e; margin-bottom: 0.5rem; }
    .empty-state p { color: #888; margin-bottom: 1.5rem; }
    .btn-reset { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.7rem 1.5rem; cursor: pointer; font-size: 0.9rem; font-weight: 600; }

    /* Product grid */
    .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.5rem; }
    .product-card { background: var(--bg-surface); border-radius: 18px; overflow: hidden; border: 2px solid transparent; transition: all 0.24s; box-shadow: 0 2px 12px var(--shadow-sm); }
    .product-card:hover { border-color: #6c63ff; transform: translateY(-4px); box-shadow: 0 14px 40px rgba(108,99,255,0.13); }
    .card-img-wrap { display: block; position: relative; overflow: hidden; }
    .card-img-wrap img { width: 100%; height: 200px; object-fit: cover; transition: transform 0.35s; display: block; }
    .product-card:hover .card-img-wrap img { transform: scale(1.05); }
    .badge { position: absolute; top: 0.75rem; left: 0.75rem; font-size: 0.68rem; font-weight: 700; padding: 0.22rem 0.6rem; border-radius: 20px; text-transform: uppercase; }
    .badge-hot { background: #ff6b6b; color: #fff; }
    .badge-out { background: #636e72; color: #fff; }
    .badge-sale { background: linear-gradient(135deg, #ff6348, #e84393); color: #fff; top: auto; bottom: 0.75rem; }
    .price-wrap { display: flex; flex-direction: column; line-height: 1.2; }
    .price-sale { color: #e17055; }
    .orig-price { font-size: 0.7rem; color: var(--text-faint); text-decoration: line-through; }
    .card-body { padding: 1rem 1.15rem 1.25rem; }
    .prod-cat { font-size: 0.68rem; color: #6c63ff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .prod-name { display: block; font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin: 0.3rem 0 0.35rem; text-decoration: none; line-height: 1.35; }
    .prod-name:hover { color: #6c63ff; }
    .stars { font-size: 0.75rem; color: #f39c12; margin-bottom: 0.5rem; }
    .rating-val { color: var(--text-muted); font-size: 0.75rem; }
    .prod-desc { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 0.9rem; }
    .card-footer { display: flex; flex-direction: column; gap: 0.45rem; }
    .card-row { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .price { font-size: 1.15rem; font-weight: 800; color: var(--text-primary); flex-shrink: 0; }
    .card-actions { display: flex; gap: 0.5rem; align-items: center; }
    .btn-view {
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      background: #f5f3ff; border-radius: 9px; text-decoration: none; font-size: 0.9rem;
      border: 1.5px solid #e0dcff; transition: all 0.18s; flex-shrink: 0;
    }
    .btn-view:hover { background: #ebe7ff; border-color: #6c63ff; }
    .btn-cart {
      background: #6c63ff; color: #fff; border: none; border-radius: 9px;
      padding: 0.5rem 0.9rem; font-size: 0.8rem; font-weight: 600; cursor: pointer;
      transition: all 0.18s; white-space: nowrap;
    }
    .btn-cart:hover:not(:disabled) { background: #5a52d5; transform: scale(1.04); }
    .btn-cart:disabled { background: #ccc; cursor: not-allowed; }
    .btn-compare {
      width: 100%; margin-top: 0.4rem; padding: 0.4rem 0.6rem;
      background: transparent; color: #6c63ff; border: 1.5px solid #6c63ff;
      border-radius: 9px; font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.18s;
    }
    .btn-compare:hover { background: #f5f3ff; }
    .btn-compare.comparing { background: #6c63ff; color: #fff; }
    .wish-icon {
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      position: absolute; top: 0.75rem; right: 0.75rem;
      background: rgba(255,255,255,0.9); border: none; border-radius: 50%;
      font-size: 1.1rem; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(4px);
      color: #ccc;
    }
    .wish-icon:hover, .wish-icon.wishlisted { color: #e17055; transform: scale(1.12); }

    /* List view */
    .products-list { display: flex; flex-direction: column; gap: 1rem; }
    .list-card {
      display: flex; gap: 1.25rem; background: var(--bg-surface); border-radius: 16px;
      overflow: hidden; border: 2px solid transparent; transition: all 0.22s;
      box-shadow: 0 2px 12px var(--shadow-sm); padding: 0;
    }
    .list-card:hover { border-color: #6c63ff; box-shadow: 0 8px 30px rgba(108,99,255,0.12); }
    .list-img-wrap { position: relative; flex-shrink: 0; width: 180px; display: block; overflow: hidden; }
    .list-img-wrap img { width: 180px; height: 100%; min-height: 140px; object-fit: cover; display: block; transition: transform 0.3s; }
    .list-card:hover .list-img-wrap img { transform: scale(1.04); }
    .list-body { flex: 1; padding: 1.1rem 1.25rem 1.1rem 0; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
    .list-info { flex: 1; }
    .list-name { font-size: 1.05rem !important; }
    .list-desc { -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; }
    .list-footer { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1.5px solid var(--border-light); }
    .list-price { font-size: 1.3rem !important; }

    /* Pagination */
    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      margin-top: 2.5rem; flex-wrap: wrap;
    }
    .page-btn {
      min-width: 38px; height: 38px; padding: 0 0.6rem;
      display: flex; align-items: center; justify-content: center;
      background: var(--bg-surface); border: 1.5px solid var(--border); border-radius: 10px;
      color: var(--text-secondary); font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.18s;
    }
    .page-btn:hover:not(:disabled) { border-color: #6c63ff; color: #6c63ff; background: #f5f3ff; }
    .page-btn.active { background: #6c63ff; border-color: #6c63ff; color: #fff; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .nav-btn { padding: 0 1rem; }
    .page-ellipsis { color: var(--text-faint); font-size: 0.9rem; padding: 0 0.2rem; line-height: 38px; }

    @media (max-width: 1024px) {
      .content-wrap { grid-template-columns: 1fr; padding: 1.5rem 1rem; }
      .sidebar { position: static; display: grid; grid-template-columns: repeat(2,1fr); gap: 1rem; }
      .filter-section { margin-bottom: 0; }
    }
    @media (max-width: 640px) {
      .sidebar { grid-template-columns: 1fr; }
      .products-grid { grid-template-columns: repeat(2,1fr); gap: 1rem; }
      .list-img-wrap { width: 120px; }
      .list-img-wrap img { width: 120px; }
      .chips-bar { padding: 0.6rem 1rem; }
    }
    @media (max-width: 400px) {
      .products-grid { grid-template-columns: 1fr; }
      .list-card { flex-direction: column; }
      .list-img-wrap { width: 100%; }
      .list-img-wrap img { width: 100%; height: 180px; }
      .list-body { padding: 1rem; }
    }
  `]
})
export class ProductListComponent implements OnInit {
  allProducts: Product[] = [];
  filtered: Product[] = [];
  loading = true;
  search = '';
  activeCategory = '';
  sortBy = 'default';
  priceRange = 'all';
  minRating = 0;
  currentPage = 1;
  readonly pageSize = 12;
  viewMode: 'grid' | 'list' = 'grid';
  private searchTimer: any;

  categories = [
    { key: '', label: 'All Products', icon: '🛍️', count: 0 },
    { key: 'Electronics', label: 'Electronics', icon: '💻', count: 0 },
    { key: 'Clothing', label: 'Clothing', icon: '👕', count: 0 },
    { key: 'Books', label: 'Books', icon: '📚', count: 0 },
    { key: 'Home', label: 'Home & Kitchen', icon: '🏠', count: 0 },
  ];

  sortOptions = [
    { key: 'default', label: 'Default' },
    { key: 'price-asc', label: 'Price: Low to High' },
    { key: 'price-desc', label: 'Price: High to Low' },
    { key: 'name-asc', label: 'Name: A to Z' },
    { key: 'rating', label: 'Top Rated' },
  ];

  priceRanges = [
    { key: 'all', label: 'All Prices' },
    { key: 'under1k', label: 'Under ₹1,000' },
    { key: '1k-5k', label: '₹1,000 – ₹5,000' },
    { key: '5k-25k', label: '₹5,000 – ₹25,000' },
    { key: 'above25k', label: 'Above ₹25,000' },
  ];

  ratingFilters = [
    { key: 0, label: 'All Ratings' },
    { key: 4, label: '4★ & up' },
    { key: 3, label: '3★ & up' },
    { key: 2, label: '2★ & up' },
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    public wishlistService: WishlistService,
    public auth: AuthService,
    private toasts: ToastService,
    public comparisonService: ComparisonService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    // Subscribe to queryParams so navbar search navigations are also handled reactively
    this.route.queryParams.subscribe(p => {
      const prev = {
        search: this.search, category: this.activeCategory,
        priceRange: this.priceRange, sortBy: this.sortBy,
        minRating: this.minRating, page: this.currentPage
      };
      if (p['category'] !== undefined) this.activeCategory = p['category'] || '';
      if (p['search'] !== undefined) this.search = p['search'] || '';
      if (p['priceRange'] !== undefined) this.priceRange = p['priceRange'] || 'all';
      if (p['sortBy'] !== undefined) this.sortBy = p['sortBy'] || 'default';
      if (p['minRating'] !== undefined) this.minRating = p['minRating'] ? +p['minRating'] : 0;
      if (p['page'] !== undefined) this.currentPage = p['page'] ? +p['page'] : 1;
      if (p['view'] !== undefined) this.viewMode = p['view'] === 'list' ? 'list' : 'grid';

      const changed = prev.search !== this.search || prev.category !== this.activeCategory ||
        prev.priceRange !== this.priceRange || prev.sortBy !== this.sortBy ||
        prev.minRating !== this.minRating || prev.page !== this.currentPage;

      // Only re-filter when products are loaded AND something actually changed (prevents loop from syncUrl)
      if (this.allProducts.length > 0 && changed) {
        this.applyFilters();
      }
    });

    this.productService.getAll({}).subscribe({
      next: products => {
        this.allProducts = products;
        this.updateCounts();
        this.applyFilters();
        this.loading = false;
        if (this.auth.isLoggedIn()) this.wishlistService.loadWishlist();
      },
      error: () => { this.loading = false; this.toasts.error('Failed to load products.'); }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  get paginated(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, -1, total];
    if (cur >= total - 3) return [1, -1, total - 4, total - 3, total - 2, total - 1, total];
    return [1, -1, cur - 1, cur, cur + 1, -1, total];
  }

  get activeChips(): { label: string; type: string }[] {
    const chips: { label: string; type: string }[] = [];
    if (this.search.trim()) chips.push({ label: `"${this.search.trim()}"`, type: 'search' });
    if (this.activeCategory) chips.push({ label: this.activeCategory, type: 'category' });
    if (this.priceRange !== 'all') {
      const r = this.priceRanges.find(r => r.key === this.priceRange);
      if (r) chips.push({ label: r.label, type: 'priceRange' });
    }
    if (this.minRating > 0) chips.push({ label: `${this.minRating}★ & up`, type: 'minRating' });
    if (this.sortBy !== 'default') {
      const s = this.sortOptions.find(s => s.key === this.sortBy);
      if (s) chips.push({ label: `Sort: ${s.label}`, type: 'sortBy' });
    }
    return chips;
  }

  removeChip(type: string) {
    switch (type) {
      case 'search': this.search = ''; break;
      case 'category': this.activeCategory = ''; break;
      case 'priceRange': this.priceRange = 'all'; break;
      case 'minRating': this.minRating = 0; break;
      case 'sortBy': this.sortBy = 'default'; break;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  goToPage(n: number) {
    if (n < 1 || n > this.totalPages) return;
    this.currentPage = n;
    this.syncUrl();
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  setView(mode: 'grid' | 'list') {
    this.viewMode = mode;
    this.syncUrl();
  }

  syncUrl() {
    const params: Record<string, string> = {};
    if (this.activeCategory) params['category'] = this.activeCategory;
    if (this.search.trim()) params['search'] = this.search.trim();
    if (this.priceRange !== 'all') params['priceRange'] = this.priceRange;
    if (this.sortBy !== 'default') params['sortBy'] = this.sortBy;
    if (this.minRating > 0) params['minRating'] = String(this.minRating);
    if (this.currentPage > 1) params['page'] = String(this.currentPage);
    if (this.viewMode !== 'grid') params['view'] = this.viewMode;
    this.router.navigate([], { relativeTo: this.route, queryParams: params, replaceUrl: true });
  }

  onSearchChange() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.currentPage = 1;
      this.applyFilters();
    }, 300);
  }

  starDisplay(rating: number): string {
    const full = Math.round(rating || 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  toggleWishlist(event: Event, product: Product) {
    event.preventDefault(); event.stopPropagation();
    if (!this.auth.isLoggedIn()) { this.toasts.info('Please login to add to wishlist'); return; }
    this.wishlistService.toggle(product.id).subscribe(r => {
      this.wishlistService.loadWishlist();
      this.toasts.success(r.message);
    });
  }

  updateCounts() {
    this.categories[0].count = this.allProducts.length;
    ['Electronics', 'Clothing', 'Books', 'Home'].forEach((cat, i) => {
      this.categories[i + 1].count = this.allProducts.filter(p => p.category === cat).length;
    });
  }

  selectCategory(key: string) {
    this.activeCategory = key;
    this.currentPage = 1;
    this.applyFilters();
  }

  setSortBy(key: string) {
    this.sortBy = key;
    this.currentPage = 1;
    this.applyFilters();
  }

  setPriceRange(key: string) {
    this.priceRange = key;
    this.currentPage = 1;
    this.applyFilters();
  }

  setMinRating(r: number) {
    this.minRating = r;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.allProducts];
    if (this.activeCategory) result = result.filter(p => p.category === this.activeCategory);
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }
    switch (this.priceRange) {
      case 'under1k': result = result.filter(p => p.price < 1000); break;
      case '1k-5k': result = result.filter(p => p.price >= 1000 && p.price <= 5000); break;
      case '5k-25k': result = result.filter(p => p.price > 5000 && p.price <= 25000); break;
      case 'above25k': result = result.filter(p => p.price > 25000); break;
    }
    if (this.minRating > 0) result = result.filter(p => (p.averageRating || 0) >= this.minRating);
    switch (this.sortBy) {
      case 'price-asc': result.sort((a, b) => a.price - b.price); break;
      case 'price-desc': result.sort((a, b) => b.price - a.price); break;
      case 'name-asc': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'rating': result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)); break;
    }
    this.filtered = result;
    if (this.currentPage > this.totalPages) this.currentPage = 1;
    this.syncUrl();
  }

  hasFilters(): boolean {
    return !!(this.activeCategory || this.search.trim() || this.priceRange !== 'all' || this.sortBy !== 'default' || this.minRating > 0);
  }

  clearFilters() {
    this.search = ''; this.activeCategory = ''; this.sortBy = 'default';
    this.priceRange = 'all'; this.minRating = 0; this.currentPage = 1;
    this.filtered = [...this.allProducts];
    this.syncUrl();
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, 1);
    this.toasts.success(`${product.name} added to cart!`);
  }

  toggleCompare(product: Product) {
    const result = this.comparisonService.toggle(product);
    if (result === 'added') this.toasts.info(`${product.name} added to comparison.`);
    else if (result === 'removed') this.toasts.info(`${product.name} removed from comparison.`);
    else if (result === 'full') this.toasts.error('Max 4 products can be compared at once.');
  }
}
