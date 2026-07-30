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

  // Form fields
  name = signal('');
  phone = signal('');
  email = signal('');
  dateOfBirth = signal('');
  gender = signal<'male' | 'female' | 'other' | undefined>(undefined);
  bio = signal('');

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.profileService.getProfile().subscribe(data => {
      this.profile.set(data);
      this.name.set(data.name || '');
      this.phone.set(data.phone || '');
      this.email.set(data.email || '');
      this.dateOfBirth.set(data.dateOfBirth || '');
      this.gender.set(data.gender);
      this.bio.set(data.bio || '');
    });
  }

  save() {
    this.isSaving.set(true);
    this.profileService.updateProfile({
      name: this.name(),
      phone: this.phone(),
      email: this.email(),
      dateOfBirth: this.dateOfBirth() || undefined,
      gender: this.gender(),
      bio: this.bio() || undefined
    }).subscribe(updated => {
      this.profile.set(updated);
      this.isSaving.set(false);
      // Show success toast or message
    });
  }
}
