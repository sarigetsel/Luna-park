import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { Order, RideRef } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-history',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.scss',
})
export class OrderHistoryComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly loading = signal(true);
  protected readonly orders = signal<Order[]>([]);
  protected readonly displayedColumns = [
    'chosenDate',
    'ticketType',
    'ride',
    'coupon',
    'totalPrice',
    'discount',
    'finalPrice',
    'status',
  ];

  ngOnInit(): void {
    this.orderService.getMyOrders().subscribe({
      next: (res) => {
        this.orders.set(res.orders);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message || 'Failed to load orders', 'Close', {
          duration: 4000,
        });
      },
    });
  }

  rideName(ride: Order['rideId']): string {
    if (!ride) {
      return '—';
    }
    if (typeof ride === 'string') {
      return ride;
    }
    return (ride as RideRef).name || '—';
  }
}
