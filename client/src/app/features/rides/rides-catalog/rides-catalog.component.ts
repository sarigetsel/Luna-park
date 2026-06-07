import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

import { Ride } from '../../../core/models/ride.model';
import { RideService } from '../../../core/services/ride.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

const CATEGORY_LABELS: Record<string, string> = {
  thrill: 'ריגושים',
  family: 'משפחה',
  kids: 'ילדים',
  water: 'מים',
  show: 'מופע',
};

const CATEGORY_IMAGES: Record<string, string> = {
  thrill: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7ee81?w=800&q=85',
  family: 'https://images.unsplash.com/photo-1596436889104-947806097606?w=800&q=85',
  kids: 'https://images.unsplash.com/photo-1572027632283-1b9349e7dd3b?w=800&q=85',
  water: 'https://images.unsplash.com/photo-1519046901590-f0d710f1cfeb?w=800&q=85',
  show: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=85',
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1566576911261-2afccef60066?w=800&q=85';

@Component({
  selector: 'app-rides-catalog',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatIconModule,
  ],
  templateUrl: './rides-catalog.component.html',
  styleUrl: './rides-catalog.component.scss',
})
export class RidesCatalogComponent implements OnInit {
  private readonly rideService = inject(RideService);
  protected readonly auth = inject(AuthService);
  protected readonly uploadsUrl = environment.uploadsUrl;

  protected readonly rides = signal<Ride[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly displayedColumns = [
    'image',
    'name',
    'category',
    'capacity',
    'minHeight',
    'status',
  ];

  protected categoryLabel(category?: string): string {
    return category ? (CATEGORY_LABELS[category] ?? category) : '—';
  }

  protected categoryClass(category?: string): string {
    return category ? `cat-${category}` : '';
  }

  protected mediaUrl(ride: Ride): string {
    if (ride.imageUrl) {
      if (ride.imageUrl.startsWith('http')) return ride.imageUrl;
      return `${environment.uploadsUrl}${ride.imageUrl}`;
    }
    if (ride.category && CATEGORY_IMAGES[ride.category]) {
      return CATEGORY_IMAGES[ride.category];
    }
    return DEFAULT_IMAGE;
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
}
