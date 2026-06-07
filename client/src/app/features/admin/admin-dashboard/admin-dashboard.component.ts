import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { DatePipe } from '@angular/common';

import { Ride } from '../../../core/models/ride.model';
import { Coupon } from '../../../core/models/coupon.model';
import { RideService } from '../../../core/services/ride.service';
import { CouponService } from '../../../core/services/coupon.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatTabsModule,
    DatePipe,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly rideService = inject(RideService);
  private readonly couponService = inject(CouponService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly rides = signal<Ride[]>([]);
  protected readonly coupons = signal<Coupon[]>([]);
  protected readonly loadingRides = signal(true);
  protected readonly loadingCoupons = signal(true);
  protected readonly imagePreview = signal<string | null>(null);

  protected selectedImage: File | null = null;
  protected selectedAudio: File | null = null;

  protected readonly rideColumns = ['image', 'name', 'category', 'status', 'actions'];
  protected readonly couponColumns = [
    'image',
    'code',
    'discount',
    'expires',
    'usage',
    'active',
    'actions',
  ];

  protected readonly rideForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    description: [''],
    capacity: [4, [Validators.required, Validators.min(1)]],
    minimumHeight: [100, [Validators.required, Validators.min(0)]],
    category: ['family' as string, Validators.required],
    status: ['active' as 'active' | 'maintenance', Validators.required],
  });

  protected readonly couponForm = this.fb.nonNullable.group({
    code: ['', Validators.required],
    description: [''],
    discountPercent: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
    expiresAt: ['', Validators.required],
    usageLimit: [null as number | null],
    isActive: [true],
    imageUrl: [''],
  });

  ngOnInit(): void {
    this.loadRides();
    this.loadCoupons();
  }

  protected mediaUrl(path?: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${environment.uploadsUrl}${path}`;
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedImage = file ?? null;
    if (file) {
      this.imagePreview.set(URL.createObjectURL(file));
    } else {
      this.imagePreview.set(null);
    }
  }

  protected onAudioSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedAudio = input.files?.[0] ?? null;
  }

  protected loadRides(): void {
    this.loadingRides.set(true);
    this.rideService.getRides().subscribe({
      next: (res) => {
        this.rides.set(res.rides);
        this.loadingRides.set(false);
      },
      error: () => {
        this.loadingRides.set(false);
        this.snackBar.open('שגיאה בטעינת מתקנים', 'סגור', { duration: 3000 });
      },
    });
  }

  protected loadCoupons(): void {
    this.loadingCoupons.set(true);
    this.couponService.getCoupons().subscribe({
      next: (res) => {
        this.coupons.set(res.coupons);
        this.loadingCoupons.set(false);
      },
      error: () => {
        this.loadingCoupons.set(false);
        this.snackBar.open('שגיאה בטעינת קופונים', 'סגור', { duration: 3000 });
      },
    });
  }

  protected addRide(): void {
    if (this.rideForm.invalid) {
      this.rideForm.markAllAsTouched();
      return;
    }
    const formData = this.rideService.buildRideFormData(
      this.rideForm.getRawValue(),
      this.selectedImage ?? undefined,
      this.selectedAudio ?? undefined
    );
    this.rideService.createRide(formData).subscribe({
      next: () => {
        this.rideForm.reset({
          name: '',
          description: '',
          capacity: 4,
          minimumHeight: 100,
          category: 'family',
          status: 'active',
        });
        this.selectedImage = null;
        this.selectedAudio = null;
        this.imagePreview.set(null);
        this.loadRides();
        this.snackBar.open('מתקן נוסף בהצלחה', 'סגור', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'שגיאה בהוספת מתקן', 'סגור', { duration: 4000 });
      },
    });
  }

  protected deleteRide(id: string): void {
    this.rideService.deleteRide(id).subscribe({
      next: () => {
        this.loadRides();
        this.snackBar.open('מתקן נמחק', 'סגור', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'שגיאה במחיקת מתקן', 'סגור', { duration: 3000 });
      },
    });
  }

  protected addCoupon(): void {
    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }
    const raw = this.couponForm.getRawValue();
    this.couponService
      .createCoupon({
        code: raw.code,
        description: raw.description,
        discountPercent: raw.discountPercent,
        expiresAt: new Date(raw.expiresAt).toISOString(),
        usageLimit: raw.usageLimit,
        isActive: raw.isActive,
        imageUrl: raw.imageUrl,
      })
      .subscribe({
        next: () => {
          this.couponForm.reset({
            code: '',
            description: '',
            discountPercent: 10,
            expiresAt: '',
            usageLimit: null,
            isActive: true,
            imageUrl: '',
          });
          this.loadCoupons();
          this.snackBar.open('קופון נוסף בהצלחה', 'סגור', { duration: 3000 });
        },
        error: (err) => {
          this.snackBar.open(err.error?.message || 'שגיאה בהוספת קופון', 'סגור', { duration: 4000 });
        },
      });
  }

  protected deleteCoupon(id: string): void {
    this.couponService.deleteCoupon(id).subscribe({
      next: () => {
        this.loadCoupons();
        this.snackBar.open('קופון נמחק', 'סגור', { duration: 3000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'שגיאה במחיקת קופון', 'סגור', { duration: 3000 });
      },
    });
  }

  protected toggleCoupon(coupon: Coupon): void {
    this.couponService.updateCoupon(coupon._id, { isActive: !coupon.isActive }).subscribe({
      next: () => this.loadCoupons(),
      error: (err) => {
        this.snackBar.open(err.error?.message || 'שגיאה בעדכון קופון', 'סגור', { duration: 3000 });
      },
    });
  }
}
