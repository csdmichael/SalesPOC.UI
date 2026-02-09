export interface Customer {
  customerId: number;
  customerName: string;
  customerType?: string;
  industry?: string;
  country?: string;
  state?: string;
  city?: string;
  annualRevenueUsd?: number;
  createdDate?: string;
}
