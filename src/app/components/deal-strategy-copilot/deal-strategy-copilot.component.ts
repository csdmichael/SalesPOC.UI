import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { DealStrategyResult } from '../../models/deal-strategy.model';
import { DealStrategyCopilotService } from '../../services/deal-strategy-copilot.service';

@Component({
  selector: 'deal-strategy-copilot',
  imports: [CommonModule],
  templateUrl: './deal-strategy-copilot.component.html',
  styleUrl: './deal-strategy-copilot.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DealStrategyCopilotComponent implements OnChanges {
  customerId = input.required<number>();
  region = input('Global');
  repId = input('unassigned');
  userRole = input('sales-manager');

  loading = signal(false);
  actionLoading = signal(false);
  error = signal('');
  actionStatus = signal('');
  analysis = signal<DealStrategyResult | null>(null);
  draftedEmail = signal('');
  emailCopied = signal(false);
  emailDrafting = signal(false);
  emailJustDrafted = signal(false);

  constructor(private copilotService: DealStrategyCopilotService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.customerId() > 0 &&
      (changes['customerId'] || changes['region'] || changes['repId'] || changes['userRole'])
    ) {
      this.runAutoAnalysis();
    }
  }

  runAutoAnalysis(): void {
    this.loading.set(true);
    this.error.set('');
    this.copilotService.connect().pipe(
      switchMap(() => {
        this.copilotService.setContext({
          customerId: this.customerId(),
          region: this.region(),
          repId: this.repId(),
          userRole: this.userRole(),
        });

        return this.copilotService.invoke('Analyze this account and provide deal strategy.');
      })
    ).subscribe({
      next: (result) => {
        this.analysis.set(result);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Deal strategy analysis is currently unavailable. Please retry.');
        this.loading.set(false);
      }
    });
  }

  onCreateTask(): void {
    this.runAction('Create a follow-up task list for this account strategy.');
  }

  onDraftEmail(): void {
    const current = this.analysis();
    if (!current) return;

    const prompt = [
      'Draft a professional email to the account owner and sales rep summarizing the deal strategy analysis below.',
      'Include all sections in the email body. Use a clear subject line.',
      '',
      `Customer ID: ${this.customerId()}`,
      `Region: ${this.region()}`,
      `Rep: ${this.repId()}`,
      '',
      `Risk Assessment: ${current.riskCard}`,
      '',
      `Cross-Sell Opportunities: ${current.crossSellCard}`,
      '',
      'Recommended Actions:',
      ...(current.recommendedActions || []).map((a, i) => `  ${i + 1}. ${a}`),
      '',
      `Executive Summary: ${current.executiveSummary}`,
      '',
      'Return the full email text only (Subject + Body). Do not return JSON.'
    ].join('\n');

    this.actionLoading.set(true);
    this.actionStatus.set('');
    this.draftedEmail.set('');
    this.emailDrafting.set(true);
    this.emailJustDrafted.set(false);

    this.copilotService.invokeRaw(prompt).subscribe({
      next: (reply) => {
        this.draftedEmail.set(reply);
        this.actionStatus.set('Email drafted successfully.');
        this.actionLoading.set(false);
        this.emailDrafting.set(false);
        this.emailJustDrafted.set(true);
        setTimeout(() => this.emailJustDrafted.set(false), 3000);
      },
      error: () => {
        this.actionStatus.set('Could not draft email. Please try again.');
        this.actionLoading.set(false);
        this.emailDrafting.set(false);
      }
    });
  }

  onExportSummary(): void {
    const result = this.analysis();
    if (!result) return;

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const actions = (result.recommendedActions || []).map(a => `<li>${esc(a)}</li>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Deal Strategy – Customer ${this.customerId()}</title>
      <style>
        body{font-family:Segoe UI,sans-serif;padding:32px;color:#1e293b;max-width:800px;margin:auto}
        h1{font-size:1.4rem;border-bottom:2px solid #3b82f6;padding-bottom:8px}
        h2{font-size:1rem;margin-top:20px}
        p,li{font-size:0.92rem;line-height:1.55}
        .meta{font-size:0.82rem;color:#64748b;margin-bottom:18px}
        ul{padding-left:1.2rem}
      </style></head><body>
      <h1>Deal Strategy Summary</h1>
      <p class="meta">Customer ${this.customerId()} &middot; Region: ${esc(this.region())} &middot; Rep: ${esc(this.repId())} &middot; Exported ${new Date().toLocaleDateString()}</p>
      <h2>Risk Assessment</h2><p>${esc(result.riskCard)}</p>
      <h2>Cross-Sell Opportunities</h2><p>${esc(result.crossSellCard)}</p>
      <h2>Recommended Actions</h2><ul>${actions}</ul>
      <h2>Executive Summary</h2><p>${esc(result.executiveSummary)}</p>
      </body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
  }

  onCopyEmail(): void {
    navigator.clipboard.writeText(this.draftedEmail()).then(() => {
      this.emailCopied.set(true);
      setTimeout(() => this.emailCopied.set(false), 2000);
    });
  }

  private runAction(prompt: string): void {
    this.actionLoading.set(true);
    this.actionStatus.set('');

    this.copilotService.invoke(prompt).subscribe({
      next: (result) => {
        this.analysis.set(result);
        this.actionStatus.set('Action completed and strategy refreshed.');
        this.actionLoading.set(false);
      },
      error: () => {
        this.actionStatus.set('Action could not be completed. Please try again.');
        this.actionLoading.set(false);
      }
    });
  }
}
