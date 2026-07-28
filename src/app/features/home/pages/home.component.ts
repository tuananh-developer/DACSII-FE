import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Field {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  reviewsCount: number;
  price: number;
  imageUrl: string;
  isGuestFavorite: boolean;
  isSaved: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  // Search state
  searchQuery = signal('');
  searchLocation = signal('');
  searchType = signal('');
  searchDate = signal('');

  // Mock data for fields
  fields = signal<Field[]>([
    {
      id: '1',
      name: 'Sân bóng Chảo Lửa',
      address: '30 Phan Thúc Duyện, Tân Bình',
      distance: 'Cách 2.5 km',
      rating: 4.85,
      reviewsCount: 124,
      price: 250000,
      imageUrl: 'https://images.unsplash.com/photo-1529900965600-70f90e542af1?q=80&w=800&auto=format&fit=crop',
      isGuestFavorite: true,
      isSaved: false
    },
    {
      id: '2',
      name: 'Sân bóng đá Mini K34',
      address: 'Đường A4, Quận Tân Bình',
      distance: 'Cách 3.1 km',
      rating: 4.92,
      reviewsCount: 89,
      price: 300000,
      imageUrl: 'https://images.unsplash.com/photo-1518605368461-1ee06b2b4bc6?q=80&w=800&auto=format&fit=crop',
      isGuestFavorite: true,
      isSaved: true
    },
    {
      id: '3',
      name: 'Sân vận động Phú Thọ',
      address: '219 Lý Thường Kiệt, Quận 11',
      distance: 'Cách 4.0 km',
      rating: 4.65,
      reviewsCount: 342,
      price: 450000,
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbad11303?q=80&w=800&auto=format&fit=crop',
      isGuestFavorite: false,
      isSaved: false
    },
    {
      id: '4',
      name: 'Sân cỏ nhân tạo Thăng Long',
      address: 'Hẻm 12 Thăng Long, Tân Bình',
      distance: 'Cách 1.2 km',
      rating: 4.78,
      reviewsCount: 56,
      price: 200000,
      imageUrl: 'https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=800&auto=format&fit=crop',
      isGuestFavorite: false,
      isSaved: false
    }
  ]);

  toggleSave(field: Field, event: Event) {
    event.stopPropagation();
    field.isSaved = !field.isSaved;
    // Cập nhật lại mảng để trigger change detection nếu cần (với signal object property, Angular 17+ deep tracking có thể handle, nhưng map lại cho chắc)
    this.fields.update(arr => [...arr]);
  }

  onSearch() {
    console.log('Searching for:', {
      query: this.searchQuery(),
      location: this.searchLocation(),
      type: this.searchType(),
      date: this.searchDate()
    });
  }
}
