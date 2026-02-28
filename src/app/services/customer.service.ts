import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, defer, of, throwError, timer } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { catchError, mergeMap, retry } from 'rxjs/operators';
import { Customer } from '../models/customer.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private url = `${environment.apiBaseUrl}/Customers`;
  private allCache$: Observable<Customer[]> | null = null;
  private readonly CACHE_KEY = 'cache_customers';
  private readonly MAX_TRIES = 10;
  private readonly CIRCUIT_BREAKER_COOLDOWN_MS = 30000;
  private circuitOpenUntil = 0;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Customer[]> {
    if (!this.allCache$) {
      this.allCache$ = defer(() => {
        if (Date.now() < this.circuitOpenUntil) {
          return throwError(() => new Error('Customer API circuit is open while backend warms up.'));
        }
        return this.http.get<Customer[]>(this.url);
      }).pipe(
        mergeMap(data => Array.isArray(data) && data.length > 0
          ? of(data)
          : throwError(() => new Error('Customer API returned empty data during warm-up.'))
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

  getCachedAll(): Customer[] | null {
    try {
      const data = sessionStorage.getItem(this.CACHE_KEY);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  getById(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.url}/${id}`);
  }
}
