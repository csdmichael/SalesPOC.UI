import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { SalesFact } from '../models/sales-fact.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalesFactService {
  private url = `${environment.apiBaseUrl}/SalesFacts`;
  private allCache$: Observable<SalesFact[]> | null = null;
  private readonly CACHE_KEY = 'cache_salesfacts';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SalesFact[]> {
    if (!this.allCache$) {
      this.allCache$ = this.http.get<SalesFact[]>(this.url).pipe(
        tap(data => {
          try { sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(data)); } catch (e) {}
        }),
        shareReplay(1)
      );
    }
    return this.allCache$;
  }

  getCachedAll(): SalesFact[] | null {
    try {
      const data = sessionStorage.getItem(this.CACHE_KEY);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  getByCustomer(customerName: string): Observable<SalesFact[]> {
    return this.http.get<SalesFact[]>(`${this.url}/customer/${encodeURIComponent(customerName)}`);
  }

  getByProduct(productName: string): Observable<SalesFact[]> {
    return this.http.get<SalesFact[]>(`${this.url}/product/${encodeURIComponent(productName)}`);
  }

  getBySalesRep(repName: string): Observable<SalesFact[]> {
    return this.http.get<SalesFact[]>(`${this.url}/salesrep/${encodeURIComponent(repName)}`);
  }

  getByRegion(region: string): Observable<SalesFact[]> {
    return this.http.get<SalesFact[]>(`${this.url}/region/${encodeURIComponent(region)}`);
  }

  getByCategory(category: string): Observable<SalesFact[]> {
    return this.http.get<SalesFact[]>(`${this.url}/category/${encodeURIComponent(category)}`);
  }
}
