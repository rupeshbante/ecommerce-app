import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _dark = signal(this.getStored());
  isDark = this._dark.asReadonly();

  init() {
    document.documentElement.setAttribute('data-theme', this._dark() ? 'dark' : 'light');
  }

  toggle() {
    const next = !this._dark();
    this._dark.set(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    try { localStorage.setItem('shopease_theme', next ? 'dark' : 'light'); } catch {}
  }

  private getStored(): boolean {
    try { return localStorage.getItem('shopease_theme') === 'dark'; }
    catch { return false; }
  }
}
