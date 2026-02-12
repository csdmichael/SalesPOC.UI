import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { Customer } from '../models/customer.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private url = `${environment.apiBaseUrl}/Customers`;
  private allCache$: Observable<Customer[]> | null = null;
  private readonly CACHE_KEY = 'cache_customers';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Customer[]> {
    if (!this.allCache$) {
      this.allCache$ = this.http.get<Customer[]>(this.url).pipe(
        tap(data => {
          try { sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(data)); } catch (e) {}
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
