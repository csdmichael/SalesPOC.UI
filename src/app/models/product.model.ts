export interface Product {
  productId: number;
  productName: string;
  productCategory?: string;
  processNodeNm?: number;
  packageType?: string;
  unitPriceUsd: number;
  lifecycleStatus?: string;
  createdDate?: string;
}
