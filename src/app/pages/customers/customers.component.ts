import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer } from '../../models/customer.model';
import { CustomerService } from '../../services/customer.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss'
})
export class CustomersComponent implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  loading = true;

  // Filters
  searchName = '';
  filterType = '';
  filterIndustry = '';
  filterCountry = '';

  // Distinct filter values
  customerTypes: string[] = [];
  industries: string[] = [];
  countries: string[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 50;
  pageSizeOptions = [10, 25, 50, 100];

  constructor(private customerService: CustomerService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Preload from sessionStorage cache for instant display
    const cached = this.customerService.getCachedAll();
    if (cached) {
      this.initializeData(cached);
    }

    // Fetch fresh data from API (uses shareReplay for in-session caching)
    this.customerService.getAll().subscribe({
      next: data => {
        this.initializeData(data);
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  private initializeData(data: Customer[]): void {
    this.customers = data;
    this.customerTypes = [...new Set(data.map(c => c.customerType).filter(Boolean) as string[])].sort();
    this.industries = [...new Set(data.map(c => c.industry).filter(Boolean) as string[])].sort();
    this.countries = [...new Set(data.map(c => c.country).filter(Boolean) as string[])].sort();
    this.loading = false;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredCustomers = this.customers.filter(c => {
      const matchesName = !this.searchName || c.customerName.toLowerCase().includes(this.searchName.toLowerCase());
      const matchesType = !this.filterType || c.customerType === this.filterType;
      const matchesIndustry = !this.filterIndustry || c.industry === this.filterIndustry;
      const matchesCountry = !this.filterCountry || c.country === this.filterCountry;
      return matchesName && matchesType && matchesIndustry && matchesCountry;
    });
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchName = '';
    this.filterType = '';
    this.filterIndustry = '';
    this.filterCountry = '';
    this.filteredCustomers = this.customers;
    this.currentPage = 1;
  }

  get totalRecords(): number {
    return this.filteredCustomers.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get pagedCustomers(): Customer[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCustomers.slice(start, start + this.pageSize);
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
