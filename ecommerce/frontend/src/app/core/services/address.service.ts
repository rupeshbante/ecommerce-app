import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Address, CreateAddress } from '../models/address.models';

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly API = `${environment.apiUrl}/addresses`;

  constructor(private http: HttpClient) {}

  getAll() { return this.http.get<Address[]>(this.API); }
  create(data: CreateAddress) { return this.http.post<Address>(this.API, data); }
  update(id: number, data: CreateAddress) { return this.http.put<Address>(`${this.API}/${id}`, data); }
  delete(id: number) { return this.http.delete(`${this.API}/${id}`); }
  setDefault(id: number) { return this.http.put(`${this.API}/${id}/set-default`, {}); }
}
