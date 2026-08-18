import { Injectable, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable, tap } from 'rxjs';
import { HttpParams } from '@angular/common/http';

export interface Field {
  id: string;
  name: string;
  description?: string;
  price?: number;
  base_price?: number;
  latitude?: number;
  longitude?: number;
  address?: string;
  rating?: number | null;
  reviewsCount?: number;
  images?: any[];
  imageUrl?: string;
  distance?: string;
  isSaved?: boolean;
  isGuestFavorite?: boolean;
  fieldType?: any;
  field_type?: any;
  fieldTypeName?: string;
  branch?: any;
  branchName?: string;
  utilities?: any[];
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
          const data = res.data || res.items || res;
          if (Array.isArray(data)) {
            const formatted = data.map((item: any) => {
              const imagesList = item.images && Array.isArray(item.images) ? item.images : [];
              const primaryImg = imagesList.find((img: any) => img.is_primary)?.url || (imagesList.length > 0 ? imagesList[0].url : null);
              const branchAddress = item.branch?.address 
                ? `${item.branch.address.street ? item.branch.address.street + ', ' : ''}${item.branch.address.ward_name ? item.branch.address.ward_name + ', ' : ''}${item.branch.address.city_name || ''}`.replace(/,\s*$/, '')
                : (item.address || item.branch?.name || 'Chưa cập nhật địa chỉ');

              return {
                ...item,
                images: imagesList,
                imageUrl: primaryImg || item.imageUrl || 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop',
                rating: item.rating !== undefined && item.rating !== null ? Number(item.rating) : null,
                reviewsCount: item.reviewsCount !== undefined && item.reviewsCount !== null ? Number(item.reviewsCount) : (Array.isArray(item.reviews) ? item.reviews.length : 0),
                price: item.base_price !== undefined ? Number(item.base_price) : (item.price !== undefined ? Number(item.price) : 0),
                address: branchAddress,
                distance: item.distance !== undefined && item.distance !== null ? `${Number(item.distance).toFixed(1)} km` : undefined,
                isSaved: false,
                isGuestFavorite: item.isGuestFavorite || false
              };
            });
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

  getLocations(): Observable<any[]> {
    return this.api.get('/locations/cities');
  }

  getBranches(): Observable<any[]> {
    return this.api.get('/branches');
  }

  getFieldTypes(): Observable<any[]> {
    return this.api.get('/field-types');
  }

  getFieldReviews(fieldId: string): Observable<any[]> {
    return this.api.get(`/reviews/field/${fieldId}`);
  }

  createField(payload: any): Observable<any> {
    return this.api.post('/fields', payload);
  }

  updateField(id: string, payload: any): Observable<any> {
    return this.api.put(`/fields/${id}`, payload);
  }

  deleteField(id: string): Observable<any> {
    return this.api.delete(`/fields/${id}`);
  }
}

