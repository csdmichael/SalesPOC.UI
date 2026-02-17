import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { SalesFact } from '../../models/sales-fact.model';
import { SalesFactService } from '../../services/sales-fact.service';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonMenuButton, IonButtons } from '@ionic/angular/standalone';

Chart.register(...registerables);

@Component({
  selector: 'app-sales-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonMenuButton, IonButtons],
  templateUrl: './sales-statistics.component.html',
  styleUrl: './sales-statistics.component.scss'
})
export class SalesStatisticsComponent implements OnInit, OnDestroy {
  @ViewChild('customerChart', { static: false }) customerChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productChart', { static: false }) productChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('repChart', { static: false }) repChartRef!: ElementRef<HTMLCanvasElement>;

  salesFacts: SalesFact[] = [];
  loading = true;
  chartsReady = false;

  customerChart: Chart | null = null;
  productChart: Chart | null = null;
  repChart: Chart | null = null;

  // Date filters
  dateFrom = '';
  dateTo = '';

  private readonly COLORS = [
    '#1a73e8', '#e8710a', '#16a34a', '#dc2626', '#7c3aed',
    '#0891b2', '#db2777', '#ca8a04', '#4f46e5', '#059669'
  ];

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
    this.customerChart?.destroy();
    this.productChart?.destroy();
    this.repChart?.destroy();
  }

  private initializeData(data: SalesFact[]): void {
    this.salesFacts = data;

    // Set default date range from data
    if (!this.dateFrom && !this.dateTo && data.length > 0) {
      const dates = data.map(f => f.orderDate).filter(Boolean).sort();
      if (dates.length > 0) {
        this.dateFrom = dates[0].substring(0, 10);
        this.dateTo = dates[dates.length - 1].substring(0, 10);
      }
    }

    this.loading = false;
    // Defer rendering to next tick so ViewChild refs are available
    setTimeout(() => {
      this.chartsReady = true;
      this.cdr.detectChanges();
      this.renderCharts();
    });
  }

  applyFilters(): void {
    this.renderCharts();
  }

  clearFilters(): void {
    if (this.salesFacts.length > 0) {
      const dates = this.salesFacts.map(f => f.orderDate).filter(Boolean).sort();
      this.dateFrom = dates[0]?.substring(0, 10) || '';
      this.dateTo = dates[dates.length - 1]?.substring(0, 10) || '';
    }
    this.renderCharts();
  }

  private getFilteredData(): SalesFact[] {
    return this.salesFacts.filter(f => {
      const orderDate = f.orderDate?.substring(0, 10) || '';
      const matchesFrom = !this.dateFrom || orderDate >= this.dateFrom;
      const matchesTo = !this.dateTo || orderDate <= this.dateTo;
      return matchesFrom && matchesTo;
    });
  }

  private renderCharts(): void {
    const filtered = this.getFilteredData();
    this.renderPieChart(filtered, 'customer');
    this.renderPieChart(filtered, 'product');
    this.renderPieChart(filtered, 'rep');
  }

  private renderPieChart(data: SalesFact[], type: 'customer' | 'product' | 'rep'): void {
    let ref: ElementRef<HTMLCanvasElement>;
    let existing: Chart | null;
    let groupFn: (f: SalesFact) => string;
    let chartTitle: string;

    switch (type) {
      case 'customer':
        ref = this.customerChartRef;
        existing = this.customerChart;
        groupFn = f => f.customerName;
        chartTitle = 'Top 10 Customers by Sales Amount';
        break;
      case 'product':
        ref = this.productChartRef;
        existing = this.productChart;
        groupFn = f => f.productName;
        chartTitle = 'Top 10 Products by Sales Amount';
        break;
      case 'rep':
        ref = this.repChartRef;
        existing = this.repChart;
        groupFn = f => f.repName || 'Unknown';
        chartTitle = 'Top 10 Sales Reps by Sales Amount';
        break;
    }

    if (!ref?.nativeElement) return;

    // Aggregate
    const map = new Map<string, number>();
    data.forEach(f => {
      const key = groupFn(f);
      map.set(key, (map.get(key) || 0) + (f.lineTotalUsd || 0));
    });

    // Sort and take top 10
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const labels = sorted.map(e => e[0]);
    const values = sorted.map(e => e[1]);

    existing?.destroy();

    const chart = new Chart(ref.nativeElement, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: this.COLORS,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { padding: 12, font: { size: 11 } }
          },
          title: {
            display: true,
            text: chartTitle,
            font: { size: 14, weight: 'bold' },
            padding: { bottom: 16 }
          },
          tooltip: {
            callbacks: {
              label: ctx => {
                const value = ctx.parsed;
                const total = values.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${ctx.label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${pct}%)`;
              }
            }
          }
        }
      }
    });

    switch (type) {
      case 'customer': this.customerChart = chart; break;
      case 'product': this.productChart = chart; break;
      case 'rep': this.repChart = chart; break;
    }
  }
}
