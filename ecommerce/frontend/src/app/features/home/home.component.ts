import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { RecentlyViewedService } from '../../core/services/recently-viewed.service';
import { Product } from '../../core/models/product.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-text">
          <div class="hero-badge">🔥 New Arrivals Every Week</div>
          <h1>Shop the Best<br><span class="grad">Deals in India</span></h1>
          <p>20+ handpicked products across Electronics, Clothing, Books & Home. Fast delivery, easy returns, secure payments.</p>
          <div class="hero-btns">
            <a routerLink="/products" class="btn-primary">Shop Now →</a>
            <a routerLink="/auth/register" class="btn-outline">Join Free</a>
          </div>
          <div class="trust-row">
            <div class="trust-item"><strong>20+</strong><span>Products</span></div>
            <div class="trust-sep"></div>
            <div class="trust-item"><strong>2L+</strong><span>Customers</span></div>
            <div class="trust-sep"></div>
            <div class="trust-item"><strong>4.9★</strong><span>Avg Rating</span></div>
            <div class="trust-sep"></div>
            <div class="trust-item"><strong>Free</strong><span>Delivery ₹500+</span></div>
          </div>
        </div>
        <div class="hero-visual">
          <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=640&h=580&fit=crop&auto=format" alt="Shopping bags" loading="eager">
          <div class="pill pill-1">📦 Order Shipped!</div>
          <div class="pill pill-2">⭐ 4.9 Rating</div>
          <div class="pill pill-3">🔒 Secure Pay</div>
        </div>
      </div>
    </section>

    <!-- Value props -->
    <section class="values">
      <div class="values-grid">
        <div class="val-card" *ngFor="let v of values">
          <span class="val-icon">{{ v.icon }}</span>
          <div>
            <h4>{{ v.title }}</h4>
            <p>{{ v.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="section categories-section">
      <div class="container">
        <div class="sec-head">
          <div>
            <p class="sec-label">BROWSE</p>
            <h2 class="sec-title">Shop by Category</h2>
          </div>
          <a routerLink="/products" class="see-all">View all products →</a>
        </div>
        <div class="cat-grid">
          <a *ngFor="let c of categories" [routerLink]="['/products']" [queryParams]="{category: c.key}" class="cat-tile">
            <div class="cat-icon-wrap">{{ c.icon }}</div>
            <h3>{{ c.name }}</h3>
            <p>{{ c.count }}</p>
            <span class="cat-arrow">→</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="section featured-section" *ngIf="featured.length">
      <div class="container">
        <div class="sec-head">
          <div>
            <p class="sec-label">HANDPICKED</p>
            <h2 class="sec-title">Featured Products</h2>
          </div>
          <a routerLink="/products" class="see-all">See all 20 products →</a>
        </div>
        <div class="prod-grid">
          <div *ngFor="let p of featured" class="prod-card">
            <a [routerLink]="['/products', p.id]" class="prod-img-wrap">
              <img [src]="p.imageUrl" [alt]="p.name" loading="lazy"
                   (error)="$any($event.target).src='https://placehold.co/400x280?text=Product'">
              <span class="prod-badge">New</span>
            </a>
            <div class="prod-body">
              <span class="prod-cat">{{ p.category }}</span>
              <a [routerLink]="['/products', p.id]" class="prod-name">{{ p.name }}</a>
              <div class="prod-stars">★★★★★ <span>4.8 (124)</span></div>
              <div class="prod-foot">
                <span class="prod-price">₹{{ p.price | number }}</span>
                <button class="add-btn" (click)="addToCart(p)">+ Cart</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recently Viewed -->
    <section class="section" *ngIf="recentlyViewed.length > 0">
      <div class="container">
        <div class="sec-head">
          <div>
            <p class="sec-label">YOUR HISTORY</p>
            <h2 class="sec-title">Recently Viewed</h2>
          </div>
          <a routerLink="/products" class="see-all">Browse all →</a>
        </div>
        <div class="prod-grid">
          <div *ngFor="let p of recentlyViewed" class="prod-card">
            <a [routerLink]="['/products', p.id]" class="prod-img-wrap">
              <img [src]="p.imageUrl" [alt]="p.name" loading="lazy"
                   (error)="$any($event.target).src='https://placehold.co/400x280?text=Product'">
              <span *ngIf="p.stock === 0" class="prod-badge" style="background:#e17055">Out of Stock</span>
              <span *ngIf="p.salePrice && p.stock > 0" class="prod-badge" style="background:linear-gradient(135deg,#ff6348,#e84393)">🔥 SALE</span>
            </a>
            <div class="prod-body">
              <span class="prod-cat">{{ p.category }}</span>
              <a [routerLink]="['/products', p.id]" class="prod-name">{{ p.name }}</a>
              <div class="prod-foot">
                <span class="prod-price">₹{{ (p.salePrice || p.price) | number }}</span>
                <a [routerLink]="['/products', p.id]" class="add-btn">View →</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Why ShopEase -->
    <section class="section why-section">
      <div class="container">
        <div class="why-grid">
          <div class="why-text">
            <p class="sec-label">WHY SHOPEASE</p>
            <h2 class="sec-title">Trusted by 2 Lakh+<br>Happy Shoppers</h2>
            <p class="why-sub">We deliver not just products, but a complete shopping experience — from browse to doorstep.</p>
            <ul class="why-list">
              <li><span class="check">✓</span> 100% genuine products — zero counterfeits, guaranteed</li>
              <li><span class="check">✓</span> Free shipping on all orders above ₹500</li>
              <li><span class="check">✓</span> 30-day easy returns, no questions asked</li>
              <li><span class="check">✓</span> Secure payments — UPI, cards, net banking &amp; COD</li>
              <li><span class="check">✓</span> 24/7 customer support via chat &amp; email</li>
            </ul>
            <a routerLink="/products" class="btn-primary" style="display:inline-flex;margin-top:2rem">Start Shopping →</a>
          </div>
          <div class="why-image">
            <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=560&h=500&fit=crop&auto=format" alt="Happy customer" loading="lazy">
            <div class="why-badge">
              <div class="wb-num">₹500Cr+</div>
              <div class="wb-label">GMV in 2024</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="cta-banner">
      <div class="container">
        <h2>Ready to find your next favourite product?</h2>
        <p>Join thousands of shoppers who trust ShopEase for quality and value.</p>
        <a routerLink="/products" class="btn-white">Browse All Products →</a>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 55%, #0f3460 100%);
      padding: 0 2rem;
    }
    .hero-inner {
      max-width: 1300px; margin: 0 auto; padding: 6rem 0;
      display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: center;
    }
    .hero-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(108,99,255,0.25); color: #a29bfe;
      font-size: 0.82rem; font-weight: 600; padding: 0.38rem 1rem; border-radius: 30px;
      border: 1px solid rgba(108,99,255,0.35); margin-bottom: 1.5rem;
    }
    .hero-text h1 {
      font-size: 3.6rem; font-weight: 800; color: #fff; line-height: 1.12;
      margin-bottom: 1.25rem; letter-spacing: -1.5px;
    }
    .grad { background: linear-gradient(135deg, #6c63ff, #a29bfe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .hero-text p { color: rgba(255,255,255,0.55); font-size: 1.05rem; line-height: 1.75; margin-bottom: 2.25rem; max-width: 460px; }
    .hero-btns { display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 3rem; }
    .btn-primary {
      background: linear-gradient(135deg, #6c63ff, #a29bfe); color: #fff; text-decoration: none;
      font-weight: 700; padding: 0.9rem 2.1rem; border-radius: 30px; font-size: 0.95rem;
      transition: all 0.2s; box-shadow: 0 8px 28px rgba(108,99,255,0.42); display: inline-flex; align-items: center;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(108,99,255,0.56); }
    .btn-outline {
      color: rgba(255,255,255,0.78); text-decoration: none; font-weight: 600;
      padding: 0.9rem 2rem; border-radius: 30px; font-size: 0.95rem;
      border: 1.5px solid rgba(255,255,255,0.24); transition: all 0.2s; display: inline-flex; align-items: center;
    }
    .btn-outline:hover { border-color: rgba(255,255,255,0.55); color: #fff; }
    .trust-row { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
    .trust-item { text-align: center; }
    .trust-item strong { display: block; font-size: 1.35rem; font-weight: 800; color: #fff; }
    .trust-item span { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
    .trust-sep { width: 1px; height: 36px; background: rgba(255,255,255,0.13); }
    .hero-visual { position: relative; }
    .hero-visual img { width: 100%; border-radius: 24px; box-shadow: 0 30px 80px rgba(0,0,0,0.45); display: block; }
    .pill {
      position: absolute; background: #fff; border-radius: 30px;
      padding: 0.6rem 1.1rem; font-size: 0.82rem; font-weight: 700; color: #333;
      box-shadow: 0 8px 28px rgba(0,0,0,0.18); white-space: nowrap;
    }
    .pill-1 { top: 12%; left: -8%; }
    .pill-2 { bottom: 18%; right: -6%; }
    .pill-3 { bottom: 36%; left: -10%; }

    /* Values */
    .values { background: var(--bg-surface); border-bottom: 1px solid var(--border-light); }
    .values-grid {
      max-width: 1300px; margin: 0 auto; padding: 2.5rem 2rem;
      display: grid; grid-template-columns: repeat(4,1fr); gap: 0;
    }
    .val-card {
      display: flex; align-items: center; gap: 1rem; padding: 1.5rem 2rem;
      border-right: 1px solid var(--border-light);
    }
    .val-card:last-child { border-right: none; }
    .val-icon { font-size: 2rem; flex-shrink: 0; }
    .val-card h4 { font-size: 0.92rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem; }
    .val-card p { font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; }

    /* Shared */
    .section { padding: 5rem 2rem; }
    .container { max-width: 1300px; margin: 0 auto; }
    .sec-head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; }
    .sec-label { font-size: 0.72rem; font-weight: 700; color: #6c63ff; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.4rem; }
    .sec-title { font-size: 1.9rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; }
    .see-all { color: #6c63ff; text-decoration: none; font-size: 0.875rem; font-weight: 600; white-space: nowrap; }
    .see-all:hover { text-decoration: underline; }

    /* Categories */
    .categories-section { background: var(--bg-page); }
    .cat-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.5rem; }
    .cat-tile {
      background: var(--bg-surface); border-radius: 20px; padding: 2rem 1.5rem; text-align: center;
      text-decoration: none; border: 2px solid transparent;
      box-shadow: 0 2px 16px var(--shadow-sm); transition: all 0.24s; position: relative;
    }
    .cat-tile:hover { border-color: #6c63ff; transform: translateY(-5px); box-shadow: 0 12px 36px rgba(108,99,255,0.14); }
    .cat-icon-wrap { font-size: 3rem; margin-bottom: 1rem; display: block; }
    .cat-tile h3 { font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.3rem; }
    .cat-tile p { font-size: 0.8rem; color: #6c63ff; font-weight: 600; }
    .cat-arrow { position: absolute; top: 1.25rem; right: 1.25rem; color: var(--border); font-size: 1rem; transition: color 0.2s; }
    .cat-tile:hover .cat-arrow { color: #6c63ff; }

    /* Featured */
    .featured-section { background: var(--bg-surface); }
    .prod-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1.5rem; }
    .prod-card { background: var(--bg-surface2); border-radius: 18px; overflow: hidden; border: 2px solid transparent; transition: all 0.24s; }
    .prod-card:hover { border-color: #6c63ff; transform: translateY(-5px); box-shadow: 0 16px 44px rgba(108,99,255,0.12); }
    .prod-img-wrap { display: block; position: relative; overflow: hidden; }
    .prod-img-wrap img { width: 100%; height: 200px; object-fit: cover; transition: transform 0.35s; display: block; }
    .prod-card:hover .prod-img-wrap img { transform: scale(1.06); }
    .prod-badge {
      position: absolute; top: 0.75rem; left: 0.75rem;
      background: #6c63ff; color: #fff; font-size: 0.68rem; font-weight: 700;
      padding: 0.2rem 0.6rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .prod-body { padding: 1rem 1.1rem 1.2rem; }
    .prod-cat { font-size: 0.68rem; color: #6c63ff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .prod-name { display: block; font-size: 0.94rem; font-weight: 600; color: var(--text-primary); margin: 0.3rem 0 0.4rem; text-decoration: none; line-height: 1.4; }
    .prod-name:hover { color: #6c63ff; }
    .prod-stars { font-size: 0.78rem; color: #f39c12; margin-bottom: 0.75rem; }
    .prod-stars span { color: var(--text-muted); }
    .prod-foot { display: flex; justify-content: space-between; align-items: center; }
    .prod-price { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
    .add-btn {
      background: #6c63ff; color: #fff; border: none; border-radius: 8px;
      padding: 0.48rem 0.9rem; font-size: 0.8rem; font-weight: 600; cursor: pointer;
      transition: all 0.18s;
    }
    .add-btn:hover { background: #5a52d5; transform: scale(1.04); }

    /* Why */
    .why-section { background: var(--bg-page); }
    .why-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; align-items: center; }
    .why-text .sec-title { margin-bottom: 1rem; }
    .why-sub { color: var(--text-secondary); font-size: 1rem; line-height: 1.75; margin-bottom: 1.75rem; }
    .why-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.9rem; }
    .why-list li { display: flex; gap: 0.75rem; font-size: 0.9rem; color: var(--text-body); align-items: flex-start; }
    .check { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; background: #6c63ff; color: #fff; border-radius: 50%; font-size: 0.65rem; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
    .why-image { position: relative; }
    .why-image img { width: 100%; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.12); display: block; }
    .why-badge {
      position: absolute; bottom: -1rem; left: -1.5rem;
      background: #6c63ff; color: #fff; border-radius: 16px; padding: 1rem 1.5rem;
      box-shadow: 0 8px 30px rgba(108,99,255,0.4); text-align: center;
    }
    .wb-num { font-size: 1.3rem; font-weight: 800; }
    .wb-label { font-size: 0.75rem; opacity: 0.85; }

    /* CTA */
    .cta-banner {
      background: linear-gradient(135deg, #6c63ff 0%, #a29bfe 100%);
      padding: 5rem 2rem; text-align: center;
    }
    .cta-banner h2 { font-size: 2rem; font-weight: 800; color: #fff; margin-bottom: 0.75rem; }
    .cta-banner p { color: rgba(255,255,255,0.8); font-size: 1rem; margin-bottom: 2rem; }
    .btn-white {
      background: #fff; color: #6c63ff; text-decoration: none;
      font-weight: 700; padding: 0.9rem 2.25rem; border-radius: 30px; font-size: 0.95rem;
      transition: all 0.2s; display: inline-block; box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    }
    .btn-white:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.2); }

    @media (max-width: 1100px) {
      .hero-inner { grid-template-columns: 1fr; text-align: center; gap: 3rem; padding: 4rem 0; }
      .hero-text p { max-width: 100%; }
      .hero-btns { justify-content: center; }
      .trust-row { justify-content: center; }
      .hero-visual { display: none; }
      .values-grid { grid-template-columns: 1fr 1fr; }
      .val-card { border-right: none; border-bottom: 1px solid var(--border-light); }
      .cat-grid { grid-template-columns: 1fr 1fr; }
      .prod-grid { grid-template-columns: 1fr 1fr; }
      .why-grid { grid-template-columns: 1fr; gap: 3rem; }
      .why-image { display: none; }
    }
    @media (max-width: 640px) {
      .hero-text h1 { font-size: 2.4rem; }
      .section { padding: 3rem 1rem; }
      .cta-banner { padding: 3rem 1rem; }
      .values-grid { grid-template-columns: 1fr 1fr; gap: 0; padding: 1.5rem 1rem; }
      .val-card { padding: 1rem; }
      .cta-banner h2 { font-size: 1.5rem; }
    }
  `]
})
export class HomeComponent implements OnInit {
  featured: Product[] = [];
  recentlyViewed: Product[] = [];

  values = [
    { icon: '🚚', title: 'Free Delivery', desc: 'On all orders above ₹500 anywhere in India' },
    { icon: '↩️', title: '30-Day Returns', desc: 'Hassle-free returns, no questions asked' },
    { icon: '🔒', title: 'Secure Payments', desc: 'UPI, cards, net banking & COD accepted' },
    { icon: '🎧', title: '24/7 Support', desc: 'Round-the-clock help via chat & email' },
  ];

  categories = [
    { icon: '💻', key: 'Electronics', name: 'Electronics', count: '9 products' },
    { icon: '👕', key: 'Clothing', name: 'Clothing', count: '5 products' },
    { icon: '📚', key: 'Books', name: 'Books', count: '3 products' },
    { icon: '🏠', key: 'Home', name: 'Home & Kitchen', count: '3 products' },
  ];

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private toasts: ToastService,
    private recentlyViewedService: RecentlyViewedService
  ) {}

  ngOnInit() {
    this.productService.getAll().subscribe({ next: p => this.featured = p.slice(0, 4) });
    this.recentlyViewed = this.recentlyViewedService.get();
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, 1);
    this.toasts.success(`${product.name} added to cart!`);
  }
}
