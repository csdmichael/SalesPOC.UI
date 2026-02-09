import { Component, OnInit } from '@angular/core';
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

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: data => {
        this.products = data;
        this.filteredProducts = data;
        this.categories = [...new Set(data.map(p => p.productCategory).filter(Boolean) as string[])].sort();
        this.statuses = [...new Set(data.map(p => p.lifecycleStatus).filter(Boolean) as string[])].sort();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters(): void {
    this.filteredProducts = this.products.filter(p => {
      const matchesName = !this.searchName || p.productName.toLowerCase().includes(this.searchName.toLowerCase());
      const matchesCat = !this.filterCategory || p.productCategory === this.filterCategory;
      const matchesStatus = !this.filterStatus || p.lifecycleStatus === this.filterStatus;
      return matchesName && matchesCat && matchesStatus;
    });
  }

  clearFilters(): void {
    this.searchName = '';
    this.filterCategory = '';
    this.filterStatus = '';
    this.filteredProducts = this.products;
  }
}
