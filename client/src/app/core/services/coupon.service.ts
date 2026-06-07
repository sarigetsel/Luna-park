import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CouponValidation } from '../models/order.model';
import { Coupon, CreateCouponDto } from '../models/coupon.model';

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly http = inject(HttpClient);

  validateCode(code: string): Observable<CouponValidation> {
    return this.http.get<CouponValidation>(`${environment.apiUrl}/coupons/validate`, {
      params: { code },
    });
  }

  getCoupons(): Observable<{ coupons: Coupon[] }> {
    return this.http.get<{ coupons: Coupon[] }>(`${environment.apiUrl}/coupons`);
  }

  createCoupon(data: CreateCouponDto): Observable<{ coupon: Coupon }> {
    return this.http.post<{ coupon: Coupon }>(`${environment.apiUrl}/coupons`, data);
  }

  updateCoupon(id: string, data: Partial<CreateCouponDto>): Observable<{ coupon: Coupon }> {
    return this.http.put<{ coupon: Coupon }>(`${environment.apiUrl}/coupons/${id}`, data);
  }

  deleteCoupon(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/coupons/${id}`);
  }
}
