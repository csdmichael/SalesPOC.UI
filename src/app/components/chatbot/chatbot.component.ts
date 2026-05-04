import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, inject, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage, Citation } from '../../models/chat-message.model';
import { ChatService } from '../../services/chat.service';
import { ChatLauncherService } from '../../services/chat-launcher.service';
import { MarkdownPipe } from '../../pipes/markdown.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chatbot',
  imports: [CommonModule, FormsModule, MarkdownPipe],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatbotComponent {
  isOpen = false;
  messages: ChatMessage[] = [];
  userInput = '';
  sending = false;

  private readonly chatService = inject(ChatService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly chatLauncherService = inject(ChatLauncherService);
  private readonly blobUrlPattern = /^https?:\/\/[^"'\s]+\.blob\.core\.windows\.net\//i;
  private lastHandledRequestId = 0;
  private queuedPrompt: string | null = null;

  private readonly promptLaunchEffect = effect(() => {
    const request = this.chatLauncherService.request();
    if (!request || request.id === this.lastHandledRequestId) {
      return;
    }

    this.lastHandledRequestId = request.id;
    untracked(() => this.launchPrompt(request.prompt));
  });

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.ensureWelcomeMessage();
    }

    this.changeDetectorRef.markForCheck();
  }

  sendMessage(promptText?: string): void {
    const text = (promptText ?? this.userInput).trim();
    if (!text || this.sending) return;

    this.ensureChatOpen();
    this.messages.push({ role: 'user', content: text, timestamp: new Date() });
    this.userInput = '';
    this.sending = true;
    this.changeDetectorRef.markForCheck();

    this.chatService.sendMessage(text).subscribe({
      next: response => {
        this.messages.push({
          role: 'assistant',
          content: response.reply,
          timestamp: new Date(),
          citations: this.rewriteCitationUrls(response.citations)
        });
        this.finishSendCycle();
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date()
        });
        this.finishSendCycle();
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

  private launchPrompt(prompt: string): void {
    this.ensureChatOpen();
    if (this.sending) {
      this.queuedPrompt = prompt;
      this.userInput = prompt;
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.userInput = prompt;
    this.sendMessage(prompt);
  }

  private ensureChatOpen(): void {
    if (!this.isOpen) {
      this.isOpen = true;
    }

    this.ensureWelcomeMessage();
    this.changeDetectorRef.markForCheck();
  }

  private ensureWelcomeMessage(): void {
    if (this.messages.length === 0) {
      this.messages.push({
        role: 'assistant',
        content: 'Hi! I\'m the Sales Assistant. Ask me anything about sales data, customers, products, or orders.',
        timestamp: new Date()
      });
    }
  }

  private finishSendCycle(): void {
    this.sending = false;
    this.changeDetectorRef.markForCheck();

    if (this.queuedPrompt) {
      const queuedPrompt = this.queuedPrompt;
      this.queuedPrompt = null;
      this.sendMessage(queuedPrompt);
    }
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
      return `${environment.apiBaseUrl}/ProductDocuments/download?blobName=${encodeURIComponent(fileName)}`;
    } catch {
      return url;
    }
  }
}
