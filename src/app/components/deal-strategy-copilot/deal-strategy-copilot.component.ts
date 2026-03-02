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
    this.runAction('Draft a concise account strategy email to the account owner and sales rep.');
  }

  onExportSummary(): void {
    this.runAction('Produce an export-ready summary of this account strategy in bullet format.');
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
