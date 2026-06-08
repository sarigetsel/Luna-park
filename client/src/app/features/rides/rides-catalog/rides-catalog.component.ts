import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Ride } from '../../../core/models/ride.model';
import { RideService } from '../../../core/services/ride.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import {
  getDefaultParkImage,
  getLocalParkImages,
  getRidePublicImage,
} from '../../../core/constants/park-gallery';
import { environment } from '../../../../environments/environment';

const CATEGORY_LABELS: Record<string, string> = {
  thrill: 'ריגושים',
  family: 'משפחה',
  kids: 'ילדים',
  water: 'מים',
  show: 'מופע',
};

@Component({
  selector: 'app-rides-catalog',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './rides-catalog.component.html',
  styleUrl: './rides-catalog.component.scss',
})
export class RidesCatalogComponent implements OnInit {
  private readonly rideService = inject(RideService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);

  protected readonly rides = signal<Ride[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  private readonly localGalleryImages = getLocalParkImages();
  protected readonly fallbackRideImage = this.localGalleryImages[0] || getDefaultParkImage();

  protected categoryLabel(category?: string): string {
    return category ? (CATEGORY_LABELS[category] ?? category) : '—';
  }

  protected mediaUrl(path?: string): string {
    if (!path || path.startsWith('/uploads/images/')) {
      return getRidePublicImage();
    }
    if (path.startsWith('http')) {
      return path;
    }
    return `${environment.uploadsUrl}${path}`;
  }

  protected rideImage(ride: Ride): string {
    if (!ride.imageUrl || ride.imageUrl.startsWith('/uploads/images/')) {
      return getRidePublicImage(ride.name);
    }
    return this.mediaUrl(ride.imageUrl);
  }

  protected onRideImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;
    const current = img.src;
    const next = this.localGalleryImages.find((url) => url !== current) || this.fallbackRideImage;
    if (current !== next) {
      img.src = next;
    }
  }

  ngOnInit(): void {
    this.rideService.getRides().subscribe({
      next: (res) => {
        this.rides.set(res.rides);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('לא ניתן לטעון מתקנים. ודאו שהשרת פועל.');
        this.loading.set(false);
      },
    });
  }

  protected addToCart(ride: Ride): void {
    if (!this.auth.isCustomer()) {
      this.snackBar.open('יש להתחבר כלקוח כדי להוסיף לסל', 'סגור', { duration: 3000 });
      return;
    }
    if (ride.status !== 'active') {
      this.snackBar.open('המתקן אינו זמין להזמנה', 'סגור', { duration: 3000 });
      return;
    }
    this.cart.addRide(ride);
    this.snackBar.open(`${ride.name} נוסף לסל`, 'סגור', { duration: 2000 });
  }

  protected goToCheckout(): void {
    this.router.navigate(['/cart-checkout']);
  }
}
