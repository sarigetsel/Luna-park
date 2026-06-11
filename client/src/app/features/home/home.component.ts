import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { AuthService } from '../../core/services/auth.service';
import { RideService } from '../../core/services/ride.service';
import { Ride } from '../../core/models/ride.model';
import {
  getDefaultParkImage,
  getHeroSlides,
  getRidePublicImage,
  HeroSlide,
} from '../../core/constants/park-gallery';
import { environment } from '../../../environments/environment';

const CATEGORY_LABELS: Record<string, string> = {
  thrill: 'ריגושים',
  family: 'משפחה',
  kids: 'ילדים',
  water: 'מים',
  show: 'מופע',
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatCardModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly rideService = inject(RideService);

  protected readonly slides = getHeroSlides();
  protected readonly activeSlide = signal(0);
  protected readonly featuredRides = signal<Ride[]>([]);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected categoryLabel(category?: string): string {
    return category ? (CATEGORY_LABELS[category] ?? category) : '—';
  }

  protected mediaUrl(path?: string): string {
    if (!path) return getDefaultParkImage();
    if (path.startsWith('http')) return path;
    return `${environment.uploadsUrl}${path}`;
  }

  protected rideImage(ride: Ride): string {
    if (!ride.imageUrl || ride.imageUrl.startsWith('/uploads/images/')) {
      return getRidePublicImage(ride.name);
    }
    return this.mediaUrl(ride.imageUrl);
  }

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.activeSlide.update((i) => (i + 1) % this.slides.length);
    }, 5000);

    this.rideService.getRides().subscribe({
      next: (res) => {
        const active = res.rides.filter((r) => r.status === 'active');
        const picked: Ride[] = [];
        const categories = ['thrill', 'family', 'water', 'kids', 'show'];

        for (const cat of categories) {
          if (picked.length >= 3) break;
          const ride = active.find((r) => r.category === cat && !picked.includes(r));
          if (ride) picked.push(ride);
        }

        while (picked.length < 3 && picked.length < active.length) {
          const next = active.find((r) => !picked.includes(r));
          if (!next) break;
          picked.push(next);
        }

        this.featuredRides.set(picked);
      },
    });
  }

  ngOnDestroy(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  protected goToSlide(index: number): void {
    this.activeSlide.set(index);
  }

  protected trackSlide(_index: number, slide: HeroSlide): string {
    return slide.image;
  }
}
