import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { Product } from '../models/product.model';
import { ProductDescription, ProductDocument } from '../models/product-document.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private url = `${environment.apiBaseUrl}/Products`;
  private apiUrl = environment.apiBaseUrl;
  private allCache$: Observable<Product[]> | null = null;
  private readonly CACHE_KEY = 'cache_products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    if (!this.allCache$) {
      this.allCache$ = this.http.get<Product[]>(this.url).pipe(
        tap(data => {
          try { sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(data)); } catch (e) {}
        }),
        shareReplay(1)
      );
    }
    return this.allCache$;
  }

  getCachedAll(): Product[] | null {
    try {
      const data = sessionStorage.getItem(this.CACHE_KEY);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
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

  getDocumentBlob(blobName: string): Observable<Blob> {
    return this.http.get(this.getDocumentDownloadUrl(blobName), { responseType: 'blob' });
  }
}
