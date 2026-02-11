import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage, Citation } from '../../models/chat-message.model';
import { ChatService } from '../../services/chat.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent {
  isOpen = false;
  messages: ChatMessage[] = [];
  userInput = '';
  sending = false;

  private readonly blobUrlPattern = /^https?:\/\/[^"'\s]+\.blob\.core\.windows\.net\//i;

  constructor(private chatService: ChatService, private cdr: ChangeDetectorRef) {}

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.messages.push({
        role: 'assistant',
        content: 'Hi! I\'m the Sales Assistant. Ask me anything about sales data, customers, products, or orders.',
        timestamp: new Date()
      });
    }
  }

  sendMessage(): void {
    const text = this.userInput.trim();
    if (!text || this.sending) return;

    this.messages.push({ role: 'user', content: text, timestamp: new Date() });
    this.userInput = '';
    this.sending = true;

    this.chatService.sendMessage(text).subscribe({
      next: response => {
        this.messages.push({
          role: 'assistant',
          content: response.reply,
          timestamp: new Date(),
          citations: this.rewriteCitationUrls(response.citations)
        });
        this.sending = false;
        this.cdr.markForCheck();
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date()
        });
        this.sending = false;
        this.cdr.markForCheck();
      }
    });

    setTimeout(() => this.scrollToBottom(), 50);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    const el = document.querySelector('.chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }

  /** Rewrites any direct blob storage URLs in citations to use the backend proxy API. */
  private rewriteCitationUrls(citations?: Citation[]): Citation[] | undefined {
    if (!citations) return undefined;
    return citations.map(c => ({
      ...c,
      url: this.proxyBlobUrl(c.url)
    }));
  }

  private proxyBlobUrl(url: string): string {
    if (!url || !this.blobUrlPattern.test(url)) return url;
    try {
      const parsed = new URL(url);
      const segments = parsed.pathname.split('/').filter(s => s.length > 0);
      const fileName = segments.length > 1 ? segments.slice(1).join('/') : segments[0] || url;
      return `${environment.apiBaseUrl2}/ProductDocuments/download?fileName=${encodeURIComponent(fileName)}`;
    } catch {
      return url;
    }
  }
}
