export interface ProductDocument {
  fileName: string;
  productName: string;
  documentType: string;
  size: number;
  contentType: string;
  lastModified: string;
  url: string;
}

export interface ProductDescription {
  productId: string;
  description: string;
}
