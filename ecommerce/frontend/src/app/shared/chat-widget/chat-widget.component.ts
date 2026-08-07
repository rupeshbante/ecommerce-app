import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../core/services/chat.service';
import { ChatMessage } from '../../core/models/chat.models';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cw-panel" *ngIf="open">
      <div class="cw-header">
        <span>💬 ShopEase Support</span>
        <button class="cw-close" (click)="toggle()">✕</button>
      </div>
      <div class="cw-messages" #messagesEl>
        <div *ngIf="!historyLoaded" class="cw-loading">Loading...</div>
        <div *ngIf="historyLoaded && messages.length === 0" class="cw-empty">
          Hi! Ask me anything about your orders, returns, loyalty points, or referrals.
        </div>
        <div *ngFor="let m of messages" class="cw-bubble-row" [class.cw-row-user]="m.role === 'user'">
          <div class="cw-bubble" [class.cw-bubble-user]="m.role === 'user'">{{ m.content }}</div>
        </div>
        <div *ngIf="loading" class="cw-bubble-row">
          <div class="cw-bubble cw-typing">···</div>
        </div>
      </div>
      <form class="cw-input-row" (ngSubmit)="send()">
        <input [(ngModel)]="input" name="chatInput" placeholder="Type a message..." autocomplete="off" [disabled]="loading">
        <button type="submit" [disabled]="loading || !input.trim()">➤</button>
      </form>
    </div>

    <button class="cw-launcher" (click)="toggle()" [title]="open ? 'Close chat' : 'Chat with us'">
      {{ open ? '✕' : '💬' }}
    </button>
  `,
  styles: [`
    .cw-launcher {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 2100;
      width: 56px; height: 56px; border-radius: 50%; border: none;
      background: #6c63ff; color: #fff; font-size: 1.4rem; cursor: pointer;
      box-shadow: 0 8px 30px rgba(108,99,255,0.45);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.18s;
    }
    .cw-launcher:hover { transform: scale(1.06); }

    .cw-panel {
      position: fixed; bottom: calc(1.5rem + 68px); right: 1.5rem; z-index: 2100;
      width: 340px; max-width: calc(100vw - 2rem); height: 460px; max-height: calc(100vh - 8rem);
      background: var(--bg-surface, #fff); border-radius: 16px;
      box-shadow: 0 16px 60px rgba(0,0,0,0.3);
      display: flex; flex-direction: column; overflow: hidden;
      animation: cwSlideUp 0.22s ease;
    }
    @keyframes cwSlideUp {
      from { transform: translateY(16px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .cw-header {
      background: linear-gradient(135deg, #1a1a2e, #6c63ff); color: #fff;
      padding: 0.9rem 1.1rem; font-weight: 700; font-size: 0.9rem;
      display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
    }
    .cw-close { background: none; border: none; color: rgba(255,255,255,0.8); font-size: 0.9rem; cursor: pointer; }
    .cw-close:hover { color: #fff; }

    .cw-messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
    .cw-loading, .cw-empty { text-align: center; color: #888; font-size: 0.82rem; padding: 1.5rem 0.5rem; }

    .cw-bubble-row { display: flex; }
    .cw-row-user { justify-content: flex-end; }
    .cw-bubble {
      max-width: 78%; padding: 0.6rem 0.85rem; border-radius: 14px;
      background: #f0f2f5; color: #1e2a38; font-size: 0.85rem; line-height: 1.4;
      white-space: pre-wrap; word-break: break-word;
    }
    .cw-bubble-user { background: #6c63ff; color: #fff; }
    .cw-typing { font-weight: 700; letter-spacing: 2px; color: #888; }

    .cw-input-row {
      display: flex; gap: 0.5rem; padding: 0.75rem; border-top: 1px solid #eee; flex-shrink: 0;
    }
    .cw-input-row input {
      flex: 1; border: 1.5px solid #e9ecef; border-radius: 20px; padding: 0.55rem 0.9rem;
      font-size: 0.85rem; outline: none;
    }
    .cw-input-row input:focus { border-color: #6c63ff; }
    .cw-input-row button {
      width: 38px; height: 38px; border-radius: 50%; border: none;
      background: #6c63ff; color: #fff; cursor: pointer; flex-shrink: 0;
    }
    .cw-input-row button:disabled { background: #c5c1f5; cursor: not-allowed; }
  `]
})
export class ChatWidgetComponent implements AfterViewChecked {
  @ViewChild('messagesEl') private messagesEl?: ElementRef<HTMLDivElement>;

  open = false;
  historyLoaded = false;
  loading = false;
  input = '';
  messages: ChatMessage[] = [];
  private shouldScroll = false;

  constructor(private chatService: ChatService) {}

  ngAfterViewChecked() {
    if (this.shouldScroll && this.messagesEl) {
      this.messagesEl.nativeElement.scrollTop = this.messagesEl.nativeElement.scrollHeight;
      this.shouldScroll = false;
    }
  }

  toggle() {
    this.open = !this.open;
    if (this.open && !this.historyLoaded) {
      this.chatService.getHistory().subscribe({
        next: msgs => { this.messages = msgs; this.historyLoaded = true; this.shouldScroll = true; },
        error: () => { this.historyLoaded = true; }
      });
    }
  }

  send() {
    const text = this.input.trim();
    if (!text || this.loading) return;

    this.messages.push({ id: 0, role: 'user', content: text, createdAt: new Date().toISOString() });
    this.input = '';
    this.loading = true;
    this.shouldScroll = true;

    this.chatService.sendMessage(text).subscribe({
      next: reply => {
        this.messages.push(reply);
        this.loading = false;
        this.shouldScroll = true;
      },
      error: () => {
        this.messages.push({ id: 0, role: 'assistant', content: 'Something went wrong — please try again in a moment.', createdAt: new Date().toISOString() });
        this.loading = false;
        this.shouldScroll = true;
      }
    });
  }
}
