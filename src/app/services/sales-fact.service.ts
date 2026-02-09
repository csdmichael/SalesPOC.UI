import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesFact } from '../models/sales-fact.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalesFactService {
  private url = `${environment.apiBaseUrl}/SalesFacts`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SalesFact[]> {
    return this.http.get<SalesFact[]>(this.url);
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
