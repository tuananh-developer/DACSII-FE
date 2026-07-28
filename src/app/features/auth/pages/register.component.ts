import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  step = signal<1 | 2>(1);
  
  // Form fields
  email = signal('');
  password = signal('');
  full_name = signal('');
  phone_number = signal('');
  gender = signal('male');
  
  otpCode = signal('');
  
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  onInitiateRegister() {
    if (!this.email() || !this.password() || !this.full_name() || !this.phone_number()) {
      this.errorMessage.set('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    
    if (this.password().length < 8) {
      this.errorMessage.set('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    const userData = {
      email: this.email(),
      password: this.password(),
      full_name: this.full_name(),
      phone_number: this.phone_number(),
      gender: this.gender()
    };

    this.authService.registerInitiate(userData).subscribe({
      next: () => {
        this.step.set(2);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Đăng ký thất bại. Email hoặc SĐT có thể đã được sử dụng.');
        this.isLoading.set(false);
      }
    });
  }

  onCompleteRegister() {
    if (!this.otpCode()) {
      this.errorMessage.set('Vui lòng nhập mã OTP.');
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.authService.registerComplete(this.email(), this.otpCode()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']); // Về trang chủ sau khi đk xong
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
        this.isLoading.set(false);
      }
    });
  }
}
