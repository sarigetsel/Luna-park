import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1596436889104-947806097606?w=1600&q=85',
    title: 'גלגל ענק מואר',
    subtitle: 'נוף לילי מרהיב על כל הפארק',
  },
  {
    image: 'https://images.unsplash.com/photo-1464305795204-6f5bbfc7ee81?w=1600&q=85',
    title: 'רכבת הרים אדרנלין',
    subtitle: 'ריגושים בלתי נשכחים',
  },
  {
    image: 'https://images.unsplash.com/photo-1572027632283-1b9349e7dd3b?w=1600&q=85',
    title: 'קרוסלה מלכותית',
    subtitle: 'קסם ואורות לכל המשפחה',
  },
  {
    image: 'https://images.unsplash.com/photo-1519046901590-f0d710f1cfeb?w=1600&q=85',
    title: 'עולם המים',
    subtitle: 'התרעננות וכיף בקיץ',
  },
  {
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=85',
    title: 'מופע לייזר לילי',
    subtitle: 'מוזיקה, אור וקסם',
  },
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  protected readonly slides = HERO_SLIDES;
  protected readonly activeSlide = signal(0);
  private intervalId?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.intervalId = setInterval(() => {
      this.activeSlide.update((i) => (i + 1) % this.slides.length);
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  protected goToSlide(index: number): void {
    this.activeSlide.set(index);
  }
}
