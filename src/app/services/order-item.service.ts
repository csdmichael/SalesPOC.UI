import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderItem } from '../models/order-item.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderItemService {
  private url = `${environment.apiBaseUrl}/OrderItems`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(this.url);
  }

  getById(id: number): Observable<OrderItem> {
    return this.http.get<OrderItem>(`${this.url}/${id}`);
  }

  getByOrder(orderId: number): Observable<OrderItem[]> {
    return this.http.get<OrderItem[]>(`${this.url}/order/${orderId}`);
  }
}
