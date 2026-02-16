import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of, take } from 'rxjs';
import { CustomerService } from '../../services/customer.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingComponent {
  private readonly customerService = inject(CustomerService);
  private readonly productService = inject(ProductService);

  readonly preloadComplete = signal(false);

  constructor() {
    this.preloadCoreData();
  }

  private preloadCoreData(): void {
    forkJoin({
      customers: this.customerService.getAll().pipe(
        take(1),
        catchError(() => of([]))
      ),
      products: this.productService.getAll().pipe(
        take(1),
        catchError(() => of([]))
      )
    }).subscribe(() => {
      this.preloadComplete.set(true);
    });
  }
}
