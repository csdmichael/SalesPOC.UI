import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatMessage } from '../../models/chat-message.model';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrl: './chatbot.component.scss'
})
export class ChatbotComponent {
  isOpen = false;
  messages: ChatMessage[] = [];
  userInput = '';
  sending = false;

  constructor(private chatService: ChatService) {}

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && this.messages.length === 0) {
      this.messages.push({
        role: 'assistant',
        content: 'Hi! I\'m the Arrow Sales Assistant. Ask me anything about sales data, customers, products, or orders.',
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
      next: reply => {
        this.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
        this.sending = false;
        setTimeout(() => this.scrollToBottom(), 50);
      },
      error: () => {
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date()
        });
        this.sending = false;
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
}
