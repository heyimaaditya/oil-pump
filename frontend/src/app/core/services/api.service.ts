import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginatedResponse, PressureData, MaterialData, FluidData } from '../models/equipment-data.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl; 

  private getData<T>(endpoint: string, page: number, limit: number): Observable<PaginatedResponse<T>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
 
    return this.http.get<PaginatedResponse<T>>(`${this.apiUrl}/${endpoint}`, { params });
  }

  getPressureData(page: number, limit: number): Observable<PaginatedResponse<PressureData>> {
    return this.getData<PressureData>('pressure', page, limit);
  }

  getMaterialData(page: number, limit: number): Observable<PaginatedResponse<MaterialData>> {
     return this.getData<MaterialData>('material', page, limit);
  }

  getFluidData(page: number, limit: number): Observable<PaginatedResponse<FluidData>> {
     return this.getData<FluidData>('fluid', page, limit);
  }
}