import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Order, CreateOrder } from '../models/order.models';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly API = `${environment.apiUrl}/orders`;
  constructor(private http: HttpClient) {}
  getMyOrders() { return this.http.get<Order[]>(this.API); }
  getById(id: number) { return this.http.get<Order>(`${this.API}/${id}`); }
  createOrder(data: CreateOrder) { return this.http.post<Order>(this.API, data); }
  createGuestOrder(data: CreateOrder) { return this.http.post<Order>(`${this.API}/guest`, data); }
  getGuestOrder(id: number, email: string) {
    return this.http.get<Order>(`${this.API}/guest/${id}`, { params: { email } });
  }
}
