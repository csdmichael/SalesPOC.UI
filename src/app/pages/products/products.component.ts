import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product.model';
import { ProductDescription, ProductDocument } from '../../models/product-document.model';
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

  // Expanded row detail tracking
  expandedProductId: number | null = null;
  descriptionLoading = false;
  documentsLoading = false;
  productDescription: string | null = null;
  productDocuments: ProductDocument[] = [];

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

  toggleDetails(product: Product): void {
    if (this.expandedProductId === product.productId) {
      this.expandedProductId = null;
      this.productDescription = null;
      this.productDocuments = [];
      return;
    }

    this.expandedProductId = product.productId;
    this.productDescription = null;
    this.productDocuments = [];

    const productKey = product.productName.toLowerCase();

    // Fetch description
    this.descriptionLoading = true;
    this.productService.getDescription(productKey).subscribe({
      next: data => {
        this.productDescription = data.description;
        this.descriptionLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.productDescription = 'Description not available.';
        this.descriptionLoading = false;
        this.cdr.markForCheck();
      }
    });

    // Fetch documents
    this.documentsLoading = true;
    this.productService.getDocuments(productKey).subscribe({
      next: docs => {
        this.productDocuments = docs;
        this.documentsLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.productDocuments = [];
        this.documentsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  downloadDocument(doc: ProductDocument): void {
    const downloadUrl = this.productService.getDocumentDownloadUrl(doc.fileName);
    window.open(downloadUrl, '_blank');
  }
}
