import { Injectable, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable, tap } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface Field {
  id: string;
  name: string;
  description: string;
  price: number;
  latitude: number;
  longitude: number;
  address: string;
  rating?: number;
  reviewsCount?: number;
  images?: any[];
  imageUrl?: string;
  distance?: string;
  isSaved?: boolean;
  isGuestFavorite?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FieldService {
  fields = signal<Field[]>([]);
  isLoading = signal<boolean>(false);

  constructor(private api: ApiService) {}

  getFields(filters?: any): Observable<any> {
    this.isLoading.set(true);
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.api.get('/fields', params).pipe(
      tap({
        next: (res: any) => {
          // Backend response structure might vary (res.data or just res array)
          const data = res.data || res.items || res;
          if (Array.isArray(data)) {
            // Transform data to fit frontend needs
            const formatted = data.map((item: any) => ({
              ...item,
              imageUrl: item.images && item.images.length > 0 ? item.images[0].url : 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop',
              rating: item.rating || 4.8,
              reviewsCount: item.reviewsCount || 124,
              price: item.base_price || item.price || 250000,
              distance: item.distance ? `${item.distance.toFixed(1)} km` : '1.2 km',
              isSaved: false,
              isGuestFavorite: Math.random() > 0.7
            }));
            this.fields.set(formatted);
          }
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      })
    );
  }

  getFieldDetails(id: string): Observable<Field> {
    return this.api.get(`/fields/${id}`);
  }
}
