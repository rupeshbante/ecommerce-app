import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ReturnRequest, CreateReturnRequest } from '../models/return.models';

@Injectable({ providedIn: 'root' })
export class ReturnService {
  private readonly API = `${environment.apiUrl}/returns`;

  constructor(private http: HttpClient) {}

  getMyReturns() { return this.http.get<ReturnRequest[]>(this.API); }
  createReturn(data: CreateReturnRequest) { return this.http.post<ReturnRequest>(this.API, data); }
}
