import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ChatMessage } from '../models/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly API = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  sendMessage(message: string) {
    return this.http.post<ChatMessage>(this.API, { message });
  }

  getHistory() {
    return this.http.get<ChatMessage[]>(`${this.API}/history`);
  }
}
