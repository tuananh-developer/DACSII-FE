import { Component, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnDestroy {
  // Steps: 1 = Enter Email/Password, 2 = Verify OTP
  step = signal<1 | 2>(1);
  
  email = signal('');
  password = signal('');
  otpCode = signal('');
  
  isLoading = signal(false);
  errorMessage = signal('');

  private messageListener: any;

  constructor(private authService: AuthService, private router: Router) {
    this.messageListener = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageListener);
  }

  ngOnDestroy() {
    window.removeEventListener('message', this.messageListener);
  }

  loginWithGoogle() {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const url = `${environment.apiUrl}/auth/google`;
    
    window.open(url, 'Google Login', `width=${width},height=${height},left=${left},top=${top}`);
  }

  handleMessage(event: MessageEvent) {
    if (event.data && event.data.accessToken && event.data.user) {
      this.authService.setAuthData(event.data.accessToken, event.data.user);
      this.router.navigate(['/']);
    }
  }

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
