import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesOrder } from '../../models/sales-order.model';
import { OrderItem } from '../../models/order-item.model';
import { Customer } from '../../models/customer.model';
import { SalesOrderService } from '../../services/sales-order.service';
import { OrderItemService } from '../../services/order-item.service';
import { CustomerService } from '../../services/customer.service';

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
  loading = false;
  loadingCustomers = true;
  loadCustomersFailed = false;
  errorMessage = '';
  readonly warmupMessage = 'Backend API may be in idle mode to save cost. Initial load can take a little time while services warm up; once loaded, data is cached for faster access.';

  // Customer filter (required)
  customers: Customer[] = [];
  selectedCustomerId: number | null = null;

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
    private orderItemService: OrderItemService,
    private customerService: CustomerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load customers for filter dropdown
    const cached = this.customerService.getCachedAll();
    const hasCachedCustomers = !!cached?.length;
    if (cached) {
      this.customers = cached.sort((a, b) => a.customerId - b.customerId);
      this.loadingCustomers = false;
    }

    this.customerService.getAll().subscribe({
      next: data => {
        this.customers = data.sort((a, b) => a.customerId - b.customerId);
        this.loadingCustomers = false;
        this.loadCustomersFailed = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingCustomers = false;
        this.loadCustomersFailed = !hasCachedCustomers;
        this.cdr.markForCheck();
      }
    });
  }

  onCustomerSelected(): void {
    if (!this.selectedCustomerId) {
      this.orders = [];
      this.filteredOrders = [];
      this.statuses = [];
      this.repNames = [];
      this.expandedOrderIds.clear();
      this.orderItemsMap.clear();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.expandedOrderIds.clear();
    this.orderItemsMap.clear();

    this.salesOrderService.getByCustomer(this.selectedCustomerId).subscribe({
      next: data => {
        // Sort by orderDate descending (reverse chronological)
        this.orders = data.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        this.statuses = [...new Set(data.map(o => o.orderStatus).filter(Boolean) as string[])].sort();
        this.repNames = [...new Set(data.map(o => o.salesRep?.repName || '').filter(Boolean) as string[])].sort();
        this.loading = false;
        this.applyFilters();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = this.warmupMessage;
        console.error('Sales Orders load error:', err);
        this.cdr.markForCheck();
      }
    });
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(o => {
      const matchesStatus = !this.filterStatus || o.orderStatus === this.filterStatus;
      const repName = o.salesRep?.repName || '';
      const matchesRep = !this.filterRep || repName === this.filterRep;
      return matchesStatus && matchesRep;
    });
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.selectedCustomerId = null;
    this.filterStatus = '';
    this.filterRep = '';
    this.orders = [];
    this.filteredOrders = [];
    this.statuses = [];
    this.repNames = [];
    this.expandedOrderIds.clear();
    this.orderItemsMap.clear();
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

  get hasActiveFilters(): boolean {
    return !!(this.filterStatus || this.filterRep);
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

    if (this.orderItemsMap.has(orderId)) {
      return;
    }

    if (order.orderItems && order.orderItems.length > 0) {
      this.orderItemsMap.set(orderId, order.orderItems);
    } else {
      this.loadingItemsMap.set(orderId, true);
      this.orderItemService.getByOrder(orderId).subscribe({
        next: items => {
          this.orderItemsMap.set(orderId, items);
          this.loadingItemsMap.set(orderId, false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.orderItemsMap.set(orderId, []);
          this.loadingItemsMap.set(orderId, false);
          this.cdr.markForCheck();
        }
      });
    }
  }
}
