import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { CartService } from './core/services/cart.service';
import { ToastService } from './core/services/toast.service';
import { NotificationService } from './core/services/notification.service';
import { WishlistService } from './core/services/wishlist.service';
import { ComparisonService } from './core/services/comparison.service';
import { ThemeService } from './core/services/theme.service';
import { ProductService } from './core/services/product.service';
import { Product } from './core/models/product.models';
import { ChatWidgetComponent } from './shared/chat-widget/chat-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule, ChatWidgetComponent],
  template: `
    <nav class="navbar">
      <div class="nav-wrap">
        <a routerLink="/" class="brand">
          <span class="brand-icon">🛍️</span>
          <span class="brand-name">ShopEase</span>
        </a>
        <div class="nav-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}">Home</a>
          <a routerLink="/products" routerLinkActive="active">Products</a>
          <a *ngIf="auth.isLoggedIn()" routerLink="/orders" routerLinkActive="active">My Orders</a>
          <a *ngIf="auth.isLoggedIn()" routerLink="/wishlist" routerLinkActive="active">Wishlist</a>
          <a *ngIf="auth.isAdminOrManager()" routerLink="/admin" routerLinkActive="active" class="admin-link">⚙️ Admin</a>
        </div>

        <!-- Live Search Autocomplete -->
        <div class="search-wrap" (click)="$event.stopPropagation()">
          <div class="search-bar">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              [(ngModel)]="searchQuery"
              (input)="onSearchInput()"
              (keydown)="onKeyDown($event)"
              (focus)="onInputFocus()"
              placeholder="Search products..."
              autocomplete="off"
              class="search-input"
            >
            <button *ngIf="searchQuery" class="search-clear" (click)="clearSearch()">✕</button>
          </div>
          <div class="search-dropdown" *ngIf="showDropdown">
            <div *ngIf="searchLoading" class="search-loading">
              <span class="search-spinner"></span> Searching...
            </div>
            <ng-container *ngIf="!searchLoading">
              <div
                *ngFor="let p of suggestions; let i = index"
                class="suggestion-item"
                [class.active]="i === activeIndex"
                (click)="selectSuggestion(p)"
                (mouseenter)="activeIndex = i"
              >
                <img class="suggestion-img" [src]="p.imageUrl" [alt]="p.name"
                     (error)="$any($event.target).src='https://placehold.co/44x44?text=P'">
                <div class="suggestion-info">
                  <span class="suggestion-name">{{ p.name }}</span>
                  <span class="suggestion-cat">{{ p.category }}</span>
                </div>
                <span class="suggestion-price">₹{{ (p.salePrice ?? p.price) | number:'1.0-0' }}</span>
              </div>
              <div *ngIf="suggestions.length === 0 && searchQuery.length >= 2" class="search-empty">
                No products found for "{{ searchQuery }}"
              </div>
              <div *ngIf="suggestions.length > 0" class="suggestion-footer" (click)="submitSearch()">
                See all results for "<strong>{{ searchQuery }}</strong>" →
              </div>
            </ng-container>
          </div>
        </div>

        <div class="nav-actions">
          <!-- Theme Toggle -->
          <button class="theme-btn" (click)="theme.toggle()" [title]="theme.isDark() ? 'Switch to Light' : 'Switch to Dark'">
            {{ theme.isDark() ? '☀️' : '🌙' }}
          </button>

          <!-- Notification Bell -->
          <a *ngIf="auth.isLoggedIn()" routerLink="/orders" class="notif-btn" title="Notifications">
            🔔
            <span *ngIf="notificationService.unreadCount() > 0" class="notif-badge">{{ notificationService.unreadCount() }}</span>
          </a>

          <a routerLink="/cart" class="cart-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span *ngIf="cart.totalItems() > 0" class="cart-badge">{{ cart.totalItems() }}</span>
          </a>
          <ng-container *ngIf="auth.isLoggedIn(); else guestNav">
            <div class="user-menu" tabindex="0">
              <div class="avatar">{{ auth.currentUser()?.fullName?.charAt(0)?.toUpperCase() }}</div>
              <span class="uname">{{ auth.currentUser()?.fullName?.split(' ')[0] }}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
              <div class="dropdown">
                <a routerLink="/orders"><span>📦</span> My Orders</a>
                <a routerLink="/wishlist"><span>❤️</span> Wishlist</a>
                <a routerLink="/profile"><span>👤</span> Profile & Addresses</a>
                <a routerLink="/returns"><span>↩️</span> Returns</a>
                <button (click)="auth.logout()"><span>🚪</span> Logout</button>
              </div>
            </div>
          </ng-container>
          <ng-template #guestNav>
            <a routerLink="/auth/login" class="btn-ghost">Login</a>
            <a routerLink="/auth/register" class="btn-solid">Register</a>
          </ng-template>
        </div>
      </div>
    </nav>

    <!-- Floating Comparison Bar -->
    <div class="compare-bar" *ngIf="comparison.count() > 0">
      <div class="compare-bar-inner">
        <div class="compare-thumbs">
          <div *ngFor="let p of comparison.products()" class="compare-thumb">
            <img [src]="p.imageUrl" [alt]="p.name" (error)="$any($event.target).src='https://placehold.co/48x48?text=P'">
            <button class="thumb-remove" (click)="comparison.remove(p.id)" title="Remove">✕</button>
          </div>
          <div *ngFor="let s of emptyCompareSlots" class="compare-thumb-empty">+</div>
        </div>
        <div class="compare-bar-actions">
          <span class="compare-count">{{ comparison.count() }}/4 selected</span>
          <a routerLink="/compare" class="btn-compare-now">Compare Now →</a>
          <button class="btn-compare-clear" (click)="comparison.clear()">Clear</button>
        </div>
      </div>
    </div>

    <app-chat-widget></app-chat-widget>

    <div class="toast-stack">
      <div *ngFor="let t of toasts.toasts()" [class]="'toast toast-' + t.type" (click)="toasts.dismiss(t.id)">
        <span class="t-dot"></span>
        <span class="t-msg">{{ t.message }}</span>
        <span class="t-close">✕</span>
      </div>
    </div>

    <main><router-outlet></router-outlet></main>

    <footer class="footer">
      <div class="footer-grid">
        <div>
          <div class="footer-logo">🛍️ ShopEase</div>
          <p class="footer-tagline">Your trusted destination for quality products, fast delivery, and exceptional service.</p>
          <div class="social-row">
            <span title="Facebook">📘</span>
            <span title="Instagram">📸</span>
            <span title="Twitter">🐦</span>
            <span title="YouTube">▶️</span>
          </div>
        </div>
        <div>
          <h4>Shop</h4>
          <a routerLink="/products">All Products</a>
          <a [routerLink]="['/products']" [queryParams]="{category:'Electronics'}">Electronics</a>
          <a [routerLink]="['/products']" [queryParams]="{category:'Clothing'}">Clothing</a>
          <a [routerLink]="['/products']" [queryParams]="{category:'Books'}">Books</a>
          <a [routerLink]="['/products']" [queryParams]="{category:'Home'}">Home & Kitchen</a>
        </div>
        <div>
          <h4>Account</h4>
          <a routerLink="/auth/login">Login</a>
          <a routerLink="/auth/register">Create Account</a>
          <a routerLink="/orders">My Orders</a>
          <a routerLink="/wishlist">Wishlist</a>
          <a routerLink="/profile">Profile & Addresses</a>
          <a routerLink="/returns">Returns</a>
          <a routerLink="/cart">My Cart</a>
        </div>
        <div>
          <h4>Contact Us</h4>
          <p>📧 support&#64;shopease.in</p>
          <p>📞 +91 98765 43210</p>
          <p>⏰ Mon–Sat, 9AM–6PM IST</p>
          <p>📍 Mumbai, Maharashtra</p>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2024 ShopEase Pvt. Ltd. All rights reserved.</span>
        <div class="pay-icons">
          <span>💳 Visa</span>
          <span>💳 Mastercard</span>
          <span>📱 UPI</span>
          <span>💵 COD</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; min-height: 100vh; }

    /* ── Navbar ── */
    .navbar {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      position: sticky; top: 0; z-index: 1000;
      box-shadow: 0 2px 24px rgba(0,0,0,0.35);
    }
    .nav-wrap {
      max-width: 1300px; margin: 0 auto; padding: 0 2rem;
      display: flex; align-items: center; height: 68px; gap: 2rem;
    }
    .brand { display: flex; align-items: center; gap: 0.55rem; text-decoration: none; flex-shrink: 0; }
    .brand-icon { font-size: 1.65rem; line-height: 1; }
    .brand-name { color: #a29bfe; font-size: 1.45rem; font-weight: 800; letter-spacing: -0.5px; }
    .nav-links { display: flex; gap: 0.15rem; }
    .nav-links a {
      color: rgba(255,255,255,0.6); text-decoration: none; font-size: 0.9rem; font-weight: 500;
      padding: 0.45rem 0.9rem; border-radius: 8px; transition: all 0.18s;
    }
    .nav-links a:hover, .nav-links a.active { color: #fff; background: rgba(255,255,255,0.09); }
    .admin-link { color: #f39c12 !important; }
    .admin-link:hover, .admin-link.active { background: rgba(243,156,18,0.15) !important; color: #f39c12 !important; }
    .nav-actions { display: flex; align-items: center; gap: 0.65rem; flex-shrink: 0; }

    /* ── Search Autocomplete ── */
    .search-wrap { position: relative; flex: 1; max-width: 400px; min-width: 0; }
    .search-bar {
      display: flex; align-items: center; gap: 0.5rem;
      background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.12);
      border-radius: 24px; padding: 0.42rem 0.75rem 0.42rem 1rem; transition: all 0.2s;
    }
    .search-bar:focus-within {
      background: rgba(255,255,255,0.13); border-color: #6c63ff;
      box-shadow: 0 0 0 3px rgba(108,99,255,0.18);
    }
    .search-bar svg { color: rgba(255,255,255,0.4); flex-shrink: 0; }
    .search-input {
      flex: 1; background: none; border: none; outline: none;
      color: #fff; font-size: 0.875rem; min-width: 0;
    }
    .search-input::placeholder { color: rgba(255,255,255,0.3); }
    .search-clear {
      background: none; border: none; color: rgba(255,255,255,0.4);
      cursor: pointer; padding: 0; font-size: 0.8rem; line-height: 1;
      transition: color 0.15s; flex-shrink: 0;
    }
    .search-clear:hover { color: rgba(255,255,255,0.85); }
    .search-dropdown {
      position: absolute; top: calc(100% + 8px); left: 0; right: 0;
      background: var(--bg-surface); border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.28), 0 0 0 1px var(--border);
      overflow: hidden; z-index: 2000;
      animation: searchFadeDown 0.18s ease;
    }
    @keyframes searchFadeDown {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .suggestion-item {
      display: flex; align-items: center; gap: 0.85rem;
      padding: 0.7rem 1rem; cursor: pointer; transition: background 0.13s;
      border-bottom: 1px solid var(--border);
    }
    .suggestion-item:last-of-type { border-bottom: none; }
    .suggestion-item:hover, .suggestion-item.active { background: var(--bg-chip); }
    .suggestion-img {
      width: 44px; height: 44px; object-fit: cover; border-radius: 8px;
      flex-shrink: 0; background: var(--bg-muted);
    }
    .suggestion-info { flex: 1; min-width: 0; }
    .suggestion-name {
      display: block; color: var(--text-body); font-size: 0.875rem; font-weight: 500;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .suggestion-cat { display: block; color: var(--text-muted); font-size: 0.75rem; margin-top: 2px; }
    .suggestion-price { color: #6c63ff; font-size: 0.875rem; font-weight: 700; flex-shrink: 0; }
    .suggestion-footer {
      padding: 0.65rem 1rem; color: #6c63ff; font-size: 0.82rem; font-weight: 600;
      cursor: pointer; background: rgba(108,99,255,0.06); transition: background 0.14s; text-align: center;
    }
    .suggestion-footer:hover { background: rgba(108,99,255,0.12); }
    .search-loading, .search-empty {
      padding: 1.2rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.875rem;
      display: flex; align-items: center; justify-content: center; gap: 0.6rem;
    }
    .search-spinner {
      display: inline-block; width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid var(--border); border-top-color: #6c63ff;
      animation: spin 0.7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .theme-btn {
      background: rgba(255,255,255,0.09); border: none; border-radius: 10px;
      padding: 0.5rem 0.65rem; font-size: 1rem; cursor: pointer;
      display: flex; align-items: center; transition: background 0.18s; line-height: 1;
    }
    .theme-btn:hover { background: rgba(255,255,255,0.16); }

    .notif-btn {
      position: relative; color: rgba(255,255,255,0.8); text-decoration: none;
      background: rgba(255,255,255,0.09); border-radius: 10px; padding: 0.5rem 0.65rem;
      display: flex; align-items: center; font-size: 1rem; transition: all 0.18s;
    }
    .notif-btn:hover { background: rgba(255,255,255,0.16); }
    .notif-badge {
      position: absolute; top: -6px; right: -6px;
      background: #f39c12; color: #fff; border-radius: 50%;
      width: 18px; height: 18px; font-size: 0.65rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #16213e;
    }
    .cart-btn {
      position: relative; color: rgba(255,255,255,0.8); text-decoration: none;
      background: rgba(255,255,255,0.09); border-radius: 10px; padding: 0.5rem 0.65rem;
      display: flex; align-items: center; transition: all 0.18s; line-height: 1;
    }
    .cart-btn:hover { background: rgba(255,255,255,0.16); color: #fff; }
    .cart-badge {
      position: absolute; top: -6px; right: -6px;
      background: #ff6b6b; color: #fff; border-radius: 50%;
      width: 18px; height: 18px; font-size: 0.65rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #16213e;
    }

    .user-menu {
      position: relative; display: flex; align-items: center; gap: 0.5rem;
      background: rgba(108,99,255,0.22); border-radius: 30px; padding: 0.38rem 0.9rem;
      cursor: pointer; transition: background 0.18s;
    }
    .user-menu:hover, .user-menu:focus-within { background: rgba(108,99,255,0.38); }
    .avatar {
      width: 28px; height: 28px; background: #6c63ff; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 0.78rem; font-weight: 700; flex-shrink: 0;
    }
    .uname { color: #fff; font-size: 0.875rem; font-weight: 500; }
    .dropdown {
      display: none; position: absolute; right: 0; top: calc(100% + 8px);
      background: var(--bg-surface); border-radius: 14px; min-width: 175px; overflow: hidden;
      box-shadow: 0 16px 50px rgba(0,0,0,0.22), 0 0 0 1px var(--border); z-index: 300;
    }
    .user-menu:hover .dropdown, .user-menu:focus-within .dropdown { display: block; }
    .dropdown a, .dropdown button {
      display: flex; align-items: center; gap: 0.6rem; width: 100%;
      padding: 0.85rem 1.2rem; color: var(--text-body); text-decoration: none; font-size: 0.875rem;
      background: none; border: none; cursor: pointer; text-align: left; transition: background 0.14s;
    }
    .dropdown a:hover, .dropdown button:hover { background: var(--bg-chip); color: #6c63ff; }

    .btn-ghost {
      color: rgba(255,255,255,0.72); text-decoration: none; font-size: 0.875rem; font-weight: 500;
      padding: 0.48rem 1.1rem; border: 1.5px solid rgba(255,255,255,0.22); border-radius: 20px;
      transition: all 0.18s;
    }
    .btn-ghost:hover { border-color: rgba(255,255,255,0.6); color: #fff; }
    .btn-solid {
      background: #6c63ff; color: #fff; text-decoration: none; font-size: 0.875rem; font-weight: 600;
      padding: 0.5rem 1.25rem; border-radius: 20px; transition: all 0.18s;
    }
    .btn-solid:hover { background: #5a52d5; transform: translateY(-1px); box-shadow: 0 4px 18px rgba(108,99,255,0.4); }

    /* ── Toasts ── */
    .toast-stack {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 9999;
      display: flex; flex-direction: column; gap: 0.55rem; pointer-events: none;
    }
    .toast {
      display: flex; align-items: center; gap: 0.75rem;
      background: var(--bg-surface); border-radius: 12px; padding: 0.9rem 1.1rem;
      box-shadow: 0 8px 30px var(--shadow-md), 0 0 0 1px var(--border);
      font-size: 0.875rem; font-weight: 500; color: var(--text-body);
      min-width: 240px; max-width: 340px; cursor: pointer; pointer-events: auto;
      animation: tIn .32s cubic-bezier(.21,1.02,.73,1) forwards;
    }
    .t-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .toast-success .t-dot { background: #00b894; }
    .toast-error .t-dot { background: #e17055; }
    .toast-info .t-dot { background: #0984e3; }
    .toast-success { border-left: 4px solid #00b894; }
    .toast-error { border-left: 4px solid #e17055; }
    .toast-info { border-left: 4px solid #0984e3; }
    .t-msg { flex: 1; }
    .t-close { color: #b2bec3; font-size: 0.75rem; flex-shrink: 0; }
    @keyframes tIn {
      from { transform: translateX(110%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    main { flex: 1; }

    /* ── Footer ── */
    .footer { background: #0f0f1a; color: rgba(255,255,255,0.65); margin-top: 0; }
    .footer-grid {
      max-width: 1300px; margin: 0 auto; padding: 4rem 2rem 2.5rem;
      display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 3rem;
    }
    .footer-logo { font-size: 1.4rem; font-weight: 800; color: #a29bfe; margin-bottom: 0.75rem; }
    .footer-tagline { font-size: 0.85rem; line-height: 1.7; color: rgba(255,255,255,0.38); max-width: 260px; }
    .social-row { display: flex; gap: 0.75rem; margin-top: 1.25rem; font-size: 1.25rem; }
    .footer-grid h4 { color: #fff; font-size: 0.825rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 1.1rem; }
    .footer-grid a { display: block; color: rgba(255,255,255,0.42); text-decoration: none; font-size: 0.875rem; margin-bottom: 0.65rem; transition: color 0.18s; }
    .footer-grid a:hover { color: #a29bfe; }
    .footer-grid p { font-size: 0.85rem; color: rgba(255,255,255,0.38); margin-bottom: 0.5rem; }
    .footer-bottom {
      max-width: 1300px; margin: 0 auto; padding: 1.5rem 2rem;
      border-top: 1px solid rgba(255,255,255,0.07);
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;
    }
    .footer-bottom span { font-size: 0.8rem; color: rgba(255,255,255,0.25); }
    .pay-icons { display: flex; gap: 0.75rem; font-size: 0.78rem; color: rgba(255,255,255,0.25); }

    @media (max-width: 1024px) {
      .footer-grid { grid-template-columns: 1fr 1fr; gap: 2rem; }
    }
    @media (max-width: 900px) {
      .nav-links { display: none; }
      .uname { display: none; }
    }
    @media (max-width: 600px) {
      .nav-wrap { padding: 0 1rem; gap: 0.75rem; }
      .btn-ghost { display: none; }
      .search-wrap { max-width: none; }
      .footer-grid { grid-template-columns: 1fr; gap: 1.5rem; padding: 2.5rem 1.25rem 1.5rem; }
    }

    /* ── Comparison Bar ── */
    .compare-bar {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 2000;
      background: #1a1a2e; border-top: 2px solid #6c63ff;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.3);
      animation: slideUp 0.25s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .compare-bar-inner {
      max-width: 1300px; margin: 0 auto; padding: 0.75rem 2rem;
      display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;
    }
    .compare-thumbs { display: flex; gap: 0.5rem; align-items: center; }
    .compare-thumb {
      position: relative; width: 48px; height: 48px; border-radius: 10px;
      overflow: visible; border: 2px solid #6c63ff;
    }
    .compare-thumb img {
      width: 48px; height: 48px; object-fit: cover; border-radius: 8px; display: block;
    }
    .thumb-remove {
      position: absolute; top: -8px; right: -8px;
      background: #e17055; color: #fff; border: none; border-radius: 50%;
      width: 18px; height: 18px; font-size: 0.6rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center; line-height: 1;
    }
    .compare-thumb-empty {
      width: 48px; height: 48px; border-radius: 10px;
      border: 2px dashed rgba(255,255,255,0.2); color: rgba(255,255,255,0.3);
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .compare-bar-actions { display: flex; align-items: center; gap: 0.75rem; margin-left: auto; }
    .compare-count { color: rgba(255,255,255,0.5); font-size: 0.82rem; }
    .btn-compare-now {
      padding: 0.55rem 1.4rem; background: #6c63ff; color: #fff; text-decoration: none;
      border-radius: 20px; font-size: 0.875rem; font-weight: 700; transition: all 0.18s;
    }
    .btn-compare-now:hover { background: #5a52d5; transform: translateY(-1px); }
    .btn-compare-clear {
      padding: 0.5rem 1rem; background: transparent; color: rgba(255,255,255,0.5);
      border: 1.5px solid rgba(255,255,255,0.2); border-radius: 20px;
      font-size: 0.82rem; cursor: pointer; transition: all 0.18s;
    }
    .btn-compare-clear:hover { border-color: #e17055; color: #e17055; }
    @media (max-width: 600px) {
      .compare-bar-inner { padding: 0.6rem 1rem; gap: 0.75rem; }
      .compare-thumb, .compare-thumb img { width: 38px; height: 38px; }
      .compare-thumb-empty { width: 38px; height: 38px; }
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  // Search state
  searchQuery = '';
  suggestions: Product[] = [];
  showDropdown = false;
  activeIndex = -1;
  searchLoading = false;

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  constructor(
    public auth: AuthService,
    public cart: CartService,
    public toasts: ToastService,
    public notificationService: NotificationService,
    public wishlistService: WishlistService,
    public comparison: ComparisonService,
    public theme: ThemeService,
    private productService: ProductService,
    private router: Router
  ) {
    this.theme.init();
  }

  get emptyCompareSlots(): number[] {
    return Array(4 - this.comparison.count()).fill(0);
  }

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.notificationService.load();
      this.wishlistService.loadWishlist();
    }

    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length < 2) {
          this.suggestions = [];
          this.showDropdown = false;
          this.searchLoading = false;
          return of([]);
        }
        this.searchLoading = true;
        return this.productService.getAll({ search: query.trim() }).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe((products: Product[]) => {
      this.searchLoading = false;
      this.suggestions = products.slice(0, 6);
      this.showDropdown = this.searchQuery.trim().length >= 2;
      this.activeIndex = -1;
    });
  }

  ngOnDestroy() {
    this.searchSub?.unsubscribe();
  }

  onSearchInput() {
    this.searchSubject.next(this.searchQuery);
  }

  onInputFocus() {
    if (this.searchQuery.trim().length >= 2 && this.suggestions.length > 0) {
      this.showDropdown = true;
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.showDropdown) {
      if (event.key === 'Enter' && this.searchQuery.trim()) this.submitSearch();
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.activeIndex = Math.min(this.activeIndex + 1, this.suggestions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.activeIndex = Math.max(this.activeIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.activeIndex >= 0 && this.suggestions[this.activeIndex]) {
          this.selectSuggestion(this.suggestions[this.activeIndex]);
        } else {
          this.submitSearch();
        }
        break;
      case 'Escape':
        this.closeDropdown();
        break;
    }
  }

  selectSuggestion(product: Product) {
    this.searchQuery = product.name;
    this.closeDropdown();
    this.router.navigate(['/products', product.id]);
  }

  submitSearch() {
    if (!this.searchQuery.trim()) return;
    this.closeDropdown();
    this.router.navigate(['/products'], { queryParams: { search: this.searchQuery.trim() } });
  }

  clearSearch() {
    this.searchQuery = '';
    this.suggestions = [];
    this.showDropdown = false;
  }

  closeDropdown() {
    this.showDropdown = false;
    this.activeIndex = -1;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.closeDropdown();
  }
}
