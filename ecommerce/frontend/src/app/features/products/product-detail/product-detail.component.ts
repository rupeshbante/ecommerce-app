import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReviewService } from '../../../core/services/review.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { RecentlyViewedService } from '../../../core/services/recently-viewed.service';
import { ProductQAService } from '../../../core/services/product-qa.service';
import { Product, ProductVariant } from '../../../core/models/product.models';
import { Review, RatingSummary } from '../../../core/models/review.models';
import { ProductQuestion } from '../../../core/models/product-qa.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Skeleton -->
    <div *ngIf="loading" class="page-wrap">
      <div class="container">
        <div class="detail-grid">
          <div class="sk-img-big"></div>
          <div class="sk-body">
            <div class="sk-line sk-short" style="width:30%"></div>
            <div class="sk-line" style="width:70%;height:28px;margin:0.75rem 0"></div>
            <div class="sk-line" style="width:90%"></div>
            <div class="sk-line" style="width:80%"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Product detail -->
    <div *ngIf="!loading && product" class="page-wrap">
      <!-- Breadcrumb -->
      <div class="breadcrumb-bar">
        <div class="container bc-inner">
          <a routerLink="/">Home</a><span>/</span>
          <a routerLink="/products">Products</a><span>/</span>
          <a [routerLink]="['/products']" [queryParams]="{category: product.category}">{{ product.category }}</a>
          <span>/</span>
          <span class="current">{{ product.name }}</span>
        </div>
      </div>

      <div class="container">
        <div class="detail-grid">
          <!-- Image Gallery -->
          <div class="image-panel">
            <div class="img-wrap">
              <img [src]="activeImage" [alt]="product.name"
                   (error)="$any($event.target).src='https://placehold.co/600x500?text=Product'">
              <div *ngIf="product.stock === 0" class="oos-overlay"><span>Out of Stock</span></div>
              <span *ngIf="product.stock <= 5 && product.stock > 0" class="img-badge">Only {{ product.stock }} left!</span>

              <!-- Wishlist Button -->
              <button class="wish-btn" [class.wishlisted]="isWishlisted" (click)="toggleWishlist()" title="Add to Wishlist">
                {{ isWishlisted ? '♥' : '♡' }}
              </button>
            </div>

            <!-- Thumbnail Gallery -->
            <div class="thumb-row" *ngIf="allImages.length > 1">
              <div *ngFor="let img of allImages" class="thumb" [class.active]="img === activeImage" (click)="activeImage = img">
                <img [src]="img" (error)="$any($event.target).src='https://placehold.co/80x60?text=Img'">
              </div>
            </div>

            <div class="img-trust">
              <span>🔒 Secure</span>
              <span>🚚 Fast Ship</span>
              <span>↩️ 30-Day Return</span>
            </div>
          </div>

          <!-- Info panel -->
          <div class="info-panel">
            <span class="cat-chip">{{ product.category }}</span>
            <h1 class="prod-title">{{ product.name }}</h1>
            <div class="ratings-row">
              <span class="stars">{{ starDisplay(product.averageRating) }}</span>
              <span class="rating-num">{{ product.averageRating || 0 }}</span>
              <span class="review-count">({{ product.reviewCount }} reviews)</span>
              <span *ngIf="product.stock > 0" class="in-stock">✓ In Stock</span>
              <span *ngIf="product.stock === 0" class="out-stock">✕ Out of Stock</span>
            </div>
            <div class="price-row">
              <ng-container *ngIf="product.salePrice">
                <span class="price sale-price">₹{{ product.salePrice | number }}</span>
                <span class="mrp">₹{{ product.price | number }}</span>
                <span class="discount sale-badge">{{ saleDiscountPct }}% off</span>
              </ng-container>
              <ng-container *ngIf="!product.salePrice">
                <span class="price">₹{{ product.price | number }}</span>
                <span class="mrp">₹{{ (product.price * 1.15) | number:'1.0-0' }}</span>
                <span class="discount">15% off</span>
              </ng-container>
            </div>
            <div class="sale-countdown" *ngIf="product.salePrice && saleCountdown">
              ⏰ Flash Sale ends in: <strong>{{ saleCountdown }}</strong>
            </div>

            <div class="divider"></div>
            <p class="desc">{{ product.description }}</p>

            <!-- Variants -->
            <div *ngIf="variantGroups.size > 0" class="variants-section">
              <div *ngFor="let group of variantGroupKeys" class="variant-group">
                <label class="var-label">{{ group }}</label>
                <div class="var-options">
                  <button *ngFor="let v of variantGroups.get(group)" class="var-btn"
                    [class.selected]="selectedVariants.get(group) === v.id"
                    [class.out]="v.stock === 0"
                    [disabled]="v.stock === 0"
                    (click)="selectVariant(group, v)">
                    {{ v.value }}
                    <span *ngIf="v.priceModifier !== 0" class="price-diff">{{ v.priceModifier > 0 ? '+' : '' }}₹{{ v.priceModifier }}</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="highlights">
              <div class="hl-item"><span>📦</span> Free delivery on orders above ₹500</div>
              <div class="hl-item"><span>↩️</span> 30-day easy returns</div>
              <div class="hl-item"><span>✓</span> 100% genuine product</div>
              <div class="hl-item"><span>🔒</span> Secure payment — UPI, Cards, COD</div>
            </div>

            <div class="divider"></div>

            <!-- Quantity -->
            <div class="qty-section">
              <label>Quantity</label>
              <div class="qty-row">
                <div class="qty-ctrl">
                  <button (click)="changeQty(-1)" [disabled]="quantity <= 1">−</button>
                  <input type="number" [(ngModel)]="quantity" min="1" [max]="product.stock" (change)="clampQty()">
                  <button (click)="changeQty(1)" [disabled]="quantity >= product.stock">+</button>
                </div>
                <span class="stock-info">{{ product.stock }} units available</span>
              </div>
            </div>

            <div class="subtotal-row">
              <span>Subtotal</span>
              <strong>₹{{ (effectivePrice * quantity) | number }}</strong>
            </div>

            <div class="action-btns">
              <button class="btn-add" [disabled]="product.stock === 0" (click)="addToCart()">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                {{ product.stock === 0 ? 'Out of Stock' : 'Add to Cart' }}
              </button>
              <a routerLink="/cart" class="btn-buy" *ngIf="product.stock > 0" (click)="addToCart()">Buy Now</a>
            </div>

            <!-- Notify Me when Out of Stock -->
            <div *ngIf="product.stock === 0" class="notify-section">
              <ng-container *ngIf="!notifySent">
                <p class="notify-title">🔔 Get notified when back in stock</p>
                <div class="notify-row">
                  <input type="email" [(ngModel)]="notifyEmail" placeholder="your@email.com" class="notify-input">
                  <button class="btn-notify" [disabled]="notifyLoading || !notifyEmail" (click)="subscribeNotify()">
                    {{ notifyLoading ? 'Sending...' : 'Notify Me' }}
                  </button>
                </div>
              </ng-container>
              <div *ngIf="notifySent" class="notify-success">
                ✓ We'll email you when {{ product.name }} is back in stock!
              </div>
            </div>
          </div>
        </div>

        <!-- Reviews Section -->
        <div class="reviews-section">
          <div class="reviews-card">
            <h3>Customer Reviews</h3>
            <div class="review-summary" *ngIf="ratingSummary">
              <div class="review-score">{{ ratingSummary.averageRating || 0 }}</div>
              <div>
                <div class="stars-big">{{ starDisplay(ratingSummary.averageRating) }}</div>
                <p>Based on {{ ratingSummary.totalReviews }} verified reviews</p>
                <!-- Rating Breakdown -->
                <div class="rating-bars">
                  <div *ngFor="let star of [5,4,3,2,1]" class="rating-bar-row">
                    <span class="star-label">{{ star }}★</span>
                    <div class="bar-bg">
                      <div class="bar-fill" [style.width]="getBarWidth(star) + '%'"></div>
                    </div>
                    <span class="bar-count">{{ ratingSummary.ratingBreakdown[star] || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Write Review (logged in users) -->
            <div class="write-review" *ngIf="auth.isLoggedIn() && !userReview && !showReviewForm">
              <button class="btn-write-review" (click)="showReviewForm = true">Write a Review</button>
            </div>

            <div class="review-form" *ngIf="showReviewForm && !userReview">
              <h4>Your Review</h4>
              <div class="star-picker">
                <span *ngFor="let s of [1,2,3,4,5]" class="star-pick" [class.filled]="newReview.rating >= s" (click)="newReview.rating = s">★</span>
              </div>
              <input [(ngModel)]="newReview.title" placeholder="Review title" class="rev-input">
              <textarea [(ngModel)]="newReview.comment" rows="4" placeholder="Share your experience..." class="rev-textarea"></textarea>
              <div class="rev-form-actions">
                <button class="btn-submit-rev" (click)="submitReview()" [disabled]="submittingReview">
                  {{ submittingReview ? 'Submitting...' : 'Submit Review' }}
                </button>
                <button class="btn-cancel-rev" (click)="showReviewForm = false">Cancel</button>
              </div>
            </div>

            <div class="review-list">
              <div *ngIf="reviewsLoading" class="rev-loading">Loading reviews...</div>
              <div *ngIf="!reviewsLoading && reviews.length === 0 && !showReviewForm" class="no-reviews">
                <p>No reviews yet. Be the first to review!</p>
              </div>
              <div class="review-item" *ngFor="let r of reviews">
                <div class="rev-head">
                  <div class="rev-avatar">{{ r.userName.charAt(0) }}</div>
                  <div class="rev-meta">
                    <strong>{{ r.userName }}</strong>
                    <div class="rev-stars">{{ starDisplay(r.rating) }}</div>
                    <span *ngIf="r.isVerifiedPurchase" class="verified-badge">✓ Verified Purchase</span>
                  </div>
                  <span class="rev-date">{{ r.createdAt | date:'dd MMM yyyy' }}</span>
                </div>
                <p class="rev-title" *ngIf="r.title"><strong>{{ r.title }}</strong></p>
                <p class="rev-comment">{{ r.comment }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Q&A Section -->
        <div class="qa-section">
          <div class="qa-card">
            <h3>Questions & Answers</h3>

            <div class="ask-question" *ngIf="auth.isLoggedIn() && !showQuestionForm">
              <button class="btn-write-review" (click)="showQuestionForm = true">Ask a Question</button>
            </div>
            <p class="qa-login-hint" *ngIf="!auth.isLoggedIn()">Please <a routerLink="/auth/login">log in</a> to ask a question.</p>

            <div class="qa-form" *ngIf="showQuestionForm">
              <textarea [(ngModel)]="newQuestion" rows="3" placeholder="What would you like to know about this product?" class="rev-textarea"></textarea>
              <div class="rev-form-actions">
                <button class="btn-submit-rev" (click)="submitQuestion()" [disabled]="submittingQuestion">
                  {{ submittingQuestion ? 'Submitting...' : 'Submit Question' }}
                </button>
                <button class="btn-cancel-rev" (click)="showQuestionForm = false">Cancel</button>
              </div>
            </div>

            <div class="qa-list">
              <div *ngIf="qaLoading" class="rev-loading">Loading questions...</div>
              <div *ngIf="!qaLoading && questions.length === 0" class="no-reviews">
                <p>No questions yet. Ask the first one!</p>
              </div>
              <div class="qa-item" *ngFor="let q of questions">
                <div class="qa-question-row">
                  <span class="qa-q-icon">Q</span>
                  <div class="qa-q-body">
                    <p class="qa-q-text">{{ q.question }}</p>
                    <span class="qa-meta">{{ q.askerName }} · {{ q.createdAt | date:'dd MMM yyyy' }}</span>
                  </div>
                </div>

                <div class="qa-answer-row" *ngFor="let a of q.answers">
                  <span class="qa-a-icon">A</span>
                  <div class="qa-q-body">
                    <p class="qa-q-text">{{ a.answer }}</p>
                    <span class="qa-meta">{{ a.answererName }} (Store) · {{ a.createdAt | date:'dd MMM yyyy' }}</span>
                  </div>
                </div>

                <p class="qa-unanswered" *ngIf="q.answers.length === 0">Awaiting answer from the store.</p>

                <!-- Admin/Manager reply -->
                <div class="qa-reply-box" *ngIf="auth.isAdminOrManager()">
                  <input [(ngModel)]="replyDrafts[q.id]" placeholder="Write an official answer..." class="rev-input">
                  <button class="btn-submit-rev" (click)="submitAnswer(q)" [disabled]="answering === q.id">
                    {{ answering === q.id ? 'Posting...' : 'Post Answer' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div *ngIf="!loading && !product" class="not-found">
      <div class="nf-icon">😕</div>
      <h2>Product Not Found</h2>
      <p>The product you're looking for doesn't exist or has been removed.</p>
      <a routerLink="/products" class="btn-back">← Back to Products</a>
    </div>
  `,
  styles: [`
    :host { display: block; background: var(--bg-page); min-height: 100vh; }
    .page-wrap { padding-bottom: 4rem; }
    .container { max-width: 1300px; margin: 0 auto; padding: 0 2rem; }
    .sk-img-big { height: 500px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; border-radius: 20px; }
    .sk-body { display: flex; flex-direction: column; gap: 1rem; padding-top: 1rem; }
    .sk-line { height: 14px; border-radius: 6px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { to { background-position: -400% 0; } }
    .breadcrumb-bar { background: var(--bg-surface); border-bottom: 1px solid var(--border); padding: 0.9rem 2rem; }
    .bc-inner { max-width: 1300px; margin: 0 auto; display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; flex-wrap: wrap; }
    .bc-inner a { color: var(--text-muted); text-decoration: none; }
    .bc-inner a:hover { color: #6c63ff; }
    .bc-inner span { color: var(--text-faintest); }
    .current { color: var(--text-body); font-weight: 500; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3.5rem; align-items: start; padding: 2.5rem 0; }
    .image-panel { position: sticky; top: 84px; }
    .img-wrap { position: relative; border-radius: 20px; overflow: hidden; background: var(--bg-surface); box-shadow: 0 4px 30px var(--shadow-md); }
    .img-wrap img { width: 100%; height: 500px; object-fit: cover; display: block; }
    .oos-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; }
    .oos-overlay span { background: rgba(0,0,0,0.8); color: #fff; font-size: 1.1rem; font-weight: 700; padding: 0.75rem 1.5rem; border-radius: 10px; }
    .img-badge { position: absolute; top: 1rem; left: 1rem; background: #ff6b6b; color: #fff; font-size: 0.75rem; font-weight: 700; padding: 0.3rem 0.75rem; border-radius: 20px; }
    .wish-btn { position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 42px; height: 42px; font-size: 1.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.12); transition: transform 0.2s; color: #e17055; }
    .wish-btn:hover { transform: scale(1.15); }
    .wish-btn.wishlisted { color: #e17055; }
    .thumb-row { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
    .thumb { width: 68px; height: 68px; border-radius: 10px; overflow: hidden; cursor: pointer; border: 2px solid transparent; transition: border-color 0.18s; }
    .thumb.active { border-color: #6c63ff; }
    .thumb img { width: 100%; height: 100%; object-fit: cover; }
    .img-trust { display: flex; justify-content: center; gap: 1.5rem; margin-top: 1.25rem; flex-wrap: wrap; }
    .img-trust span { font-size: 0.8rem; color: #777; }
    .info-panel { display: flex; flex-direction: column; }
    .cat-chip { display: inline-block; background: #f0edff; color: #6c63ff; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 0.3rem 0.85rem; border-radius: 20px; margin-bottom: 0.9rem; width: fit-content; }
    .prod-title { font-size: 1.9rem; font-weight: 800; color: var(--text-primary); line-height: 1.25; margin-bottom: 1rem; }
    .ratings-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .stars { color: #f39c12; font-size: 1.1rem; }
    .rating-num { font-weight: 700; color: var(--text-body); font-size: 0.95rem; }
    .review-count { color: var(--text-muted); font-size: 0.875rem; }
    .in-stock { margin-left: 0.5rem; color: #00b894; font-size: 0.85rem; font-weight: 600; }
    .out-stock { margin-left: 0.5rem; color: #e17055; font-size: 0.85rem; font-weight: 600; }
    .price-row { display: flex; align-items: baseline; gap: 0.75rem; margin-bottom: 1.25rem; }
    .price { font-size: 2rem; font-weight: 800; color: var(--text-primary); }
    .mrp { font-size: 1rem; color: var(--text-faint); text-decoration: line-through; }
    .discount { background: #d4edda; color: #155724; font-size: 0.78rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; }
    .divider { border: none; border-top: 1px solid var(--border-light); margin: 1.25rem 0; }
    .desc { color: var(--text-secondary); font-size: 0.95rem; line-height: 1.75; margin-bottom: 1.5rem; }
    .variants-section { margin-bottom: 1.25rem; }
    .variant-group { margin-bottom: 1rem; }
    .var-label { display: block; font-size: 0.82rem; font-weight: 700; color: #555; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.6rem; }
    .var-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .var-btn { background: var(--bg-surface); border: 2px solid var(--border); border-radius: 10px; padding: 0.45rem 0.9rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.18s; color: var(--text-body); }
    .var-btn:hover:not(:disabled) { border-color: #6c63ff; color: #6c63ff; }
    .var-btn.selected { background: #6c63ff; border-color: #6c63ff; color: #fff; }
    .var-btn.out { opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }
    .price-diff { font-size: 0.72rem; color: inherit; margin-left: 0.3rem; }
    .highlights { display: flex; flex-direction: column; gap: 0.65rem; }
    .hl-item { display: flex; align-items: center; gap: 0.75rem; font-size: 0.875rem; color: #444; }
    .qty-section { margin-bottom: 0.75rem; }
    .qty-section label { display: block; font-size: 0.85rem; font-weight: 600; color: #555; margin-bottom: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .qty-row { display: flex; align-items: center; gap: 1rem; }
    .qty-ctrl { display: flex; align-items: center; border: 2px solid var(--border); border-radius: 12px; overflow: hidden; }
    .qty-ctrl button { width: 40px; height: 40px; background: var(--bg-surface2); border: none; cursor: pointer; font-size: 1.2rem; font-weight: 700; color: var(--text-body); transition: background 0.18s; }
    .qty-ctrl button:hover:not(:disabled) { background: #ebe7ff; color: #6c63ff; }
    .qty-ctrl button:disabled { color: var(--text-faintest); cursor: not-allowed; }
    .qty-ctrl input { width: 60px; text-align: center; border: none; border-left: 2px solid var(--border); border-right: 2px solid var(--border); height: 40px; font-size: 1rem; font-weight: 600; outline: none; background: var(--bg-surface); color: var(--text-body); }
    .stock-info { font-size: 0.8rem; color: var(--text-muted); }
    .subtotal-row { display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface2); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.95rem; color: var(--text-secondary); }
    .subtotal-row strong { font-size: 1.15rem; color: var(--text-primary); }
    .action-btns { display: flex; gap: 1rem; }
    .btn-add { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.6rem; background: #6c63ff; color: #fff; border: none; border-radius: 14px; padding: 0.95rem 1.5rem; font-size: 0.95rem; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-add:hover:not(:disabled) { background: #5a52d5; transform: translateY(-1px); box-shadow: 0 8px 24px rgba(108,99,255,0.38); }
    .btn-add:disabled { background: #ccc; cursor: not-allowed; }
    .btn-buy { flex: 1; display: flex; align-items: center; justify-content: center; background: #fff; color: #6c63ff; text-decoration: none; border-radius: 14px; padding: 0.95rem 1.5rem; font-size: 0.95rem; font-weight: 700; border: 2px solid #6c63ff; transition: all 0.2s; }
    .btn-buy:hover { background: #f5f3ff; }

    /* Reviews Section */
    .reviews-section { margin-top: 3rem; padding-top: 3rem; border-top: 1px solid #e9ecef; }
    .reviews-card { background: var(--bg-surface); border-radius: 20px; padding: 2rem; box-shadow: 0 2px 16px var(--shadow-sm); }
    .reviews-card h3 { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.5rem; }
    .review-summary { display: flex; align-items: flex-start; gap: 2rem; background: var(--bg-surface2); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .review-score { font-size: 3.5rem; font-weight: 800; color: var(--text-primary); }
    .stars-big { font-size: 1.4rem; color: #f39c12; }
    .review-summary p { font-size: 0.82rem; color: #888; margin-top: 0.25rem; }
    .rating-bars { margin-top: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem; }
    .rating-bar-row { display: flex; align-items: center; gap: 0.5rem; }
    .star-label { font-size: 0.75rem; color: #888; width: 22px; }
    .bar-bg { flex: 1; height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: #f39c12; border-radius: 4px; transition: width 0.5s; }
    .bar-count { font-size: 0.72rem; color: #888; width: 20px; }
    .write-review { margin-bottom: 1.5rem; }
    .btn-write-review { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.75rem 1.5rem; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
    .review-form { background: var(--bg-surface2); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .review-form h4 { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1rem; }
    .star-picker { display: flex; gap: 0.5rem; font-size: 2rem; color: #ddd; cursor: pointer; margin-bottom: 1rem; }
    .star-pick.filled { color: #f39c12; }
    .rev-input { width: 100%; border: 1.5px solid var(--border); border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.875rem; outline: none; margin-bottom: 0.75rem; font-family: inherit; background: var(--bg-input); color: var(--text-body); }
    .rev-input:focus { border-color: #6c63ff; }
    .rev-textarea { width: 100%; border: 1.5px solid var(--border); border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.875rem; outline: none; resize: vertical; font-family: inherit; margin-bottom: 1rem; background: var(--bg-input); color: var(--text-body); }
    .rev-textarea:focus { border-color: #6c63ff; }
    .rev-form-actions { display: flex; gap: 0.75rem; }
    .btn-submit-rev { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.5rem; font-weight: 600; cursor: pointer; }
    .btn-submit-rev:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-cancel-rev { background: var(--bg-surface2); color: var(--text-muted); border: 1.5px solid var(--border); border-radius: 10px; padding: 0.65rem 1.25rem; font-weight: 600; cursor: pointer; }
    .review-list { display: flex; flex-direction: column; gap: 1rem; }
    .rev-loading { color: #888; font-size: 0.9rem; }
    .no-reviews p { color: #888; font-size: 0.9rem; }
    .review-item { padding: 1.25rem; background: var(--bg-surface2); border-radius: 14px; }
    .rev-head { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.65rem; }
    .rev-avatar { width: 40px; height: 40px; background: #6c63ff; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .rev-meta { flex: 1; }
    .rev-meta strong { font-size: 0.9rem; color: #1a1a2e; display: block; }
    .rev-stars { color: #f39c12; font-size: 0.9rem; }
    .verified-badge { font-size: 0.72rem; color: #00b894; font-weight: 600; background: #e8f8f5; padding: 0.15rem 0.5rem; border-radius: 4px; }
    .rev-date { font-size: 0.75rem; color: #aaa; margin-left: auto; white-space: nowrap; }
    .rev-title { font-size: 0.9rem; font-weight: 700; color: #1a1a2e; margin-bottom: 0.35rem; }
    .rev-comment { font-size: 0.875rem; color: #555; line-height: 1.6; }

    /* Q&A Section */
    .qa-section { margin-top: 2rem; }
    .qa-card { background: var(--bg-surface); border-radius: 20px; padding: 2rem; box-shadow: 0 2px 16px var(--shadow-sm); }
    .qa-card h3 { font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 1.5rem; }
    .qa-login-hint { font-size: 0.85rem; color: #888; margin-bottom: 1rem; }
    .qa-login-hint a { color: #6c63ff; font-weight: 600; text-decoration: none; }
    .ask-question { margin-bottom: 1.5rem; }
    .qa-form { background: var(--bg-surface2); border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .qa-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .qa-item { padding: 1.25rem; background: var(--bg-surface2); border-radius: 14px; }
    .qa-question-row, .qa-answer-row { display: flex; align-items: flex-start; gap: 0.75rem; }
    .qa-answer-row { margin-top: 0.75rem; margin-left: 1.5rem; }
    .qa-q-icon, .qa-a-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; flex-shrink: 0; }
    .qa-q-icon { background: #6c63ff; color: #fff; }
    .qa-a-icon { background: #00b894; color: #fff; }
    .qa-q-body { flex: 1; }
    .qa-q-text { font-size: 0.9rem; color: #333; margin-bottom: 0.25rem; }
    .qa-meta { font-size: 0.75rem; color: #aaa; }
    .qa-unanswered { font-size: 0.8rem; color: #aaa; font-style: italic; margin: 0.5rem 0 0 2.5rem; }
    .qa-reply-box { display: flex; gap: 0.6rem; margin-top: 1rem; margin-left: 1.5rem; }
    .qa-reply-box .rev-input { margin-bottom: 0; flex: 1; }

    .not-found { text-align: center; padding: 7rem 2rem; }
    .nf-icon { font-size: 4rem; margin-bottom: 1rem; }
    .not-found h2 { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin-bottom: 0.5rem; }
    .not-found p { color: #888; margin-bottom: 2rem; }
    .btn-back { background: #6c63ff; color: #fff; text-decoration: none; padding: 0.8rem 1.75rem; border-radius: 10px; font-weight: 600; }

    @media (max-width: 960px) {
      .detail-grid { grid-template-columns: 1fr; gap: 2rem; }
      .image-panel { position: static; }
      .img-wrap img { height: 380px; }
    }
    @media (max-width: 600px) {
      .container { padding: 0 1rem; }
      .prod-title { font-size: 1.5rem; }
      .price { font-size: 1.6rem; }
      .action-btns { flex-direction: column; }
      .img-wrap img { height: 280px; }
      .review-summary { flex-direction: column; gap: 1rem; }
    }

    /* Flash Sale */
    .sale-price { color: #e17055; }
    .sale-badge { background: linear-gradient(135deg, #ff6348, #e84393); color: #fff; }
    .sale-countdown { background: linear-gradient(135deg, #fff8f5, #fff3ee); border: 1.5px solid #ffd5c8; border-radius: 10px; padding: 0.7rem 1rem; font-size: 0.875rem; color: #e17055; font-weight: 500; margin-bottom: 1.25rem; }
    .sale-countdown strong { font-weight: 800; font-size: 1rem; }

    /* Notify Me */
    .notify-section { background: #f7f8fc; border: 1.5px solid #e9ecef; border-radius: 14px; padding: 1.25rem; margin-top: 1rem; }
    .notify-title { font-size: 0.9rem; font-weight: 600; color: #1a1a2e; margin-bottom: 0.75rem; }
    .notify-row { display: flex; gap: 0.5rem; }
    .notify-input { flex: 1; padding: 0.75rem 1rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; background: #fff; }
    .notify-input:focus { border-color: #6c63ff; }
    .btn-notify { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.75rem 1.25rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.18s; }
    .btn-notify:hover:not(:disabled) { background: #5a52d5; }
    .btn-notify:disabled { opacity: 0.65; cursor: not-allowed; }
    .notify-success { color: #00b894; font-size: 0.9rem; font-weight: 600; }
  `]
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product?: Product;
  loading = true;
  quantity = 1;
  activeImage = '';
  allImages: string[] = [];

  reviews: Review[] = [];
  reviewsLoading = true;
  ratingSummary?: RatingSummary;
  userReview?: Review;
  showReviewForm = false;
  submittingReview = false;
  newReview = { rating: 5, title: '', comment: '' };

  isWishlisted = false;
  variantGroups = new Map<string, ProductVariant[]>();
  variantGroupKeys: string[] = [];
  selectedVariants = new Map<string, number>();
  selectedVariantPriceModifier = 0;

  notifyEmail = '';
  notifyLoading = false;
  notifySent = false;
  saleCountdown = '';
  private countdownInterval: any;

  questions: ProductQuestion[] = [];
  qaLoading = true;
  showQuestionForm = false;
  newQuestion = '';
  submittingQuestion = false;
  replyDrafts: Record<number, string> = {};
  answering: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService,
    private toasts: ToastService,
    private reviewService: ReviewService,
    private wishlistService: WishlistService,
    public auth: AuthService,
    private recentlyViewedService: RecentlyViewedService,
    private qaService: ProductQAService
  ) {}

  get effectivePrice(): number {
    const base = (this.product?.salePrice || this.product?.price) ?? 0;
    return base + this.selectedVariantPriceModifier;
  }

  get saleDiscountPct(): number {
    if (!this.product?.salePrice) return 0;
    return Math.round((1 - this.product.salePrice / this.product.price) * 100);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!isNaN(id)) {
        this.productService.getById(id).subscribe({
          next: p => {
            this.product = p;
            this.activeImage = p.imageUrl;
            this.allImages = [p.imageUrl, ...p.images.filter(i => i.url !== p.imageUrl).map(i => i.url)];
            this.buildVariantGroups(p.variants || []);
            this.loading = false;
            this.loadReviews(id);
            this.loadQuestions(id);
            if (this.auth.isLoggedIn()) this.checkWishlist(id);
            this.recentlyViewedService.add(p);
            if (p.salePrice && p.saleEndsAt) this.startCountdown(p.saleEndsAt);
          },
          error: () => { this.loading = false; this.toasts.error('Failed to load product.'); }
        });
      } else { this.loading = false; }
    });
  }

  ngOnDestroy() {
    clearInterval(this.countdownInterval);
  }

  startCountdown(endsAt: string) {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { this.saleCountdown = 'Sale ended'; clearInterval(this.countdownInterval); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      this.saleCountdown = `${h}h ${m}m ${s}s`;
    };
    update();
    this.countdownInterval = setInterval(update, 1000);
  }

  subscribeNotify() {
    if (!this.notifyEmail.trim() || !this.product) return;
    this.notifyLoading = true;
    const user = this.auth.currentUser();
    const userName = user?.fullName || this.notifyEmail.split('@')[0];
    this.productService.notifyMe(this.product.id, this.notifyEmail.trim(), userName).subscribe({
      next: () => { this.notifySent = true; this.notifyLoading = false; },
      error: () => { this.notifyLoading = false; this.toasts.error('Could not subscribe. Try again.'); }
    });
  }

  buildVariantGroups(variants: ProductVariant[]) {
    variants.forEach(v => {
      if (!this.variantGroups.has(v.name)) this.variantGroups.set(v.name, []);
      this.variantGroups.get(v.name)!.push(v);
    });
    this.variantGroupKeys = Array.from(this.variantGroups.keys());
  }

  selectVariant(groupName: string, variant: ProductVariant) {
    this.selectedVariants.set(groupName, variant.id);
    let mod = 0;
    this.selectedVariants.forEach((variantId, _) => {
      const v = this.product?.variants.find(x => x.id === variantId);
      if (v) mod += v.priceModifier;
    });
    this.selectedVariantPriceModifier = mod;
  }

  loadReviews(productId: number) {
    this.reviewService.getProductReviews(productId).subscribe(r => { this.reviews = r; this.reviewsLoading = false; });
    this.reviewService.getRatingSummary(productId).subscribe(s => this.ratingSummary = s);
    if (this.auth.isLoggedIn()) {
      this.reviewService.getMyReview(productId).subscribe({
        next: r => { this.userReview = r ?? undefined; },
        error: () => {}
      });
    }
  }

  checkWishlist(productId: number) {
    this.wishlistService.check(productId).subscribe(r => this.isWishlisted = r.isInWishlist);
  }

  toggleWishlist() {
    if (!this.auth.isLoggedIn()) { this.toasts.info('Please login to add to wishlist'); return; }
    this.wishlistService.toggle(this.product!.id).subscribe(r => {
      this.isWishlisted = r.added;
      this.toasts.success(r.message);
    });
  }

  submitReview() {
    if (!this.newReview.rating || !this.newReview.comment.trim()) { this.toasts.error('Please rate and write a comment'); return; }
    this.submittingReview = true;
    this.reviewService.createReview({ productId: this.product!.id, ...this.newReview }).subscribe({
      next: r => {
        this.reviews.unshift(r);
        this.userReview = r;
        this.showReviewForm = false;
        this.submittingReview = false;
        this.toasts.success('Review submitted! Thank you.');
        if (this.product) {
          this.product.reviewCount++;
          this.product.averageRating = Math.round((this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length) * 10) / 10;
        }
        this.reviewService.getRatingSummary(this.product!.id).subscribe(s => this.ratingSummary = s);
      },
      error: () => { this.submittingReview = false; this.toasts.error('Failed to submit review'); }
    });
  }

  loadQuestions(productId: number) {
    this.qaLoading = true;
    this.qaService.getForProduct(productId).subscribe({
      next: q => { this.questions = q; this.qaLoading = false; },
      error: () => { this.qaLoading = false; }
    });
  }

  submitQuestion() {
    if (!this.newQuestion.trim() || !this.product) return;
    this.submittingQuestion = true;
    this.qaService.ask(this.product.id, this.newQuestion.trim()).subscribe({
      next: q => {
        this.questions.unshift(q);
        this.newQuestion = '';
        this.showQuestionForm = false;
        this.submittingQuestion = false;
        this.toasts.success('Question submitted!');
      },
      error: () => { this.submittingQuestion = false; this.toasts.error('Failed to submit question'); }
    });
  }

  submitAnswer(q: ProductQuestion) {
    const answer = (this.replyDrafts[q.id] || '').trim();
    if (!answer) return;
    this.answering = q.id;
    this.qaService.answer(q.id, answer).subscribe({
      next: updated => {
        this.questions = this.questions.map(x => x.id === updated.id ? updated : x);
        this.replyDrafts[q.id] = '';
        this.answering = null;
        this.toasts.success('Answer posted!');
      },
      error: () => { this.answering = null; this.toasts.error('Failed to post answer'); }
    });
  }

  getBarWidth(star: number): number {
    if (!this.ratingSummary || !this.ratingSummary.totalReviews) return 0;
    return ((this.ratingSummary.ratingBreakdown[star] || 0) / this.ratingSummary.totalReviews) * 100;
  }

  starDisplay(rating: number): string {
    const full = Math.round(rating || 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  }

  changeQty(delta: number) { this.quantity = Math.max(1, Math.min(this.product?.stock ?? 1, this.quantity + delta)); }
  clampQty() { this.quantity = Math.max(1, Math.min(this.product?.stock ?? 1, this.quantity || 1)); }

  addToCart() {
    if (this.product) {
      this.cartService.addToCart(this.product, this.quantity);
      this.toasts.success(`${this.product.name} × ${this.quantity} added to cart!`);
    }
  }
}
