import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { SalesFact } from '../../models/sales-fact.model';
import { SalesFactService } from '../../services/sales-fact.service';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonMenuButton, IonButtons } from '@ionic/angular/standalone';

// Region coordinates (approximate centers)
const REGION_COORDS: Record<string, [number, number]> = {
  // Americas
  'West': [37.7749, -122.4194],
  'East': [40.7128, -74.0060],
  'North': [44.9778, -93.2650],
  'South': [29.7604, -95.3698],
  'Central': [39.7392, -104.9903],
  'Northeast': [42.3601, -71.0589],
  'Northwest': [47.6062, -122.3321],
  'Southeast': [33.7490, -84.3880],
  'Southwest': [33.4484, -112.0740],
  'Midwest': [41.8781, -87.6298],
  'Americas': [39.8283, -98.5795],
  // EMEA
  'EMEA': [48.8566, 10.0000],
  'Europe': [50.1109, 8.6821],
  'Middle East': [25.2048, 55.2708],
  'Africa': [1.2921, 36.8219],
  // APAC
  'APAC': [22.3964, 114.1095],
  'Asia': [35.6762, 139.6503],
  'Asia Pacific': [1.3521, 103.8198],
  'Pacific': [-33.8688, 151.2093],
  'Australia': [-33.8688, 151.2093],
  'India': [19.0760, 72.8777],
  'China': [31.2304, 121.4737],
  'Japan': [35.6762, 139.6503],
  'Southeast Asia': [13.7563, 100.5018]
};

@Component({
  selector: 'app-sales-region',
  standalone: true,
  imports: [CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonMenuButton, IonButtons],
  templateUrl: './sales-region.component.html',
  styleUrl: './sales-region.component.scss'
})
export class SalesRegionComponent implements OnInit, OnDestroy, AfterViewInit {
  salesFacts: SalesFact[] = [];
  loading = true;
  map: L.Map | null = null;
  markers: L.CircleMarker[] = [];

  // Filters
  customers: string[] = [];
  products: string[] = [];
  reps: string[] = [];
  selectedCustomer = '';
  selectedProduct = '';
  selectedRep = '';
  dateFrom = '';
  dateTo = '';

  // Summary
  regionSummary: { region: string; total: number; orders: number }[] = [];

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

  ngAfterViewInit(): void {
    setTimeout(() => this.tryInitMapAndRender(), 0);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    if (this.map) return;

    const mapContainer = document.getElementById('regionMap');
    if (!mapContainer) return;

    this.map = L.map(mapContainer, {
      center: [20, 0], // World center
      zoom: 2,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);
  }

  private initializeData(data: SalesFact[]): void {
    this.salesFacts = data;
    this.customers = [...new Set(data.map(f => f.customerName).filter(Boolean))].sort();
    this.products = [...new Set(data.map(f => f.productName).filter(Boolean))].sort();
    this.reps = [...new Set(data.map(f => f.repName).filter(Boolean) as string[])].sort();

    if (!this.dateFrom && !this.dateTo && data.length > 0) {
      const dates = data.map(f => f.orderDate).filter(Boolean).sort();
      if (dates.length > 0) {
        this.dateFrom = dates[0].substring(0, 10);
        this.dateTo = dates[dates.length - 1].substring(0, 10);
      }
    }

    this.loading = false;
    setTimeout(() => this.tryInitMapAndRender(), 0);
  }

  applyFilters(): void {
    this.renderMap();
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
    this.renderMap();
  }

  private getFilteredData(): SalesFact[] {
    return this.salesFacts.filter(f => {
      const matchesCustomer = !this.selectedCustomer || f.customerName === this.selectedCustomer;
      const matchesProduct = !this.selectedProduct || f.productName === this.selectedProduct;
      const matchesRep = !this.selectedRep || f.repName === this.selectedRep;
      const orderDate = f.orderDate?.substring(0, 10) || '';
      const matchesFrom = !this.dateFrom || orderDate >= this.dateFrom;
      const matchesTo = !this.dateTo || orderDate <= this.dateTo;
      return matchesCustomer && matchesProduct && matchesRep && matchesFrom && matchesTo;
    });
  }

  private renderMap(): void {
    if (!this.map) return;

    // Clear existing markers
    this.markers.forEach(m => m.remove());
    this.markers = [];

    const filtered = this.getFilteredData();

    // Group by region
    const regionMap = new Map<string, { total: number; orders: number }>();
    filtered.forEach(f => {
      const region = f.region || 'Unknown';
      const existing = regionMap.get(region) || { total: 0, orders: 0 };
      existing.total += f.lineTotalUsd || 0;
      existing.orders += 1;
      regionMap.set(region, existing);
    });

    // Build summary
    this.regionSummary = [...regionMap.entries()]
      .map(([region, data]) => ({ region, ...data }))
      .sort((a, b) => b.total - a.total);

    // Find max total for scaling
    const maxTotal = Math.max(...this.regionSummary.map(r => r.total), 1);

    // Add markers
    regionMap.forEach((data, region) => {
      const coords = REGION_COORDS[region];
      if (!coords) return;

      const radius = Math.max(15, Math.min(50, (data.total / maxTotal) * 50));
      const marker = L.circleMarker(coords, {
        radius,
        fillColor: '#1a73e8',
        fillOpacity: 0.6,
        color: '#1a73e8',
        weight: 2
      }).addTo(this.map!);

      marker.bindPopup(`
        <div style="font-family: Inter, sans-serif; min-width: 160px;">
          <h3 style="margin: 0 0 8px; font-size: 1rem; color: #0f172a;">${region}</h3>
          <p style="margin: 4px 0; font-size: 0.85rem; color: #475569;">
            <strong>Total Sales:</strong> $${data.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p style="margin: 4px 0; font-size: 0.85rem; color: #475569;">
            <strong>Orders:</strong> ${data.orders.toLocaleString()}
          </p>
        </div>
      `);

      this.markers.push(marker);
    });

    this.cdr.detectChanges();
  }

  private tryInitMapAndRender(): void {
    this.initMap();
    if (!this.map) return;
    this.renderMap();
    this.map.invalidateSize();
  }
}
