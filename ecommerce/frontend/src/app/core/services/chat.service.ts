import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ChatMessage } from '../models/chat.models';

const GUEST_SESSION_KEY = 'chat_guest_session';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly API = `${environment.apiUrl}/chat`;

  constructor(private http: HttpClient) {}

  private get guestHeaders(): HttpHeaders {
    return new HttpHeaders({ 'X-Chat-Session': this.getGuestSessionId() });
  }

  private getGuestSessionId(): string {
    let id = localStorage.getItem(GUEST_SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(GUEST_SESSION_KEY, id);
    }
    return id;
  }

  sendMessage(message: string) {
    return this.http.post<ChatMessage>(this.API, { message }, { headers: this.guestHeaders });
  }

  getHistory() {
    return this.http.get<ChatMessage[]>(`${this.API}/history`, { headers: this.guestHeaders });
  }
}
