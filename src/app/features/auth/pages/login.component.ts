import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  // Steps: 1 = Enter Email/Password, 2 = Verify OTP
  step = signal<1 | 2>(1);
  
  email = signal('');
  password = signal('');
  otpCode = signal('');
  
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private authService: AuthService, private router: Router) {}

  onInitiateLogin() {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.authService.loginInitiate(this.email(), this.password()).subscribe({
      next: () => {
        this.step.set(2);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
        this.isLoading.set(false);
      }
    });
  }

  onCompleteLogin() {
    if (!this.otpCode()) {
      this.errorMessage.set('Vui lòng nhập mã OTP');
      return;
    }
    
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.authService.loginComplete(this.email(), this.otpCode()).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/']); // Về trang chủ
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Mã OTP không hợp lệ.');
        this.isLoading.set(false);
      }
    });
  }
}
