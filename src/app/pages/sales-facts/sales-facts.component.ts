import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesFact } from '../../models/sales-fact.model';
import { SalesFactService } from '../../services/sales-fact.service';

@Component({
  selector: 'app-sales-facts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-facts.component.html',
  styleUrl: './sales-facts.component.scss'
})
export class SalesFactsComponent implements OnInit {
  salesFacts: SalesFact[] = [];
  filteredFacts: SalesFact[] = [];
  loading = true;

  searchCustomer = '';
  searchProduct = '';
  filterCategory = '';
  filterRegion = '';
  filterRep = '';

  categories: string[] = [];
  regions: string[] = [];
  repNames: string[] = [];

  constructor(private salesFactService: SalesFactService) {}

  ngOnInit(): void {
    this.salesFactService.getAll().subscribe({
      next: data => {
        this.salesFacts = data;
        this.filteredFacts = data;
        this.categories = [...new Set(data.map(f => f.productCategory).filter(Boolean) as string[])].sort();
        this.regions = [...new Set(data.map(f => f.region).filter(Boolean) as string[])].sort();
        this.repNames = [...new Set(data.map(f => f.repName).filter(Boolean) as string[])].sort();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters(): void {
    this.filteredFacts = this.salesFacts.filter(f => {
      const matchesCust = !this.searchCustomer || f.customerName.toLowerCase().includes(this.searchCustomer.toLowerCase());
      const matchesProd = !this.searchProduct || f.productName.toLowerCase().includes(this.searchProduct.toLowerCase());
      const matchesCat = !this.filterCategory || f.productCategory === this.filterCategory;
      const matchesRegion = !this.filterRegion || f.region === this.filterRegion;
      const matchesRep = !this.filterRep || f.repName === this.filterRep;
      return matchesCust && matchesProd && matchesCat && matchesRegion && matchesRep;
    });
  }

  clearFilters(): void {
    this.searchCustomer = '';
    this.searchProduct = '';
    this.filterCategory = '';
    this.filterRegion = '';
    this.filterRep = '';
    this.filteredFacts = this.salesFacts;
  }

  get totalRevenue(): number {
    return this.filteredFacts.reduce((sum, f) => sum + (f.lineTotalUsd || 0), 0);
  }

  get totalQuantity(): number {
    return this.filteredFacts.reduce((sum, f) => sum + f.quantity, 0);
  }
}
