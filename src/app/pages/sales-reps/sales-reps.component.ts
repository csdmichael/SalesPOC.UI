import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesRep } from '../../models/sales-rep.model';
import { SalesRepService } from '../../services/sales-rep.service';

@Component({
  selector: 'app-sales-reps',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-reps.component.html',
  styleUrl: './sales-reps.component.scss'
})
export class SalesRepsComponent implements OnInit {
  salesReps: SalesRep[] = [];
  filteredReps: SalesRep[] = [];
  loading = true;

  searchName = '';
  filterRegion = '';
  regions: string[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 50;
  pageSizeOptions = [10, 25, 50, 100];

  constructor(private salesRepService: SalesRepService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Preload from sessionStorage cache for instant display
    const cached = this.salesRepService.getCachedAll();
    if (cached) {
      this.initializeData(cached);
    }

    // Fetch fresh data from API (uses shareReplay for in-session caching)
    this.salesRepService.getAll().subscribe({
      next: data => {
        this.initializeData(data);
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  private initializeData(data: SalesRep[]): void {
    this.salesReps = data;
    this.regions = [...new Set(data.map(r => r.region).filter(Boolean) as string[])].sort();
    this.loading = false;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredReps = this.salesReps.filter(r => {
      const matchesName = !this.searchName || r.repName.toLowerCase().includes(this.searchName.toLowerCase());
      const matchesRegion = !this.filterRegion || r.region === this.filterRegion;
      return matchesName && matchesRegion;
    });
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchName = '';
    this.filterRegion = '';
    this.filteredReps = this.salesReps;
    this.currentPage = 1;
  }

  get totalRecords(): number {
    return this.filteredReps.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get pagedReps(): SalesRep[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredReps.slice(start, start + this.pageSize);
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
