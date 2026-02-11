import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product } from '../models/product.model';
import { ProductDescription, ProductDocument } from '../models/product-document.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private url = `${environment.apiBaseUrl}/Products`;
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.url);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.url}/${id}`);
  }

  getByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.url}/category/${encodeURIComponent(category)}`);
  }

  getDescription(productId: string): Observable<ProductDescription> {
    return this.http.get<ProductDescription>(`${this.apiUrl}/ProductDescriptions/${encodeURIComponent(productId)}`);
  }

  getDocuments(productName: string): Observable<ProductDocument[]> {
    return this.http.get<ProductDocument[]>(`${this.apiUrl}/ProductDocuments/by-product/${encodeURIComponent(productName)}`);
  }

  getDocumentDownloadUrl(blobName: string): string {
    return `${this.apiUrl}/ProductDocuments/download?blobName=${encodeURIComponent(blobName)}`;
  }
}
