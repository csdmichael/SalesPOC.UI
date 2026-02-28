import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, defer, of, throwError, timer } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { catchError, mergeMap, retry } from 'rxjs/operators';
import { SalesFact } from '../models/sales-fact.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalesFactService {
  private url = `${environment.apiBaseUrl}/SalesFacts`;
  private allCache$: Observable<SalesFact[]> | null = null;
  private readonly CACHE_KEY = 'cache_salesfacts';
  private readonly MAX_TRIES = 10;
  private readonly CIRCUIT_BREAKER_COOLDOWN_MS = 30000;
  private circuitOpenUntil = 0;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SalesFact[]> {
    if (!this.allCache$) {
      this.allCache$ = defer(() => {
        if (Date.now() < this.circuitOpenUntil) {
          return throwError(() => new Error('Sales Facts API circuit is open while backend warms up.'));
        }
        return this.http.get<SalesFact[]>(this.url);
      }).pipe(
        mergeMap(data => Array.isArray(data) && data.length > 0
          ? of(data)
          : throwError(() => new Error('Sales Facts API returned empty data during warm-up.'))
        ),
        retry({
          count: this.MAX_TRIES - 1,
          delay: (_error, retryCount) => timer(Math.min(1000 * retryCount, 5000))
        }),
        tap(data => {
          try { sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(data)); } catch (e) {}
          this.circuitOpenUntil = 0;
        }),
        catchError(error => {
          this.circuitOpenUntil = Date.now() + this.CIRCUIT_BREAKER_COOLDOWN_MS;
          this.allCache$ = null;
          return throwError(() => error);
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
