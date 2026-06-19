import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReferralService {
  private readonly API = `${environment.apiUrl}/referral`;
  constructor(private http: HttpClient) {}

  getMyCode() { return this.http.get<{ code: string }>(`${this.API}/my-code`); }
  getMyReferrals() { return this.http.get<any[]>(`${this.API}/my-referrals`); }
  getStats() { return this.http.get<any>(`${this.API}/stats`); }
  applyCode(code: string) { return this.http.post(`${this.API}/apply`, { code }); }
}
