import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, Plugin } from 'chart.js';
import { SalesFact } from '../../models/sales-fact.model';
import { SalesFactService } from '../../services/sales-fact.service';

const formatSalesAmount = (value: number): string => {
  const amount = Number(value) || 0;
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }

  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const valueLabelPlugin: Plugin = {
  id: 'valueLabelPlugin',
  afterDatasetsDraw(chart, _args, pluginOptions: any) {
    const options = pluginOptions || {};
    if (!options.enabled) return;

    const dataset = chart.data.datasets[0];
    if (!dataset || !Array.isArray(dataset.data)) return;

    const values = dataset.data.map(v => Number(v) || 0);
    if (values.length === 0) return;

    const mode: 'currency' | 'percentage' = options.mode || 'currency';
    const color = options.color || '#1f2937';

    const ctx = chart.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '600 11px Arial';

    const meta = chart.getDatasetMeta(0);
    const chartType = meta.type;

    if (chartType === 'bar') {
      meta.data.forEach((bar: any, i: number) => {
        const value = values[i] || 0;
        const text = formatSalesAmount(value);
        const x = bar.x + 8;
        const y = bar.y + 3;
        ctx.fillText(text, x, y);
      });
    }

    if (chartType === 'arc') {
      const total = values.reduce((a, b) => a + b, 0);
      if (total > 0) {
        meta.data.forEach((slice: any, i: number) => {
          const value = values[i] || 0;
          const pct = (value / total) * 100;
          if (pct < 4) return;

          const pos = slice.tooltipPosition();
          const text = mode === 'percentage' ? `${pct.toFixed(1)}%` : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          const textWidth = ctx.measureText(text).width;
          ctx.fillText(text, pos.x - textWidth / 2, pos.y);
        });
      }
    }

    ctx.restore();
  }
};

Chart.register(...registerables, valueLabelPlugin);

@Component({
  selector: 'app-sales-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-statistics.component.html',
  styleUrl: './sales-statistics.component.scss'
})
export class SalesStatisticsComponent implements OnInit, OnDestroy {
  @ViewChild('customerChart', { static: false }) customerChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productChart', { static: false }) productChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('repChart', { static: false }) repChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('regionChart', { static: false }) regionChartRef!: ElementRef<HTMLCanvasElement>;

  salesFacts: SalesFact[] = [];
  loading = true;
  chartsReady = false;

  customerChart: Chart | null = null;
  productChart: Chart | null = null;
  repChart: Chart | null = null;
  regionChart: Chart | null = null;

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
    this.regionChart?.destroy();
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
    this.renderBarChart(filtered, 'customer');
    this.renderBarChart(filtered, 'product');
    this.renderBarChart(filtered, 'rep');
    this.renderRegionPieChart(filtered);
  }

  private renderBarChart(data: SalesFact[], type: 'customer' | 'product' | 'rep'): void {
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
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: this.COLORS,
          borderWidth: 2,
          borderColor: '#fff',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            ticks: {
              callback: value => formatSalesAmount(Number(value))
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: chartTitle,
            font: { size: 14, weight: 'bold' },
            padding: { bottom: 16 }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const value = Number(ctx.parsed?.x ?? ctx.parsed ?? 0);
                const total = values.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${ctx.label}: ${formatSalesAmount(value)} (${pct}%)`;
              }
            }
          },
          valueLabelPlugin: {
            enabled: true,
            mode: 'currency'
          }
        } as any
      }
    });

    switch (type) {
      case 'customer': this.customerChart = chart; break;
      case 'product': this.productChart = chart; break;
      case 'rep': this.repChart = chart; break;
    }
  }

  private renderRegionPieChart(data: SalesFact[]): void {
    const ref = this.regionChartRef;
    const existing = this.regionChart;

    if (!ref?.nativeElement) return;

    const map = new Map<string, number>();
    data.forEach(f => {
      const key = f.region || 'Unknown';
      map.set(key, (map.get(key) || 0) + (f.lineTotalUsd || 0));
    });

    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(e => e[0]);
    const values = sorted.map(e => e[1]);

    existing?.destroy();

    this.regionChart = new Chart(ref.nativeElement, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: [...this.COLORS, '#9333ea', '#0ea5e9', '#65a30d'],
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
            text: 'Sales by Region',
            font: { size: 14, weight: 'bold' },
            padding: { bottom: 16 }
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                const value = ctx.parsed;
                const total = values.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${ctx.label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${pct}%)`;
              }
            }
          },
          valueLabelPlugin: {
            enabled: true,
            mode: 'percentage'
          }
        } as any
      }
    });
  }
}
