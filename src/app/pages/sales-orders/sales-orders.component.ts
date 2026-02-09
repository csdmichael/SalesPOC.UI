import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesOrder } from '../../models/sales-order.model';
import { OrderItem } from '../../models/order-item.model';
import { SalesOrderService } from '../../services/sales-order.service';
import { OrderItemService } from '../../services/order-item.service';

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

  searchCustomer = '';
  filterStatus = '';
  filterRep = '';
  statuses: string[] = [];
  repNames: string[] = [];

  // Pagination
  currentPage = 1;
  pageSize = 50;
  pageSizeOptions = [10, 25, 50, 100];

  // Order items detail
  selectedOrder: SalesOrder | null = null;
  orderItems: OrderItem[] = [];
  loadingItems = false;

  constructor(
    private salesOrderService: SalesOrderService,
    private orderItemService: OrderItemService
  ) {}

  ngOnInit(): void {
    this.salesOrderService.getAll().subscribe({
      next: data => {
        this.orders = data;
        this.filteredOrders = data;
        this.statuses = [...new Set(data.map(o => o.orderStatus).filter(Boolean) as string[])].sort();
        this.repNames = [...new Set(data.map(o => o.salesRep?.repName).filter(Boolean) as string[])].sort();
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  applyFilters(): void {
    this.filteredOrders = this.orders.filter(o => {
      const matchesCustomer = !this.searchCustomer ||
        (o.customer?.customerName?.toLowerCase().includes(this.searchCustomer.toLowerCase()));
      const matchesStatus = !this.filterStatus || o.orderStatus === this.filterStatus;
      const matchesRep = !this.filterRep || o.salesRep?.repName === this.filterRep;
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

  viewOrderItems(order: SalesOrder): void {
    if (this.selectedOrder?.orderId === order.orderId) {
      this.selectedOrder = null;
      this.orderItems = [];
      return;
    }
    this.selectedOrder = order;
    // Use inline items if available from the includes
    if (order.orderItems && order.orderItems.length > 0) {
      this.orderItems = order.orderItems;
    } else {
      this.loadingItems = true;
      this.orderItemService.getByOrder(order.orderId).subscribe({
        next: items => {
          this.orderItems = items;
          this.loadingItems = false;
        },
        error: () => this.loadingItems = false
      });
    }
  }
}
