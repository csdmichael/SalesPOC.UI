import { Injectable, signal } from '@angular/core';

interface ChatLaunchRequest {
  id: number;
  prompt: string;
}

@Injectable({ providedIn: 'root' })
export class ChatLauncherService {
  private nextRequestId = 0;
  readonly request = signal<ChatLaunchRequest | null>(null);

  launchPrompt(prompt: string): void {
    this.request.set({
      id: ++this.nextRequestId,
      prompt,
    });
  }
}