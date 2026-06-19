import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API = `${environment.apiUrl}/notifications`;
  private _notifications = signal<Notification[]>([]);

  notifications = this._notifications.asReadonly();
  unreadCount = computed(() => this._notifications().filter(n => !n.isRead).length);

  constructor(private http: HttpClient) {}

  load() {
    this.http.get<Notification[]>(this.API).subscribe({
      next: n => this._notifications.set(n),
      error: () => {}
    });
  }

  getAll() { return this.http.get<Notification[]>(this.API); }

  getUnreadCount() {
    return this.http.get<{ count: number }>(`${this.API}/unread-count`);
  }

  markRead(id: number) {
    return this.http.put(`${this.API}/${id}/read`, {}).subscribe(() => {
      this._notifications.update(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
    });
  }

  markAllRead() {
    return this.http.put(`${this.API}/read-all`, {}).subscribe(() => {
      this._notifications.update(ns => ns.map(n => ({ ...n, isRead: true })));
    });
  }
}
