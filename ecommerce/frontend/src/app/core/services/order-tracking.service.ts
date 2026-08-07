import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface OrderStatusUpdate {
  orderId: number;
  status: string;
  trackingNumber?: string;
  carrier?: string;
  changedAt: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderTrackingService {
  private readonly hubUrl = `${environment.apiUrl.replace(/\/api$/, '')}/hubs/notifications`;
  private connection: signalR.HubConnection | null = null;
  private joinedOrderId: number | null = null;

  private statusUpdate$ = new Subject<OrderStatusUpdate>();
  updates = this.statusUpdate$.asObservable();

  constructor(private auth: AuthService) {}

  private async ensureConnected(): Promise<signalR.HubConnection> {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (!this.connection) {
      const token = this.auth.getToken();
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(this.hubUrl, { accessTokenFactory: () => token ?? '' })
        .withAutomaticReconnect()
        .build();

      this.connection.on('OrderStatusUpdated', (update: OrderStatusUpdate) => {
        this.statusUpdate$.next(update);
      });

      this.connection.onreconnected(() => {
        if (this.joinedOrderId != null) this.connection!.invoke('JoinOrderGroup', this.joinedOrderId).catch(() => {});
      });
    }

    if (this.connection.state === signalR.HubConnectionState.Disconnected) {
      await this.connection.start();
    }
    return this.connection;
  }

  async trackOrder(orderId: number): Promise<void> {
    try {
      const conn = await this.ensureConnected();
      this.joinedOrderId = orderId;
      await conn.invoke('JoinOrderGroup', orderId);
    } catch {
      // Live tracking is a progressive enhancement — order data already loaded via HTTP.
    }
  }

  async stopTracking(orderId: number): Promise<void> {
    this.joinedOrderId = null;
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      try { await this.connection.invoke('LeaveOrderGroup', orderId); } catch {}
    }
  }
}
