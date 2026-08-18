import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/pages/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'field/:id',
    loadComponent: () => import('./features/field/pages/field-detail.component').then(m => m.FieldDetailComponent)
  },
  {
    path: 'booking/checkout',
    loadComponent: () => import('./features/booking/pages/booking-checkout/booking-checkout.component').then(m => m.BookingCheckoutComponent)
  },
  {
    path: 'booking/success',
    loadComponent: () => import('./features/booking/pages/booking-success/booking-success.component').then(m => m.BookingSuccessComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/pages/admin.component').then(m => m.AdminComponent)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/pages/profile-layout/profile-layout.component').then(m => m.ProfileLayoutComponent),
    children: [
      { path: '', redirectTo: 'info', pathMatch: 'full' },
      {
        path: 'info',
        loadComponent: () => import('./features/profile/pages/profile-info/profile-info.component').then(m => m.ProfileInfoComponent)
      },
      {
        path: 'bookings',
        loadComponent: () => import('./features/profile/pages/profile-bookings/profile-bookings.component').then(m => m.ProfileBookingsComponent)
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./features/profile/pages/profile-wishlist/profile-wishlist.component').then(m => m.ProfileWishlistComponent)
      }
    ]
  }
];
