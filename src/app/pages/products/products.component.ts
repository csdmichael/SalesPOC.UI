import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;

  searchName = '';
  filterCategory = '';
  filterStatus = '';

  categories: string[] = [];
  statuses: string[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 50;
  pageSizeOptions = [10, 25, 50, 100];

  constructor(private productService: ProductService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: data => {
        this.products = data;
        this.categories = [...new Set(data.map(p => p.productCategory).filter(Boolean) as string[])].sort();
        this.statuses = [...new Set(data.map(p => p.lifecycleStatus).filter(Boolean) as string[])].sort();
        this.loading = false;
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter(p => {
      const matchesName = !this.searchName || p.productName.toLowerCase().includes(this.searchName.toLowerCase());
      const matchesCat = !this.filterCategory || p.productCategory === this.filterCategory;
      const matchesStatus = !this.filterStatus || p.lifecycleStatus === this.filterStatus;
      return matchesName && matchesCat && matchesStatus;
    });
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchName = '';
    this.filterCategory = '';
    this.filterStatus = '';
    this.filteredProducts = this.products;
    this.currentPage = 1;
  }

  get totalRecords(): number {
    return this.filteredProducts.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get pagedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
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
