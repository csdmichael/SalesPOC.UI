import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, shareReplay } from 'rxjs/operators';
import { SalesRep } from '../models/sales-rep.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalesRepService {
  private url = `${environment.apiBaseUrl}/SalesReps`;
  private allCache$: Observable<SalesRep[]> | null = null;
  private readonly CACHE_KEY = 'cache_salesreps';

  constructor(private http: HttpClient) {}

  getAll(): Observable<SalesRep[]> {
    if (!this.allCache$) {
      this.allCache$ = this.http.get<SalesRep[]>(this.url).pipe(
        tap(data => {
          try { sessionStorage.setItem(this.CACHE_KEY, JSON.stringify(data)); } catch (e) {}
        }),
        shareReplay(1)
      );
    }
    return this.allCache$;
  }

  getCachedAll(): SalesRep[] | null {
    try {
      const data = sessionStorage.getItem(this.CACHE_KEY);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  }

  getById(id: number): Observable<SalesRep> {
    return this.http.get<SalesRep>(`${this.url}/${id}`);
  }

  getByRegion(region: string): Observable<SalesRep[]> {
    return this.http.get<SalesRep[]>(`${this.url}/region/${encodeURIComponent(region)}`);
  }
}
