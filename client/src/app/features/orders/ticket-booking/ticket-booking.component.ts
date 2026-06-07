import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { CouponService } from '../../../core/services/coupon.service';

const FULL_DAY_PRICE = 50;
const HOURLY_RATE = 15;
const PARK_OPEN_HOUR = 9;
const PARK_CLOSE_HOUR = 22;

@Component({
  selector: 'app-ticket-booking',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatDatepickerModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './ticket-booking.component.html',
  styleUrl: './ticket-booking.component.scss',
})
export class TicketBookingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly couponService = inject(CouponService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly paying = signal(false);
  protected readonly paymentDone = signal(false);
  protected readonly discountPercent = signal<number | null>(null);
  protected readonly couponMessage = signal<string | null>(null);
  protected readonly PARK_OPEN_HOUR = PARK_OPEN_HOUR;
  protected readonly PARK_CLOSE_HOUR = PARK_CLOSE_HOUR;
  protected readonly hourOptions = Array.from(
    { length: PARK_CLOSE_HOUR - PARK_OPEN_HOUR + 1 },
    (_, i) => PARK_OPEN_HOUR + i
  );

  protected readonly form = this.fb.nonNullable.group({
    chosenDate: [null as Date | null, Validators.required],
    ticketType: ['full_day' as 'full_day' | 'hourly', Validators.required],
    startHour: [PARK_OPEN_HOUR],
    endHour: [12],
    couponCode: [''],
    cardName: ['', [Validators.required, Validators.minLength(2)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
    expiry: ['', [Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3}$/)]],
  });

  protected readonly ticketType = toSignal(this.form.controls.ticketType.valueChanges, {
    initialValue: this.form.controls.ticketType.value,
  });

  protected readonly startHour = toSignal(this.form.controls.startHour.valueChanges, {
    initialValue: this.form.controls.startHour.value,
  });

  protected readonly endHour = toSignal(this.form.controls.endHour.valueChanges, {
    initialValue: this.form.controls.endHour.value,
  });

  protected readonly isHourly = computed(() => this.ticketType() === 'hourly');

  protected readonly endHourOptions = computed(() => {
    const start = this.startHour();
    return this.hourOptions.filter((hour) => hour > start);
  });

  protected readonly hoursCount = computed(() => {
    const start = this.startHour();
    const end = this.endHour();
    return end > start ? end - start : 0;
  });

  protected readonly basePrice = computed(() => {
    if (this.isHourly()) {
      return HOURLY_RATE * this.hoursCount();
    }
    return FULL_DAY_PRICE;
  });

  protected readonly discountApplied = computed(() => {
    const percent = this.discountPercent();
    if (!percent) {
      return 0;
    }
    return Math.round(this.basePrice() * (percent / 100) * 100) / 100;
  });

  protected readonly finalPrice = computed(() => {
    return Math.round((this.basePrice() - this.discountApplied()) * 100) / 100;
  });

  ngOnInit(): void {
    this.form.controls.startHour.valueChanges.subscribe((start) => {
      if (this.form.controls.endHour.value <= start) {
        this.form.controls.endHour.setValue(Math.min(start + 1, PARK_CLOSE_HOUR));
      }
    });
  }

  protected formatHour(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
  }

  protected formatCardNumber(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    this.form.controls.cardNumber.setValue(digits, { emitEvent: false });
  }

  protected formatExpiry(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
    this.form.controls.expiry.setValue(formatted, { emitEvent: false });
  }

  applyCoupon(): void {
    const code = this.form.controls.couponCode.value.trim();
    if (!code) {
      this.discountPercent.set(null);
      this.couponMessage.set(null);
      return;
    }

    this.couponService.validateCode(code).subscribe({
      next: (res) => {
        if (res.valid && res.discountPercent) {
          this.discountPercent.set(res.discountPercent);
          this.couponMessage.set(`קופון הוחל: ${res.discountPercent}% הנחה`);
        } else {
          this.discountPercent.set(null);
          this.couponMessage.set(res.message || 'קופון לא תקין');
        }
      },
      error: (err) => {
        this.discountPercent.set(null);
        this.couponMessage.set(err.error?.message || 'לא ניתן לאמת את הקופון');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const chosenDate = raw.chosenDate;
    if (!chosenDate) {
      return;
    }

    if (raw.ticketType === 'hourly' && raw.endHour <= raw.startHour) {
      this.snackBar.open('שעת הסיום חייבת להיות אחרי שעת ההתחלה', 'סגור', { duration: 4000 });
      return;
    }

    this.paying.set(true);
    this.paymentDone.set(false);

    setTimeout(() => {
      this.paymentDone.set(true);
      this.orderService
        .createOrder({
          ticketType: raw.ticketType,
          chosenDate: chosenDate.toISOString(),
          startHour: raw.ticketType === 'hourly' ? raw.startHour : undefined,
          endHour: raw.ticketType === 'hourly' ? raw.endHour : undefined,
          couponCode: raw.couponCode.trim() || undefined,
        })
        .subscribe({
          next: (res) => {
            this.paying.set(false);
            let msg = res.message || 'ההזמנה בוצעה בהצלחה';
            if (!res.emailSent) {
              msg += ' — לחצי "הצג ברקוד" בהזמנות שלי.';
            }
            this.snackBar.open(msg, 'סגור', { duration: 7000 });
            this.router.navigate(['/my-orders']);
          },
          error: (err) => {
            this.paying.set(false);
            this.paymentDone.set(false);
            const message = err.error?.message || 'ההזמנה נכשלה';
            this.snackBar.open(message, 'סגור', { duration: 5000 });
          },
        });
    }, 1500);
  }
}
