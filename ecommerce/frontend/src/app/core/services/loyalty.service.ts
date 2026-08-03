import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { LoyaltyBalance, LoyaltyTransaction } from '../models/loyalty.models';

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly API = `${environment.apiUrl}/loyalty`;
  constructor(private http: HttpClient) {}

  getBalance() { return this.http.get<LoyaltyBalance>(`${this.API}/balance`); }
  getHistory() { return this.http.get<LoyaltyTransaction[]>(`${this.API}/history`); }
}
