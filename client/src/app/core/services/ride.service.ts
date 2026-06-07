import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Ride } from '../models/ride.model';

@Injectable({ providedIn: 'root' })
export class RideService {
  private readonly http = inject(HttpClient);

  getRides(status?: string): Observable<{ rides: Ride[] }> {
    const params = status ? { status } : undefined;
    return this.http.get<{ rides: Ride[] }>(`${environment.apiUrl}/rides`, { params });
  }

  getRide(id: string): Observable<{ ride: Ride }> {
    return this.http.get<{ ride: Ride }>(`${environment.apiUrl}/rides/${id}`);
  }

  createRide(formData: FormData): Observable<{ ride: Ride }> {
    return this.http.post<{ ride: Ride }>(`${environment.apiUrl}/rides`, formData);
  }

  updateRide(id: string, formData: FormData): Observable<{ ride: Ride }> {
    return this.http.put<{ ride: Ride }>(`${environment.apiUrl}/rides/${id}`, formData);
  }

  deleteRide(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/rides/${id}`);
  }

  buildRideFormData(values: Partial<Ride>, image?: File, audio?: File): FormData {
    const fd = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value != null && key !== '_id' && key !== 'imageUrl' && key !== 'audioUrl') {
        fd.append(key, String(value));
      }
    });
    if (image) fd.append('image', image);
    if (audio) fd.append('audio', audio);
    return fd;
  }
}
