import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models/product.models';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-head">
        <div>
          <h1>Products</h1>
          <p>Manage your product catalog ({{ total }} products)</p>
        </div>
        <div class="head-actions">
          <button class="btn-outline" (click)="downloadTemplate()">⬇️ CSV Template</button>
          <label class="btn-outline" style="cursor:pointer">
            📤 Import CSV
            <input type="file" accept=".csv" (change)="importCsv($event)" style="display:none">
          </label>
          <button class="btn-primary" (click)="openAdd()">+ Add Product</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <input [(ngModel)]="search" (ngModelChange)="onFilterChange()" placeholder="🔍 Search products..." class="search-input">
        <select [(ngModel)]="catFilter" (ngModelChange)="onFilterChange()" class="sel">
          <option value="">All Categories</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
        <select [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()" class="sel">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <!-- Table -->
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th><th>Image</th><th>Name</th><th>Category</th>
                <th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngIf="loading"><td colspan="8" class="loading-row">Loading products...</td></tr>
              <tr *ngFor="let p of products">
                <td><strong>#{{ p.id }}</strong></td>
                <td><img [src]="p.imageUrl" [alt]="p.name" class="prod-thumb" (error)="$any($event.target).src='https://placehold.co/50x50?text=?'"></td>
                <td>
                  <div class="prod-name">{{ p.name }}</div>
                  <div class="prod-desc-sm">{{ p.description | slice:0:60 }}{{ p.description.length > 60 ? '…' : '' }}</div>
                </td>
                <td><span class="cat-chip">{{ p.category }}</span></td>
                <td><strong>₹{{ p.price | number }}</strong></td>
                <td>
                  <span [class]="p.stock <= 10 ? 'stock-low' : 'stock-ok'">{{ p.stock }}</span>
                </td>
                <td>
                  <span [class]="p.isActive ? 'badge-active' : 'badge-inactive'">
                    {{ p.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="btn-icon edit" (click)="openEdit(p)" title="Edit">✏️</button>
                    <button class="btn-icon media" (click)="openMedia(p)" title="Images & Variants">🖼️</button>
                    <button class="btn-icon toggle" (click)="toggleStatus(p)" [title]="p.isActive ? 'Deactivate' : 'Activate'">
                      {{ p.isActive ? '🔴' : '🟢' }}
                    </button>
                    <button class="btn-icon del" (click)="deleteProduct(p)" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!loading && products.length === 0">
                <td colspan="8" class="empty-row">No products found</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" *ngIf="total > pageSize">
          <button [disabled]="page === 1" (click)="changePage(page - 1)">Previous</button>
          <span>Page {{ page }} of {{ Math.ceil(total / pageSize) }}</span>
          <button [disabled]="page >= Math.ceil(total / pageSize)" (click)="changePage(page + 1)">Next</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h2>{{ editing ? 'Edit Product' : 'Add New Product' }}</h2>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="field full">
              <label>Product Name *</label>
              <input [(ngModel)]="form.name" placeholder="e.g. Laptop Pro 15&quot;">
            </div>
            <div class="field full">
              <label>Description *</label>
              <textarea [(ngModel)]="form.description" rows="3" placeholder="Product description..."></textarea>
            </div>
            <div class="field">
              <label>Price (₹) *</label>
              <input type="number" [(ngModel)]="form.price" placeholder="0">
            </div>
            <div class="field">
              <label>Stock *</label>
              <input type="number" [(ngModel)]="form.stock" placeholder="0">
            </div>
            <div class="field">
              <label>Category *</label>
              <select [(ngModel)]="form.category">
                <option value="">Select category</option>
                <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
              </select>
            </div>
            <div class="field" *ngIf="editing">
              <label>Status</label>
              <select [(ngModel)]="form.isActive">
                <option [ngValue]="true">Active</option>
                <option [ngValue]="false">Inactive</option>
              </select>
            </div>
          </div>

          <div class="image-section">
            <label>Product Image</label>
            <div class="image-upload-area">
              <div class="img-preview" *ngIf="form.imageUrl">
                <img [src]="form.imageUrl" alt="Preview" (error)="$any($event.target).src='https://placehold.co/200x150?text=Preview'">
                <button class="remove-img" (click)="form.imageUrl = ''">✕</button>
              </div>
              <div class="upload-placeholder" *ngIf="!form.imageUrl">
                <span>📷</span>
                <p>Upload or paste URL</p>
              </div>
            </div>
            <div class="img-options">
              <div class="url-input">
                <input [(ngModel)]="form.imageUrl" placeholder="Paste image URL..." class="url-field">
              </div>
              <div class="upload-btn-wrap">
                <label class="upload-label">
                  📁 Upload File
                  <input type="file" accept="image/*" (change)="onFileSelect($event)" hidden>
                </label>
                <span *ngIf="uploading" class="uploading">Uploading...</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" (click)="closeModal()">Cancel</button>
          <button class="btn-save" (click)="saveProduct()" [disabled]="saving">
            {{ saving ? 'Saving...' : (editing ? 'Update Product' : 'Add Product') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Images & Variants Modal -->
    <div class="modal-overlay" *ngIf="mediaProduct" (click)="closeMedia()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h2>{{ mediaProduct.name }} — Images &amp; Variants</h2>
          <button class="close-btn" (click)="closeMedia()">✕</button>
        </div>
        <div class="modal-body">
          <div class="media-section">
            <h4>Gallery Images</h4>
            <div class="gallery-grid" *ngIf="mediaImages.length">
              <div class="gallery-item" *ngFor="let img of mediaImages">
                <img [src]="img.url" (error)="$any($event.target).src='https://placehold.co/100x100?text=?'">
                <span *ngIf="img.isPrimary" class="primary-tag">Primary</span>
                <button class="gallery-del" (click)="removeImage(img)" title="Remove">✕</button>
              </div>
            </div>
            <p class="empty-hint" *ngIf="!mediaImages.length">No extra gallery images yet — main image is set from the product form.</p>
            <div class="add-row">
              <input [(ngModel)]="newImage.url" placeholder="Image URL" class="flex-input">
              <label class="chk"><input type="checkbox" [(ngModel)]="newImage.isPrimary"> Primary</label>
              <button class="btn-outline" (click)="addImage()" [disabled]="!newImage.url">+ Add</button>
            </div>
          </div>

          <div class="media-section">
            <h4>Variants (size / color etc.)</h4>
            <table class="variant-table" *ngIf="mediaVariants.length">
              <thead><tr><th>Name</th><th>Value</th><th>Price Δ</th><th>Stock</th><th>SKU</th><th>Active</th><th></th></tr></thead>
              <tbody>
                <tr *ngFor="let v of mediaVariants">
                  <td><input [(ngModel)]="v.name" class="cell-input"></td>
                  <td><input [(ngModel)]="v.value" class="cell-input"></td>
                  <td><input type="number" [(ngModel)]="v.priceModifier" class="cell-input narrow"></td>
                  <td><input type="number" [(ngModel)]="v.stock" class="cell-input narrow"></td>
                  <td><input [(ngModel)]="v.sku" class="cell-input"></td>
                  <td><input type="checkbox" [(ngModel)]="v.isActive"></td>
                  <td class="variant-actions">
                    <button class="btn-icon" (click)="saveVariant(v)" title="Save">💾</button>
                    <button class="btn-icon del" (click)="removeVariant(v)" title="Delete">🗑️</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p class="empty-hint" *ngIf="!mediaVariants.length">No variants yet.</p>
            <div class="add-row">
              <input [(ngModel)]="newVariant.name" placeholder="Name (e.g. Size)" class="flex-input">
              <input [(ngModel)]="newVariant.value" placeholder="Value (e.g. XL)" class="flex-input">
              <input type="number" [(ngModel)]="newVariant.priceModifier" placeholder="Price Δ" class="flex-input narrow">
              <input type="number" [(ngModel)]="newVariant.stock" placeholder="Stock" class="flex-input narrow">
              <input [(ngModel)]="newVariant.sku" placeholder="SKU" class="flex-input">
              <button class="btn-outline" (click)="addVariant()" [disabled]="!newVariant.name || !newVariant.value">+ Add</button>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn-cancel" (click)="closeMedia()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .page-wrap { display: flex; flex-direction: column; gap: 1.25rem; }
    .page-head { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .page-head h1 { font-size: 1.5rem; font-weight: 800; color: #1e2a38; }
    .page-head p { font-size: 0.85rem; color: #888; }
    .head-actions { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .btn-primary { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.25rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.18s; white-space: nowrap; }
    .btn-primary:hover { background: #5a52d5; }
    .btn-outline { background: #fff; color: #6c63ff; border: 1.5px solid #6c63ff; border-radius: 10px; padding: 0.6rem 1rem; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.18s; white-space: nowrap; }
    .btn-outline:hover { background: #f5f3ff; }

    .filters-bar { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 200px; padding: 0.6rem 1rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; }
    .search-input:focus { border-color: #6c63ff; }
    .sel { padding: 0.6rem 0.85rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; background: #fff; cursor: pointer; }

    .card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.85rem 1rem; border-bottom: 2px solid #f0f0f0; white-space: nowrap; background: #fafafa; }
    .data-table td { padding: 0.75rem 1rem; font-size: 0.875rem; color: #333; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f9f9ff; }
    .loading-row, .empty-row { text-align: center; color: #888; padding: 2.5rem !important; }
    .prod-thumb { width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid #eee; }
    .prod-name { font-weight: 600; color: #1e2a38; }
    .prod-desc-sm { font-size: 0.75rem; color: #aaa; margin-top: 0.1rem; }
    .cat-chip { background: #f0edff; color: #6c63ff; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px; }
    .stock-ok { color: #00b894; font-weight: 700; }
    .stock-low { color: #e17055; font-weight: 700; background: #fff5f5; padding: 0.15rem 0.5rem; border-radius: 5px; }
    .badge-active { background: #e8f5e9; color: #2e7d32; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 20px; }
    .badge-inactive { background: #f5f5f5; color: #999; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 20px; }
    .actions { display: flex; gap: 0.35rem; }
    .btn-icon { background: #f5f5f5; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; transition: all 0.18s; }
    .btn-icon:hover { transform: scale(1.12); }
    .btn-icon.del:hover { background: #fff0f0; }
    .btn-icon.edit:hover { background: #f0edff; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal { background: #fff; border-radius: 20px; width: 100%; max-width: 680px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 1.75rem; border-bottom: 1px solid #f0f0f0; }
    .modal-head h2 { font-size: 1.2rem; font-weight: 700; color: #1e2a38; }
    .close-btn { background: #f5f5f5; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; }
    .modal-body { padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field.full { grid-column: 1 / -1; }
    .field label { font-size: 0.8rem; font-weight: 600; color: #555; }
    .field input, .field select, .field textarea { padding: 0.65rem 0.85rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; transition: border-color 0.18s; background: #f9f9ff; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #6c63ff; background: #fff; }
    .field textarea { resize: vertical; }
    .image-section { display: flex; flex-direction: column; gap: 0.75rem; }
    .image-section label { font-size: 0.8rem; font-weight: 600; color: #555; }
    .image-upload-area { border: 2px dashed #e9ecef; border-radius: 12px; overflow: hidden; min-height: 120px; display: flex; align-items: center; justify-content: center; position: relative; }
    .img-preview { width: 100%; position: relative; }
    .img-preview img { width: 100%; max-height: 160px; object-fit: contain; display: block; }
    .remove-img { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(0,0,0,0.5); color: #fff; border: none; border-radius: 50%; width: 26px; height: 26px; cursor: pointer; font-size: 0.8rem; }
    .upload-placeholder { text-align: center; color: #aaa; }
    .upload-placeholder span { font-size: 2rem; }
    .upload-placeholder p { font-size: 0.8rem; margin-top: 0.25rem; }
    .img-options { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .url-field { flex: 1; min-width: 200px; padding: 0.6rem 0.85rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; }
    .url-field:focus { border-color: #6c63ff; }
    .upload-label { display: inline-flex; align-items: center; gap: 0.4rem; background: #f5f3ff; color: #6c63ff; border: 1.5px solid #e0dcff; border-radius: 10px; padding: 0.55rem 1rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
    .uploading { font-size: 0.8rem; color: #888; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1.25rem 1.75rem; border-top: 1px solid #f0f0f0; }
    .btn-cancel { background: #f5f5f5; border: none; border-radius: 10px; padding: 0.65rem 1.25rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; color: #666; }
    .btn-save { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.18s; }
    .btn-save:hover:not(:disabled) { background: #5a52d5; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: 1rem; padding: 1rem; font-size: 0.875rem; color: #555; border-top: 1px solid #f5f5f5; }
    .pagination button { background: #6c63ff; color: #fff; border: none; border-radius: 8px; padding: 0.4rem 1rem; cursor: pointer; font-size: 0.82rem; }
    .pagination button:disabled { background: #ccc; cursor: not-allowed; }

    /* Media modal */
    .media-section { border-bottom: 1px solid #f0f0f0; padding-bottom: 1.25rem; margin-bottom: 0.25rem; }
    .media-section:last-child { border-bottom: none; }
    .media-section h4 { font-size: 0.85rem; font-weight: 700; color: #1e2a38; margin-bottom: 0.75rem; }
    .empty-hint { font-size: 0.8rem; color: #aaa; margin-bottom: 0.75rem; }
    .gallery-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 0.75rem; }
    .gallery-item { position: relative; width: 80px; height: 80px; border-radius: 10px; overflow: hidden; border: 1px solid #eee; }
    .gallery-item img { width: 100%; height: 100%; object-fit: cover; }
    .primary-tag { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(108,99,255,0.85); color: #fff; font-size: 0.6rem; font-weight: 700; text-align: center; padding: 0.1rem 0; }
    .gallery-del { position: absolute; top: 0.2rem; right: 0.2rem; background: rgba(0,0,0,0.55); color: #fff; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 0.65rem; cursor: pointer; }
    .add-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
    .flex-input { flex: 1; min-width: 120px; padding: 0.55rem 0.75rem; border: 1.5px solid #e9ecef; border-radius: 8px; font-size: 0.82rem; outline: none; }
    .flex-input.narrow { flex: 0 0 90px; }
    .chk { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: #555; white-space: nowrap; }
    .variant-table { width: 100%; border-collapse: collapse; margin-bottom: 0.75rem; }
    .variant-table th { text-align: left; font-size: 0.68rem; font-weight: 700; color: #888; text-transform: uppercase; padding: 0.4rem 0.5rem; }
    .variant-table td { padding: 0.3rem 0.5rem; }
    .cell-input { width: 100%; padding: 0.4rem 0.5rem; border: 1.5px solid #e9ecef; border-radius: 6px; font-size: 0.8rem; outline: none; }
    .cell-input.narrow { width: 65px; }
    .variant-actions { display: flex; gap: 0.25rem; white-space: nowrap; }
  `]
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  loading = true; saving = false; uploading = false;
  showModal = false; editing = false;
  search = ''; catFilter = ''; statusFilter = '';
  page = 1; pageSize = 20; total = 0;
  Math = Math;
  private searchDebounce: any;
  categories = ['Electronics', 'Clothing', 'Books', 'Home', 'Footwear', 'Sports', 'Beauty', 'Toys'];
  form: any = this.emptyForm();

  mediaProduct: Product | null = null;
  mediaImages: any[] = [];
  mediaVariants: any[] = [];
  newImage = { url: '', isPrimary: false };
  newVariant = { name: '', value: '', priceModifier: 0, stock: 0, sku: '' };

  constructor(private adminService: AdminService, private toasts: ToastService) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    const isActive = this.statusFilter ? this.statusFilter === 'active' : undefined;
    this.adminService.getAdminProducts(this.page, this.pageSize, this.search || undefined, this.catFilter || undefined, isActive).subscribe({
      next: res => { this.products = res.data; this.total = res.total; this.loading = false; },
      error: () => this.loading = false
    });
  }

  changePage(p: number) { this.page = p; this.loadProducts(); }
  onFilterChange() {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => { this.page = 1; this.loadProducts(); }, 350);
  }

  emptyForm() {
    return { name: '', description: '', price: 0, stock: 0, category: '', imageUrl: '', isActive: true };
  }

  downloadTemplate() {
    this.adminService.downloadCsvTemplate().subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'products_import_template.csv'; a.click();
      URL.revokeObjectURL(url);
    });
  }

  importCsv(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.adminService.bulkImportProducts(file).subscribe({
      next: (res: any) => { this.toasts.success(res.message); this.loadProducts(); },
      error: (err) => this.toasts.error(err.error?.message ?? 'Import failed')
    });
    (event.target as HTMLInputElement).value = '';
  }

  openAdd() { this.form = this.emptyForm(); this.editing = false; this.showModal = true; }

  openEdit(p: Product) {
    this.form = { name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category, imageUrl: p.imageUrl, isActive: p.isActive, id: p.id };
    this.editing = true; this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  saveProduct() {
    if (!this.form.name || !this.form.category || this.form.price <= 0) {
      this.toasts.error('Please fill all required fields.'); return;
    }
    this.saving = true;
    const obs = this.editing
      ? this.adminService.updateProduct(this.form.id, this.form)
      : this.adminService.createProduct(this.form);
    obs.subscribe({
      next: () => {
        this.toasts.success(this.editing ? 'Product updated!' : 'Product added!');
        this.closeModal(); this.saving = false; this.loadProducts();
      },
      error: () => { this.toasts.error('Failed to save product.'); this.saving = false; }
    });
  }

  toggleStatus(p: Product) {
    this.adminService.updateProduct(p.id, { isActive: !p.isActive }).subscribe({
      next: () => { this.toasts.success(`Product ${p.isActive ? 'deactivated' : 'activated'}.`); this.loadProducts(); },
      error: () => this.toasts.error('Failed to update status.')
    });
  }

  deleteProduct(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    this.adminService.deleteProduct(p.id).subscribe({
      next: () => { this.toasts.success('Product deleted.'); this.loadProducts(); },
      error: () => this.toasts.error('Failed to delete product.')
    });
  }

  onFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading = true;
    this.adminService.uploadImage(file).subscribe({
      next: res => { this.form.imageUrl = res.url; this.uploading = false; this.toasts.success('Image uploaded!'); },
      error: () => { this.toasts.error('Upload failed.'); this.uploading = false; }
    });
  }

  openMedia(p: Product) {
    this.mediaProduct = p;
    this.newImage = { url: '', isPrimary: false };
    this.newVariant = { name: '', value: '', priceModifier: 0, stock: 0, sku: '' };
    this.adminService.getProductImages(p.id).subscribe(imgs => this.mediaImages = imgs);
    this.adminService.getProductVariants(p.id).subscribe(vars => this.mediaVariants = vars);
  }

  closeMedia() { this.mediaProduct = null; this.mediaImages = []; this.mediaVariants = []; }

  addImage() {
    if (!this.mediaProduct || !this.newImage.url) return;
    this.adminService.addProductImage(this.mediaProduct.id, { url: this.newImage.url, isPrimary: this.newImage.isPrimary, sortOrder: this.mediaImages.length }).subscribe({
      next: img => {
        if (img.isPrimary) this.mediaImages.forEach(i => i.isPrimary = false);
        this.mediaImages.push(img);
        this.newImage = { url: '', isPrimary: false };
        this.toasts.success('Image added.');
      },
      error: () => this.toasts.error('Failed to add image.')
    });
  }

  removeImage(img: any) {
    if (!this.mediaProduct) return;
    this.adminService.deleteProductImage(this.mediaProduct.id, img.id).subscribe({
      next: () => { this.mediaImages = this.mediaImages.filter(i => i.id !== img.id); },
      error: () => this.toasts.error('Failed to remove image.')
    });
  }

  addVariant() {
    if (!this.mediaProduct || !this.newVariant.name || !this.newVariant.value) return;
    this.adminService.addProductVariant(this.mediaProduct.id, this.newVariant).subscribe({
      next: v => {
        this.mediaVariants.push(v);
        this.newVariant = { name: '', value: '', priceModifier: 0, stock: 0, sku: '' };
        this.toasts.success('Variant added.');
      },
      error: () => this.toasts.error('Failed to add variant.')
    });
  }

  saveVariant(v: any) {
    if (!this.mediaProduct) return;
    this.adminService.updateProductVariant(this.mediaProduct.id, v.id, v).subscribe({
      next: () => this.toasts.success('Variant saved.'),
      error: () => this.toasts.error('Failed to save variant.')
    });
  }

  removeVariant(v: any) {
    if (!this.mediaProduct) return;
    if (!confirm(`Delete variant "${v.name}: ${v.value}"?`)) return;
    this.adminService.deleteProductVariant(this.mediaProduct.id, v.id).subscribe({
      next: () => { this.mediaVariants = this.mediaVariants.filter(x => x.id !== v.id); this.toasts.success('Variant deleted.'); },
      error: () => this.toasts.error('Failed to delete variant.')
    });
  }
}
