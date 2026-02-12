import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { SalesFact } from '../../models/sales-fact.model';
import { SalesFactService } from '../../services/sales-fact.service';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-trend',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-trend.component.html',
  styleUrl: './sales-trend.component.scss'
})
export class SalesTrendComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('trendChart', { static: false }) chartRef!: ElementRef<HTMLCanvasElement>;

  salesFacts: SalesFact[] = [];
  loading = true;
  chart: Chart | null = null;
  private pendingRender = false;

  // Filters
  customers: string[] = [];
  products: string[] = [];
  reps: string[] = [];
  selectedCustomer = '';
  selectedProduct = '';
  selectedRep = '';
  dateFrom = '';
  dateTo = '';

  constructor(private salesFactService: SalesFactService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const cached = this.salesFactService.getCachedAll();
    if (cached) {
      this.initializeData(cached);
    }

    this.salesFactService.getAll().subscribe({
      next: data => {
        this.initializeData(data);
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private initializeData(data: SalesFact[]): void {
    this.salesFacts = data;
    this.customers = [...new Set(data.map(f => f.customerName).filter(Boolean))].sort();
    this.products = [...new Set(data.map(f => f.productName).filter(Boolean))].sort();
    this.reps = [...new Set(data.map(f => f.repName).filter(Boolean) as string[])].sort();

    // Set default date range from data
    if (!this.dateFrom && !this.dateTo && data.length > 0) {
      const dates = data.map(f => f.orderDate).filter(Boolean).sort();
      if (dates.length > 0) {
        this.dateFrom = dates[0].substring(0, 10);
        this.dateTo = dates[dates.length - 1].substring(0, 10);
      }
    }

    this.loading = false;
    this.pendingRender = true;
  }

  ngAfterViewChecked(): void {
    if (this.pendingRender && this.chartRef?.nativeElement) {
      this.pendingRender = false;
      this.renderChart();
    }
  }

  applyFilters(): void {
    this.renderChart();
  }

  clearFilters(): void {
    this.selectedCustomer = '';
    this.selectedProduct = '';
    this.selectedRep = '';
    if (this.salesFacts.length > 0) {
      const dates = this.salesFacts.map(f => f.orderDate).filter(Boolean).sort();
      this.dateFrom = dates[0]?.substring(0, 10) || '';
      this.dateTo = dates[dates.length - 1]?.substring(0, 10) || '';
    }
    this.renderChart();
  }

  private getFilteredData(): SalesFact[] {
    return this.salesFacts.filter(f => {
      const matchesCustomer = !this.selectedCustomer || f.customerName === this.selectedCustomer;
      const matchesProduct = !this.selectedProduct || f.productName === this.selectedProduct;
      const matchesRep = !this.selectedRep || f.repName === this.selectedRep;
      const orderDate = f.orderDate?.substring(0, 10) || '';
      const matchesDateFrom = !this.dateFrom || orderDate >= this.dateFrom;
      const matchesDateTo = !this.dateTo || orderDate <= this.dateTo;
      return matchesCustomer && matchesProduct && matchesRep && matchesDateFrom && matchesDateTo;
    });
  }

  private renderChart(): void {
    const filtered = this.getFilteredData();

    // Group by month (YYYY-MM)
    const monthlyMap = new Map<string, number>();
    filtered.forEach(f => {
      if (!f.orderDate) return;
      const month = f.orderDate.substring(0, 7); // YYYY-MM
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + (f.lineTotalUsd || 0));
    });

    // Sort by month
    const sortedMonths = [...monthlyMap.keys()].sort();
    const labels = sortedMonths.map(m => {
      const [year, mon] = m.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[parseInt(mon) - 1]} ${year}`;
    });
    const values = sortedMonths.map(m => monthlyMap.get(m) || 0);

    this.chart?.destroy();

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Monthly Sales Amount (USD)',
          data: values,
          borderColor: '#1a73e8',
          backgroundColor: 'rgba(26, 115, 232, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#1a73e8',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: ctx => `$${(ctx.parsed.y ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { maxRotation: 45, minRotation: 0 }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '$' + Number(value).toLocaleString()
            }
          }
        }
      }
    });
  }
}
