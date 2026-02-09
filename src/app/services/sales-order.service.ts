import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesOrder } from '../models/sales-order.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalesOrderService {
  private url = `${environment.apiBaseUrl}/SalesOrders`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SalesOrder[]> {
    return this.http.get<SalesOrder[]>(this.url);
  }

  getById(id: number): Observable<SalesOrder> {
    return this.http.get<SalesOrder>(`${this.url}/${id}`);
  }

  getByCustomer(customerId: number): Observable<SalesOrder[]> {
    return this.http.get<SalesOrder[]>(`${this.url}/customer/${customerId}`);
  }

  getBySalesRep(salesRepId: number): Observable<SalesOrder[]> {
    return this.http.get<SalesOrder[]>(`${this.url}/salesrep/${salesRepId}`);
  }
}
