import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './booking-success.component.html'
})
export class BookingSuccessComponent implements OnInit {
  bookingId = signal<string | null>(null);

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.bookingId.set(params['id']);
      }
      // Depending on actual payment gateway, handle VNPay parameters (vnp_ResponseCode)
    });
  }
}
