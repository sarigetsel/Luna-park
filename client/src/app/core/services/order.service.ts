import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateOrderDto, Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  createOrder(data: CreateOrderDto): Observable<{
    order: Order;
    message?: string;
    emailSent?: boolean;
    emailHint?: string;
  }> {
    return this.http.post<{
      order: Order;
      message?: string;
      emailSent?: boolean;
      emailHint?: string;
    }>(`${environment.apiUrl}/orders`, data);
  }

  getOrderBarcode(orderId: string) {
    return this.http.get(`${environment.apiUrl}/orders/my-orders/${orderId}/barcode`, {
      responseType: 'blob',
    });
  }

  getMyOrders(): Observable<{ orders: Order[] }> {
    return this.http.get<{ orders: Order[] }>(`${environment.apiUrl}/orders/my-orders`);
  }

  getAllOrders(): Observable<{ orders: Order[] }> {
    return this.http.get<{ orders: Order[] }>(`${environment.apiUrl}/orders`);
  }
}
