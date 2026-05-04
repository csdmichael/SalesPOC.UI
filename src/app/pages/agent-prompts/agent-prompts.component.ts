import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatLauncherService } from '../../services/chat-launcher.service';

interface PromptItem {
  text: string;
  copied: boolean;
  launched: boolean;
}

interface PromptCategory {
  title: string;
  icon: string;
  color: string;
  description: string;
  prompts: PromptItem[];
}

@Component({
  selector: 'app-agent-prompts',
  imports: [CommonModule],
  templateUrl: './agent-prompts.component.html',
  styleUrl: './agent-prompts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentPromptsComponent {
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly chatLauncherService = inject(ChatLauncherService);

  categories: PromptCategory[] = [
    {
      title: 'Basic',
      icon: '🟢',
      color: '#16a34a',
      description: 'Simple queries to get started with the Sales Assistant',
      prompts: [
        { text: 'List Products', copied: false, launched: false },
        { text: 'List Customers', copied: false, launched: false }
      ]
    },
    {
      title: 'Medium',
      icon: '🟡',
      color: '#ca8a04',
      description: 'Intermediate queries with filters and aggregations',
      prompts: [
        { text: 'List Products of category as Sensor', copied: false, launched: false },
        { text: 'What is description of chip-16?', copied: false, launched: false },
        { text: 'Plot top 10 products by price on a bar chart', copied: false, launched: false },
        { text: 'How many units did Sales Rep 10 sell?', copied: false, launched: false },
        { text: 'How many orders did customer 3 cancel?', copied: false, launched: false }
      ]
    },
    {
      title: 'Advanced',
      icon: '🔴',
      color: '#dc2626',
      description: 'Complex multi-step queries combining multiple data sources',
      prompts: [
        { text: 'What is product description for Chip-50? Also retrieve Sales One Pager, Datasheet and market brief documentation. Finally check its unit price and status of its life cycle', copied: false, launched: false },
        { text: 'From Sales Facts, show top 3 Research Customers by Line Total in West Region', copied: false, launched: false },
        { text: 'What is total amount for Sales Orders for Customer 1 that are confirmed? List them.', copied: false, launched: false },
        { text: 'Plot a bar chart for orders by total for Customer 1. Exclude cancelled orders', copied: false, launched: false }
      ]
    }
  ];

  async copyToClipboard(prompt: PromptItem): Promise<void> {
    try {
      await navigator.clipboard.writeText(prompt.text);
      this.setCopiedState(prompt, true);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = prompt.text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.setCopiedState(prompt, true);
    }
  }

  launchPrompt(prompt: PromptItem): void {
    this.chatLauncherService.launchPrompt(prompt.text);
    prompt.launched = true;
    this.changeDetectorRef.markForCheck();
    setTimeout(() => {
      prompt.launched = false;
      this.changeDetectorRef.markForCheck();
    }, 2000);
  }

  private setCopiedState(prompt: PromptItem, copied: boolean): void {
    prompt.copied = copied;
    this.changeDetectorRef.markForCheck();
    if (copied) {
      setTimeout(() => {
        prompt.copied = false;
        this.changeDetectorRef.markForCheck();
      }, 2000);
    }
  }
}
