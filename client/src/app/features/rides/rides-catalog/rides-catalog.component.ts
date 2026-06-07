import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

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

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80';

@Component({
  selector: 'app-rides-catalog',
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './rides-catalog.component.html',
  styleUrl: './rides-catalog.component.scss',
})
export class RidesCatalogComponent implements OnInit {
  private readonly rideService = inject(RideService);
  protected readonly auth = inject(AuthService);

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

  protected mediaUrl(path?: string): string {
    if (!path) return PLACEHOLDER_IMAGE;
    if (path.startsWith('http')) return path;
    return `${environment.uploadsUrl}${path}`;
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
