import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';
import { DealStrategyCopilotComponent } from '../../components/deal-strategy-copilot/deal-strategy-copilot.component';

@Component({
  selector: 'app-customer-account',
  imports: [CommonModule, RouterLink, DealStrategyCopilotComponent],
  templateUrl: './customer-account.component.html',
  styleUrl: './customer-account.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CustomerAccountComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private customerService = inject(CustomerService);

  loading = signal(true);
  error = signal('');
  customer = signal<Customer | null>(null);

  customerId = signal(0);
  repId = signal('unassigned');
  currentUserRole = signal('sales-manager');
  region = computed(() => this.customer()?.country || this.customer()?.state || 'Global');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('customerId'));
    if (!id || Number.isNaN(id)) {
      this.error.set('Invalid customer account id.');
      this.loading.set(false);
      return;
    }

    this.customerId.set(id);
    this.loadCustomer(id);
  }

  private loadCustomer(id: number): void {
    const cached = this.customerService.getCachedAll();
    const cachedCustomer = cached?.find(c => c.customerId === id);
    if (cachedCustomer) {
      this.customer.set(cachedCustomer);
      this.loading.set(false);
    }

    this.customerService.getById(id).subscribe({
      next: customer => {
        this.customer.set(customer);
        this.loading.set(false);
      },
      error: () => {
        if (!this.customer()) {
          this.error.set('Customer account details are unavailable right now.');
        }
        this.loading.set(false);
      }
    });
  }
}
