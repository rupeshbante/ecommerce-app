import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { CategoryItem } from '../../../core/models/admin.models';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">
      <div class="page-head">
        <div><h1>Categories</h1><p>Manage product categories & subcategories</p></div>
        <button class="btn-primary" (click)="openAdd()">+ Add Category</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Icon</th><th>Name</th><th>Parent</th><th>Products</th><th>Sub-cats</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              <tr *ngIf="loading"><td colspan="9" class="empty-row">Loading...</td></tr>
              <tr *ngFor="let c of categories">
                <td><strong>#{{ c.id }}</strong></td>
                <td class="icon-cell">{{ c.icon }}</td>
                <td>
                  <div class="cat-name">{{ c.name }}</div>
                  <div class="cat-desc">{{ c.description | slice:0:50 }}{{ c.description.length > 50 ? '…' : '' }}</div>
                </td>
                <td>{{ c.parentName || '—' }}</td>
                <td>{{ c.productCount }}</td>
                <td>{{ c.subCategoryCount }}</td>
                <td><span [class]="c.isActive ? 'badge-active' : 'badge-inactive'">{{ c.isActive ? 'Active' : 'Inactive' }}</span></td>
                <td>{{ c.createdAt }}</td>
                <td>
                  <div class="actions">
                    <button class="btn-icon" (click)="openEdit(c)" title="Edit">✏️</button>
                    <button class="btn-icon del" (click)="deleteCategory(c)" title="Delete">🗑️</button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!loading && categories.length === 0"><td colspan="9" class="empty-row">No categories found</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="showModal" (click)="closeModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-head">
          <h2>{{ editing ? 'Edit Category' : 'Add Category' }}</h2>
          <button class="close-btn" (click)="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="field"><label>Name *</label><input [(ngModel)]="form.name" placeholder="Category name"></div>
          <div class="field"><label>Description</label><textarea [(ngModel)]="form.description" rows="2" placeholder="Brief description..."></textarea></div>
          <div class="field"><label>Icon (emoji)</label><input [(ngModel)]="form.icon" placeholder="📦" maxlength="4"></div>
          <div class="field">
            <label>Parent Category</label>
            <select [(ngModel)]="form.parentId">
              <option [ngValue]="null">None (Top-level)</option>
              <option *ngFor="let c of parentOptions" [ngValue]="c.id">{{ c.icon }} {{ c.name }}</option>
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
        <div class="modal-foot">
          <button class="btn-cancel" (click)="closeModal()">Cancel</button>
          <button class="btn-save" (click)="save()" [disabled]="saving">{{ saving ? 'Saving...' : (editing ? 'Update' : 'Create') }}</button>
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
    .btn-primary { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.25rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; padding: 0.85rem 1rem; border-bottom: 2px solid #f0f0f0; background: #fafafa; white-space: nowrap; }
    .data-table td { padding: 0.75rem 1rem; font-size: 0.875rem; color: #333; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .data-table tr:hover td { background: #f9f9ff; }
    .empty-row { text-align: center; color: #888; padding: 2.5rem !important; }
    .icon-cell { font-size: 1.4rem; }
    .cat-name { font-weight: 600; color: #1e2a38; }
    .cat-desc { font-size: 0.75rem; color: #aaa; }
    .badge-active { background: #e8f5e9; color: #2e7d32; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 20px; }
    .badge-inactive { background: #f5f5f5; color: #999; font-size: 0.72rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 20px; }
    .actions { display: flex; gap: 0.35rem; }
    .btn-icon { background: #f5f5f5; border: none; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.9rem; transition: all 0.18s; }
    .btn-icon:hover { transform: scale(1.12); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal { background: #fff; border-radius: 20px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    .modal-head { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 1.75rem; border-bottom: 1px solid #f0f0f0; }
    .modal-head h2 { font-size: 1.2rem; font-weight: 700; color: #1e2a38; }
    .close-btn { background: #f5f5f5; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
    .modal-body { padding: 1.5rem 1.75rem; display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; }
    .field label { font-size: 0.8rem; font-weight: 600; color: #555; }
    .field input, .field select, .field textarea { padding: 0.65rem 0.85rem; border: 1.5px solid #e9ecef; border-radius: 10px; font-size: 0.875rem; outline: none; transition: border-color 0.18s; }
    .field input:focus, .field select:focus, .field textarea:focus { border-color: #6c63ff; }
    .modal-foot { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1.25rem 1.75rem; border-top: 1px solid #f0f0f0; }
    .btn-cancel { background: #f5f5f5; border: none; border-radius: 10px; padding: 0.65rem 1.25rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; color: #666; }
    .btn-save { background: #6c63ff; color: #fff; border: none; border-radius: 10px; padding: 0.65rem 1.5rem; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .btn-save:disabled { opacity: 0.6; }
  `]
})
export class AdminCategoriesComponent implements OnInit {
  categories: CategoryItem[] = [];
  loading = true; saving = false; showModal = false; editing = false;
  form: any = this.emptyForm();
  get parentOptions() { return this.categories.filter(c => !c.parentId); }

  constructor(private adminService: AdminService, private toasts: ToastService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.adminService.getCategories().subscribe({ next: c => { this.categories = c; this.loading = false; }, error: () => this.loading = false });
  }
  emptyForm() { return { name: '', description: '', icon: '📦', parentId: null, isActive: true }; }
  openAdd() { this.form = this.emptyForm(); this.editing = false; this.showModal = true; }
  openEdit(c: CategoryItem) { this.form = { name: c.name, description: c.description, icon: c.icon, parentId: c.parentId, isActive: c.isActive, id: c.id }; this.editing = true; this.showModal = true; }
  closeModal() { this.showModal = false; }

  save() {
    if (!this.form.name) { this.toasts.error('Name is required'); return; }
    this.saving = true;
    const obs = this.editing ? this.adminService.updateCategory(this.form.id, this.form) : this.adminService.createCategory(this.form);
    obs.subscribe({ next: () => { this.toasts.success(this.editing ? 'Category updated!' : 'Category created!'); this.closeModal(); this.saving = false; this.load(); }, error: () => { this.toasts.error('Failed.'); this.saving = false; } });
  }

  deleteCategory(c: CategoryItem) {
    if (!confirm(`Delete "${c.name}"?`)) return;
    this.adminService.deleteCategory(c.id).subscribe({ next: () => { this.toasts.success('Deleted.'); this.load(); }, error: () => this.toasts.error('Cannot delete — may have sub-categories.') });
  }
}
