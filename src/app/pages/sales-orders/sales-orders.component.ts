import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesOrder } from '../../models/sales-order.model';
import { OrderItem } from '../../models/order-item.model';
import { SalesOrderService } from '../../services/sales-order.service';
import { OrderItemService } from '../../services/order-item.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-sales-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-orders.component.html',
  styleUrl: './sales-orders.component.scss'
})
export class SalesOrdersComponent implements OnInit {
  orders: SalesOrder[] = [];
  filteredOrders: SalesOrder[] = [];
  loading = true;
  errorMessage = '';

  searchCustomer = '';
  filterStatus = '';
  filterRep = '';
  statuses: string[] = [];
  repNames: string[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 50;
  pageSizeOptions = [10, 25, 50, 100];

  // Order items detail - track expanded orders by ID
  expandedOrderIds = new Set<number>();
  orderItemsMap = new Map<number, OrderItem[]>();
  loadingItemsMap = new Map<number, boolean>();

  constructor(
    private salesOrderService: SalesOrderService,
    private orderItemService: OrderItemService
  ) {}

  ngOnInit(): void {
    this.salesOrderService.getAll().subscribe({
      next: data => {
        this.orders = data;
        this.statuses = [...new Set(data.map(o => o.orderStatus).filter(Boolean) as string[])].sort();
        this.repNames = [...new Set(data.map(o => {
          return o.salesRep?.repName || '';
        }).filter(Boolean) as string[])].sort();
        this.loading = false;
        this.applyFilters();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Failed to load sales orders. Please try again later.';
        console.error('Sales Orders load error:', err);
      }
    });
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(o => {
      const customerName = o.customer?.customerName || '';
      const matchesCustomer = !this.searchCustomer ||
        customerName.toLowerCase().includes(this.searchCustomer.toLowerCase());
      const matchesStatus = !this.filterStatus || o.orderStatus === this.filterStatus;
      const repName = o.salesRep?.repName || '';
      const matchesRep = !this.filterRep || repName === this.filterRep;
      return matchesCustomer && matchesStatus && matchesRep;
    });
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchCustomer = '';
    this.filterStatus = '';
    this.filterRep = '';
    this.filteredOrders = this.orders;
    this.currentPage = 1;
  }

  get totalRecords(): number {
    return this.filteredOrders.length;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get pagedOrders(): SalesOrder[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
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

  isExpanded(orderId: number): boolean {
    return this.expandedOrderIds.has(orderId);
  }

  isLoadingItems(orderId: number): boolean {
    return this.loadingItemsMap.get(orderId) || false;
  }

  getOrderItems(orderId: number): OrderItem[] {
    return this.orderItemsMap.get(orderId) || [];
  }

  toggleOrderItems(order: SalesOrder): void {
    const orderId = order.orderId;
    if (this.expandedOrderIds.has(orderId)) {
      this.expandedOrderIds.delete(orderId);
      return;
    }

    this.expandedOrderIds.add(orderId);

    // Already loaded
    if (this.orderItemsMap.has(orderId)) {
      return;
    }

    // Use inline items if available
    if (order.orderItems && order.orderItems.length > 0) {
      this.orderItemsMap.set(orderId, order.orderItems);
    } else {
      this.loadingItemsMap.set(orderId, true);
      this.orderItemService.getByOrder(orderId).subscribe({
        next: items => {
          this.orderItemsMap.set(orderId, items);
          this.loadingItemsMap.set(orderId, false);
        },
        error: () => {
          this.orderItemsMap.set(orderId, []);
          this.loadingItemsMap.set(orderId, false);
        }
      });
    }
  }
}
