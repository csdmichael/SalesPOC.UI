import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, defer, throwError, timer } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { OrderItem } from '../models/order-item.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrderItemService {
  private url = `${environment.apiBaseUrl}/OrderItems`;
  private readonly MAX_TRIES = 10;
  private readonly CIRCUIT_BREAKER_COOLDOWN_MS = 30000;
  private circuitOpenUntil = 0;

  constructor(private http: HttpClient) {}

  private getWithResilience<T>(requestUrl: string): Observable<T> {
    return defer(() => {
      if (Date.now() < this.circuitOpenUntil) {
        return throwError(() => new Error('Order Items API circuit is open while backend warms up.'));
      }
      return this.http.get<T>(requestUrl);
    }).pipe(
      retry({
        count: this.MAX_TRIES - 1,
        delay: (_error, retryCount) => timer(Math.min(1000 * retryCount, 5000))
      }),
      catchError(error => {
        this.circuitOpenUntil = Date.now() + this.CIRCUIT_BREAKER_COOLDOWN_MS;
        return throwError(() => error);
      })
    );
  }

  getAll(): Observable<OrderItem[]> {
    return this.getWithResilience<OrderItem[]>(this.url);
  }

  getById(id: number): Observable<OrderItem> {
    return this.getWithResilience<OrderItem>(`${this.url}/${id}`);
  }

  getByOrder(orderId: number): Observable<OrderItem[]> {
    return this.getWithResilience<OrderItem[]>(`${this.url}/order/${orderId}`);
  }
}
