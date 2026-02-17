import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonMenuButton, IonButtons } from '@ionic/angular/standalone';

interface PromptItem {
  text: string;
  copied: boolean;
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
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonMenuButton, IonButtons],
  templateUrl: './agent-prompts.component.html',
  styleUrl: './agent-prompts.component.scss'
})
export class AgentPromptsComponent {
  categories: PromptCategory[] = [
    {
      title: 'Basic',
      icon: '🟢',
      color: '#16a34a',
      description: 'Simple queries to get started with the Sales Assistant',
      prompts: [
        { text: 'List Products', copied: false },
        { text: 'List Customers', copied: false }
      ]
    },
    {
      title: 'Medium',
      icon: '🟡',
      color: '#ca8a04',
      description: 'Intermediate queries with filters and aggregations',
      prompts: [
        { text: 'List Products of category as Sensor', copied: false },
        { text: 'What is description of chip-16?', copied: false },
        { text: 'Plot top 10 products by price on a bar chart', copied: false },
        { text: 'How many units did Sales Rep 10 sell?', copied: false },
        { text: 'How many orders did customer 3 cancel?', copied: false }
      ]
    },
    {
      title: 'Advanced',
      icon: '🔴',
      color: '#dc2626',
      description: 'Complex multi-step queries combining multiple data sources',
      prompts: [
        { text: 'What is product description for Chip-50? Also retrieve Sales One Pager, Datasheet and market brief documentation. Finally check its unit price and status of its life cycle', copied: false },
        { text: 'From Sales Facts, show top 3 Research Customers by Line Total in West Region', copied: false },
        { text: 'What is total amount for Sales Orders for Customer 1 that are confirmed? List them.', copied: false },
        { text: 'Plot a bar chart for orders by total for Customer 1. Exclude cancelled orders', copied: false }
      ]
    }
  ];

  async copyToClipboard(prompt: PromptItem): Promise<void> {
    try {
      await navigator.clipboard.writeText(prompt.text);
      prompt.copied = true;
      setTimeout(() => { prompt.copied = false; }, 2000);
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
      prompt.copied = true;
      setTimeout(() => { prompt.copied = false; }, 2000);
    }
  }
}
