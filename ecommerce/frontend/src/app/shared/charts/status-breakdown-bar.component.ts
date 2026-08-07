import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Segment { status: string; count: number; pct: number; color: string; }

// Fixed order + reserved colors, matching this app's existing status-badge palette elsewhere.
// Cancelled sits first rather than last so its red never sits directly beside Delivered's
// green — adjacent red/green fails CVD separation (validated via the dataviz skill's
// validate_palette.js); every other adjacent pair in this order passes.
const STATUS_ORDER = ['Cancelled', 'Pending', 'Processing', 'Shipped', 'Delivered'];
const STATUS_COLOR: Record<string, string> = {
  Pending: '#f39c12',
  Processing: '#1976d2',
  Shipped: '#00b894',
  Delivered: '#2e7d32',
  Cancelled: '#c62828',
};
const FALLBACK_COLOR = '#898781';

@Component({
  selector: 'app-status-breakdown-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sb-root">
      <div class="sb-bar" *ngIf="total > 0">
        <div
          *ngFor="let s of segments"
          class="sb-seg"
          [style.flexGrow]="s.count"
          [style.background]="s.color"
          [class.hovered]="hovered === s.status"
          tabindex="0"
          (pointerenter)="hovered = s.status"
          (pointerleave)="hovered = null"
          (focus)="hovered = s.status"
          (blur)="hovered = null"
        >
          <span class="sb-inline-label" *ngIf="s.pct >= 12">{{ s.count }}</span>
          <div class="sb-tooltip" *ngIf="hovered === s.status">
            <div class="tt-value">{{ s.count }} order{{ s.count !== 1 ? 's' : '' }}</div>
            <div class="tt-label">{{ s.status }} · {{ s.pct.toFixed(0) }}%</div>
          </div>
        </div>
      </div>
      <div class="sb-empty" *ngIf="total === 0">No orders yet</div>

      <div class="sb-legend">
        <div class="sb-legend-item" *ngFor="let s of segments">
          <span class="sb-swatch" [style.background]="s.color"></span>
          <span class="sb-legend-label">{{ s.status }}</span>
          <span class="sb-legend-count">{{ s.count }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sb-root { display: flex; flex-direction: column; gap: 1rem; }
    .sb-bar { display: flex; gap: 2px; height: 32px; border-radius: 4px; overflow: hidden; background: #fcfcfb; }
    .sb-seg { position: relative; display: flex; align-items: center; justify-content: center; min-width: 6px; transition: filter 0.15s; cursor: pointer; outline: none; }
    .sb-seg.hovered, .sb-seg:focus-visible { filter: brightness(1.08); }
    .sb-inline-label { color: #fff; font-size: 0.75rem; font-weight: 700; }
    .sb-tooltip { position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); background: #0b0b0b; color: #fff; padding: 0.4rem 0.65rem; border-radius: 8px; white-space: nowrap; font-size: 0.78rem; z-index: 2; pointer-events: none; }
    .tt-value { font-weight: 700; font-size: 0.85rem; }
    .tt-label { color: rgba(255,255,255,0.7); font-size: 0.7rem; margin-top: 0.1rem; }
    .sb-empty { text-align: center; color: #898781; font-size: 0.85rem; padding: 0.75rem; }
    .sb-legend { display: flex; flex-wrap: wrap; gap: 0.9rem 1.25rem; }
    .sb-legend-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; }
    .sb-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
    .sb-legend-label { color: #52514e; }
    .sb-legend-count { color: #0b0b0b; font-weight: 700; }
  `]
})
export class StatusBreakdownBarComponent {
  @Input() set data(rows: { status: string; count: number }[]) {
    const total = rows.reduce((s, r) => s + r.count, 0);
    const byStatus = new Map(rows.map(r => [r.status, r.count]));
    const ordered = [
      ...STATUS_ORDER.filter(s => byStatus.has(s)),
      ...rows.map(r => r.status).filter(s => !STATUS_ORDER.includes(s)),
    ];
    this.segments = ordered.map(status => {
      const count = byStatus.get(status) ?? 0;
      return { status, count, pct: total > 0 ? (count / total) * 100 : 0, color: STATUS_COLOR[status] ?? FALLBACK_COLOR };
    }).filter(s => s.count > 0);
    this.total = total;
  }

  segments: Segment[] = [];
  total = 0;
  hovered: string | null = null;
}
