export interface SalesFact {
  orderId: number;
  orderDate: string;
  customerName: string;
  customerType?: string;
  productName: string;
  productCategory?: string;
  processNodeNm?: number;
  quantity: number;
  unitPriceUsd: number;
  lineTotalUsd?: number;
  repName?: string;
  region?: string;
}
