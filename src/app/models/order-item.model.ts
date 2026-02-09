import { Product } from './product.model';

export interface OrderItem {
  orderItemId: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPriceUsd: number;
  lineTotalUsd?: number;
  product?: Product;
}
