import { Customer } from './customer.model';
import { SalesRep } from './sales-rep.model';
import { OrderItem } from './order-item.model';

export interface SalesOrder {
  orderId: number;
  customerId: number;
  salesRepId?: number;
  orderDate: string;
  orderStatus?: string;
  totalAmountUsd?: number;
  currency?: string;
  customer?: Customer;
  salesRep?: SalesRep;
  orderItems?: OrderItem[];
}
