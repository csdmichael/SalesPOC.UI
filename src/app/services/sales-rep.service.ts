import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SalesRep } from '../models/sales-rep.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SalesRepService {
  private url = `${environment.apiBaseUrl}/SalesReps`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SalesRep[]> {
    return this.http.get<SalesRep[]>(this.url);
  }

  getById(id: number): Observable<SalesRep> {
    return this.http.get<SalesRep>(`${this.url}/${id}`);
  }

  getByRegion(region: string): Observable<SalesRep[]> {
    return this.http.get<SalesRep[]>(`${this.url}/region/${encodeURIComponent(region)}`);
  }
}
