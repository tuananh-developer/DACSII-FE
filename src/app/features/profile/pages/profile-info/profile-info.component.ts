import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../../services/profile.service';
import { UserProfile } from '../../models/profile.model';

@Component({
  selector: 'app-profile-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-info.component.html'
})
export class ProfileInfoComponent implements OnInit {
  profile = signal<UserProfile | null>(null);
  isSaving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Form fields
  name = signal('');
  phone = signal('');
  email = signal('');
  dateOfBirth = signal('');
  gender = signal<'male' | 'female' | 'other' | undefined>(undefined);
  bio = signal('');

  isGenderDropdownOpen = signal(false);

  selectGender(gender: 'male' | 'female' | 'other') {
    this.gender.set(gender);
    this.isGenderDropdownOpen.set(false);
  }

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile.set(data);
        this.name.set(data.name || '');
        this.phone.set(data.phone || '');
        this.email.set(data.email || '');
        this.dateOfBirth.set(data.dateOfBirth || '');
        this.gender.set(data.gender);
        this.bio.set(data.bio || '');
      },
      error: (err) => {
        this.errorMessage.set('Không thể tải thông tin hồ sơ. Vui lòng đăng nhập lại.');
      }
    });
  }

  save() {
    this.isSaving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    const payload: Partial<UserProfile> = {
      name: this.name().trim() || undefined,
      gender: this.gender(),
      bio: this.bio().trim() || undefined
    };

    if (this.phone().trim()) {
      payload.phone = this.phone().trim();
    }
    if (this.dateOfBirth()) {
      payload.dateOfBirth = this.dateOfBirth();
    }

    this.profileService.updateProfile(payload).subscribe({
      next: (updated) => {
        this.profile.set(updated);
        this.isSaving.set(false);
        this.successMessage.set('Cập nhật hồ sơ thành công!');
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        this.isSaving.set(false);
        let msg = 'Đã có lỗi xảy ra khi cập nhật hồ sơ.';
        if (err.error?.message) {
          if (Array.isArray(err.error.message)) {
            msg = err.error.message.join(', ');
          } else {
            msg = err.error.message;
          }
        } else if (err.status === 400) {
          msg = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại ngày sinh hoặc số điện thoại.';
        } else if (err.status === 401) {
          msg = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        }
        this.errorMessage.set(msg);
        setTimeout(() => this.errorMessage.set(null), 6000);
      }
    });
  }
}
