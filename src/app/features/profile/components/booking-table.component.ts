import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BookingHistoryItem } from '../models/profile.model';

@Component({
  selector: 'app-booking-table',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="overflow-x-auto rounded-[12px] border border-[#e3e8ee] bg-white shadow-[0_1px_3px_rgba(0,55,112,0.08)]">
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-[#f6f9fc] border-b border-[#e3e8ee]">
            <th class="px-6 py-4 text-[13px] font-semibold text-[#64748d] uppercase tracking-wider">Mã / Ngày</th>
            <th class="px-6 py-4 text-[13px] font-semibold text-[#64748d] uppercase tracking-wider">Sân bóng & Khung giờ</th>
            <th class="px-6 py-4 text-[13px] font-semibold text-[#64748d] uppercase tracking-wider text-right">Tổng tiền (VND)</th>
            <th class="px-6 py-4 text-[13px] font-semibold text-[#64748d] uppercase tracking-wider text-center">Trạng thái</th>
            <th class="px-6 py-4 text-[13px] font-semibold text-[#64748d] uppercase tracking-wider text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-[#e3e8ee]">
          <tr *ngFor="let booking of bookings" class="hover:bg-[#f8fafc] transition-colors">
            
            <!-- Code & Date -->
            <td class="px-6 py-4">
              <div class="text-[14px] font-medium text-[#0d253d]">{{ booking.id }}</div>
              <div class="text-[13px] text-[#64748d] mt-0.5">{{ booking.date | date:'dd/MM/yyyy' }}</div>
            </td>
            
            <!-- Field Info -->
            <td class="px-6 py-4">
              <div class="text-[15px] font-medium text-[#533afd] hover:underline cursor-pointer" [routerLink]="['/fields', booking.fieldId]">{{ booking.fieldName }}</div>
              <div class="text-[13px] text-[#64748d] mt-0.5 tabular-nums">{{ booking.timeSlots }}</div>
            </td>
            
            <!-- Price -->
            <td class="px-6 py-4 text-right">
              <div class="text-[15px] font-medium text-[#0d253d] tabular-nums">₫{{ booking.totalPrice | number:'1.0-0' }}</div>
            </td>
            
            <!-- Status Pill -->
            <td class="px-6 py-4 text-center">
              <span class="inline-flex items-center justify-center px-3 py-1 text-[12px] font-semibold rounded-full"
                [ngClass]="{
                  'bg-[#e2e8f0] text-[#475569]': booking.status === 'UPCOMING',
                  'bg-[#dcfce7] text-[#166534]': booking.status === 'COMPLETED',
                  'bg-[#fee2e2] text-[#991b1b]': booking.status === 'CANCELLED'
                }">
                {{ booking.status === 'UPCOMING' ? 'SẮP TỚI' : (booking.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY') }}
              </span>
            </td>
            
            <!-- Actions -->
            <td class="px-6 py-4 text-center">
              <div class="flex justify-center items-center gap-2">
                <button *ngIf="booking.status === 'COMPLETED' && !booking.isReviewed" 
                        (click)="onReview.emit(booking)" 
                        class="px-3 py-1.5 text-[13px] font-medium bg-[#533afd] hover:bg-[#4434d4] text-white rounded-[6px] transition-colors shadow-sm">
                  Đánh giá
                </button>
                <span *ngIf="booking.status === 'COMPLETED' && booking.isReviewed" class="text-[13px] text-[#64748d] italic px-3 py-1.5">
                  Đã đánh giá
                </span>
                <button class="px-3 py-1.5 text-[13px] font-medium border border-[#e3e8ee] hover:bg-[#f6f9fc] text-[#0d253d] rounded-[6px] transition-colors">
                  Chi tiết
                </button>
              </div>
            </td>

          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class BookingTableComponent {
  @Input() bookings: BookingHistoryItem[] = [];
  @Output() onReview = new EventEmitter<BookingHistoryItem>();
}
