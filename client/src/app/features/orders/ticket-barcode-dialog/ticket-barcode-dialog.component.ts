import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-ticket-barcode-dialog',
  imports: [DatePipe, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>כרטיס כניסה</h2>
    <mat-dialog-content class="dialog-content">
      <p><strong>קוד:</strong> {{ data.ticketCode }}</p>
      <p><strong>תאריך ביקור:</strong> {{ data.chosenDate | date: 'dd/MM/yyyy' }}</p>
      @if (loading()) {
        <mat-spinner diameter="40" />
      } @else if (barcodeUrl()) {
        <img [src]="barcodeUrl()!" [alt]="'ברקוד ' + data.ticketCode" class="barcode-img" />
        <p class="hint">הציגו ברקוד זה בכניסה ללונה פארק</p>
      } @else {
        <p>לא ניתן לטעון ברקוד</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>סגור</button>
    </mat-dialog-actions>
  `,
  styles: `
    .dialog-content {
      text-align: center;
      min-width: 280px;
    }
    .barcode-img {
      max-width: 100%;
      margin: 1rem 0;
    }
    .hint {
      color: #666;
      font-size: 0.875rem;
    }
  `,
})
export class TicketBarcodeDialogComponent implements OnInit, OnDestroy {
  private readonly orderService = inject(OrderService);
  protected readonly data = inject<Order>(MAT_DIALOG_DATA);

  protected readonly loading = signal(true);
  protected readonly barcodeUrl = signal<string | null>(null);
  private objectUrl: string | null = null;

  ngOnInit(): void {
    if (!this.data.ticketCode) {
      this.loading.set(false);
      return;
    }
    this.orderService.getOrderBarcode(this.data._id).subscribe({
      next: (blob) => {
        this.objectUrl = URL.createObjectURL(blob);
        this.barcodeUrl.set(this.objectUrl);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }
}
