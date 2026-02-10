import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  // Pagination
  currentPage = 1;
  pageSize = 50;
  pageSizeOptions = [10, 25, 50, 100];

  constructor(private salesFactService: SalesFactService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.salesFactService.getAll().subscribe({
      next: data => {
        this.salesFacts = data;
        this.categories = [...new Set(data.map(f => f.productCategory).filter(Boolean) as string[])].sort();
        this.regions = [...new Set(data.map(f => f.region).filter(Boolean) as string[])].sort();
        this.repNames = [...new Set(data.map(f => f.repName).filter(Boolean) as string[])].sort();
        this.loading = false;
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
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
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchCustomer = '';
    this.searchProduct = '';
    this.filterCategory = '';
    this.filterRegion = '';
    this.filterRep = '';
    this.filteredFacts = this.salesFacts;
    this.currentPage = 1;
  }

  get totalRevenue(): number {
    return this.filteredFacts.reduce((sum, f) => sum + (f.lineTotalUsd || 0), 0);
  }

  get totalQuantity(): number {
    return this.filteredFacts.reduce((sum, f) => sum + f.quantity, 0);
  }

  get totalRecords(): number {
    return this.filteredFacts.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get pagedFacts(): SalesFact[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredFacts.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }
}
