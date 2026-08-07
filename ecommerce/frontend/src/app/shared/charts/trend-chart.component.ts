import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Point { x: number; y: number; label: string; value: number; }

const VIEW_W = 600;
const VIEW_H = 220;
const PAD = { top: 16, right: 16, bottom: 28, left: 52 };

@Component({
  selector: 'app-trend-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trend-root" #root>
      <svg
        [attr.viewBox]="'0 0 ' + viewW + ' ' + viewH"
        preserveAspectRatio="none"
        class="trend-svg"
        role="img"
        [attr.aria-label]="ariaLabel"
      >
        <!-- gridlines + y ticks -->
        <g *ngFor="let t of yTicks">
          <line class="gridline" [attr.x1]="pad.left" [attr.x2]="viewW - pad.right" [attr.y1]="t.y" [attr.y2]="t.y" />
          <text class="axis-label" [attr.x]="pad.left - 8" [attr.y]="t.y" text-anchor="end" dominant-baseline="middle">{{ t.label }}</text>
        </g>

        <!-- baseline -->
        <line class="baseline" [attr.x1]="pad.left" [attr.x2]="viewW - pad.right" [attr.y1]="viewH - pad.bottom" [attr.y2]="viewH - pad.bottom" />

        <!-- area -->
        <path *ngIf="points.length > 1" class="area-fill" [attr.d]="areaPath" />

        <!-- line -->
        <path *ngIf="points.length > 1" class="line-stroke" [attr.d]="linePath" />
        <!-- single point fallback -->
        <circle *ngIf="points.length === 1" [attr.cx]="points[0].x" [attr.cy]="points[0].y" r="4" class="end-dot" />

        <!-- x axis labels (subset) -->
        <text *ngFor="let p of visibleXLabels" class="axis-label" [attr.x]="p.x" [attr.y]="viewH - pad.bottom + 18" text-anchor="middle">{{ p.label }}</text>

        <!-- end marker + value -->
        <ng-container *ngIf="points.length > 0">
          <circle [attr.cx]="lastPoint.x" [attr.cy]="lastPoint.y" r="4" class="end-dot" />
          <text [attr.x]="endLabelX" [attr.y]="lastPoint.y - 10" [attr.text-anchor]="endLabelAnchor" class="end-value">{{ format(lastPoint.value) }}</text>
        </ng-container>

        <!-- crosshair -->
        <g *ngIf="hoverIndex !== null">
          <line class="crosshair" [attr.x1]="hoverPoint!.x" [attr.x2]="hoverPoint!.x" [attr.y1]="pad.top" [attr.y2]="viewH - pad.bottom" />
          <circle [attr.cx]="hoverPoint!.x" [attr.cy]="hoverPoint!.y" r="4" class="hover-dot" />
        </g>

        <!-- hit layer -->
        <rect
          [attr.x]="pad.left" [attr.y]="0" [attr.width]="viewW - pad.left - pad.right" [attr.height]="viewH"
          class="hit-layer"
          tabindex="0"
          (pointermove)="onPointerMove($event)"
          (pointerleave)="onPointerLeave()"
          (keydown)="onKeydown($event)"
          (focus)="onFocus()"
        />
      </svg>

      <div class="tooltip" *ngIf="hoverIndex !== null" [style.left.%]="tooltipLeftPct" [class.flip]="tooltipLeftPct > 65">
        <div class="tt-value">{{ format(hoverPoint!.value) }}</div>
        <div class="tt-label">{{ hoverPoint!.label }}</div>
      </div>
    </div>
  `,
  styles: [`
    .trend-root { position: relative; width: 100%; }
    .trend-svg { width: 100%; height: 220px; display: block; overflow: visible; }
    .gridline { stroke: #e1e0d9; stroke-width: 1; }
    .baseline { stroke: #c3c2b7; stroke-width: 1; }
    .axis-label { fill: #898781; font-size: 10px; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
    .area-fill { fill: #2a78d6; fill-opacity: 0.1; stroke: none; }
    .line-stroke { fill: none; stroke: #2a78d6; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
    .end-dot { fill: #2a78d6; stroke: #fff; stroke-width: 2; }
    .end-value { fill: #0b0b0b; font-size: 11px; font-weight: 700; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
    .crosshair { stroke: #c3c2b7; stroke-width: 1; }
    .hover-dot { fill: #2a78d6; stroke: #fff; stroke-width: 2; }
    .hit-layer { fill: transparent; cursor: crosshair; outline: none; }
    .tooltip { position: absolute; top: 8px; transform: translateX(-50%); background: #0b0b0b; color: #fff; padding: 0.4rem 0.65rem; border-radius: 8px; pointer-events: none; white-space: nowrap; font-size: 0.78rem; }
    .tooltip.flip { transform: translateX(-70%); }
    .tt-value { font-weight: 700; font-size: 0.85rem; }
    .tt-label { color: rgba(255,255,255,0.7); font-size: 0.7rem; margin-top: 0.1rem; }
  `]
})
export class TrendChartComponent {
  @Input() data: { label: string; value: number }[] = [];
  @Input() valuePrefix = '₹';
  @Input() ariaLabel = 'Trend chart';
  @ViewChild('root') rootRef!: ElementRef<HTMLDivElement>;

  viewW = VIEW_W;
  viewH = VIEW_H;
  pad = PAD;
  hoverIndex: number | null = null;

  get maxValue(): number {
    return Math.max(...this.data.map(d => d.value), 1);
  }

  get niceMax(): number {
    const max = this.maxValue;
    const magnitude = Math.pow(10, Math.floor(Math.log10(max || 1)));
    const normalized = max / magnitude;
    const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return niceNormalized * magnitude;
  }

  get yTicks(): { y: number; label: string }[] {
    const max = this.niceMax;
    const innerH = this.viewH - this.pad.top - this.pad.bottom;
    return [0, 0.5, 1].map(f => ({
      y: this.viewH - this.pad.bottom - f * innerH,
      label: this.format(max * f)
    }));
  }

  get points(): Point[] {
    const n = this.data.length;
    if (n === 0) return [];
    const innerW = this.viewW - this.pad.left - this.pad.right;
    const innerH = this.viewH - this.pad.top - this.pad.bottom;
    const max = this.niceMax;
    return this.data.map((d, i) => ({
      x: this.pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW),
      y: this.viewH - this.pad.bottom - (d.value / max) * innerH,
      label: d.label,
      value: d.value
    }));
  }

  get lastPoint(): Point { return this.points[this.points.length - 1]; }

  get endLabelAnchor(): string {
    return this.lastPoint.x > this.viewW - 70 ? 'end' : 'middle';
  }

  get endLabelX(): number {
    return this.lastPoint.x > this.viewW - 70 ? this.lastPoint.x - 4 : this.lastPoint.x;
  }

  get linePath(): string {
    return this.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  get areaPath(): string {
    const pts = this.points;
    if (pts.length < 2) return '';
    const baseline = this.viewH - this.pad.bottom;
    const first = pts[0], last = pts[pts.length - 1];
    return `M ${first.x} ${baseline} ` + pts.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${last.x} ${baseline} Z`;
  }

  get visibleXLabels(): Point[] {
    const pts = this.points;
    if (pts.length <= 8) return pts;
    const step = Math.ceil(pts.length / 7);
    return pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  }

  get hoverPoint(): Point | null {
    return this.hoverIndex !== null ? this.points[this.hoverIndex] : null;
  }

  get tooltipLeftPct(): number {
    if (this.hoverIndex === null) return 50;
    return (this.hoverPoint!.x / this.viewW) * 100;
  }

  format(v: number): string {
    if (v >= 1000000) return `${this.valuePrefix}${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${this.valuePrefix}${(v / 1000).toFixed(1)}K`;
    return `${this.valuePrefix}${Math.round(v).toLocaleString('en-IN')}`;
  }

  private indexFromClientX(clientX: number): number {
    const el = this.rootRef.nativeElement.querySelector('svg')!;
    const rect = el.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round(pct * (this.points.length - 1));
  }

  onPointerMove(ev: PointerEvent) {
    if (this.points.length === 0) return;
    this.hoverIndex = this.indexFromClientX(ev.clientX);
  }

  onPointerLeave() { this.hoverIndex = null; }

  onFocus() { if (this.points.length > 0 && this.hoverIndex === null) this.hoverIndex = this.points.length - 1; }

  onKeydown(ev: KeyboardEvent) {
    if (this.points.length === 0) return;
    if (ev.key === 'ArrowLeft') {
      ev.preventDefault();
      this.hoverIndex = Math.max(0, (this.hoverIndex ?? this.points.length - 1) - 1);
    } else if (ev.key === 'ArrowRight') {
      ev.preventDefault();
      this.hoverIndex = Math.min(this.points.length - 1, (this.hoverIndex ?? 0) + 1);
    } else if (ev.key === 'Escape') {
      this.hoverIndex = null;
    }
  }
}
