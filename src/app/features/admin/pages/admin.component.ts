import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { CrudTableComponent, ColumnDefinition } from '../../../shared/components/crud-table/crud-table.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../auth/services/auth.service';
import { FieldService } from '../../home/services/field.service';

export interface CourtStatusItem {
  id: string; // raw UUID
  displayId: string;
  name: string;
  fieldTypeId?: string;
  fieldTypeName: string;
  branchId?: string;
  branchName: string;
  address: string;
  pricePerHour: number;
  isActive: boolean;
  
  // Real-time status
  status: 'IN_PROGRESS' | 'AVAILABLE';
  
  // Current active match (if IN_PROGRESS)
  currentMatch?: {
    bookingId: string;
    customerName: string;
    customerPhone: string;
    startTime: string;
    endTime: string;
    startMs: number;
    endMs: number;
    paymentStatus: 'PAID' | 'UNPAID';
    totalPrice: number;
    remainingSeconds: number;
    remainingMinutes: number;
    remainingSecondsInMinute: number;
    remainingFormatted: string;
    progressPercent: number;
  };
  
  // Next match today (if any)
  nextMatch?: {
    bookingId: string;
    customerName: string;
    customerPhone: string;
    startTime: string;
    endTime: string;
    startMs: number;
  } | null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, CrudTableComponent],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit, OnDestroy {
  activeTab: 'OVERVIEW' | 'FIELDS' | 'USERS' | 'BOOKINGS' = 'OVERVIEW';
  
  // Dashboard Metrics
  revenue = 0;
  bookings = 0;
  activePitchesCount = 0;
  availablePitchesCount = 0;

  // Real-time Court Monitoring State
  courtStatuses: CourtStatusItem[] = [];
  filteredCourtStatuses: CourtStatusItem[] = [];
  courtFilterStatus: 'ALL' | 'IN_PROGRESS' | 'AVAILABLE' = 'ALL';
  courtFilterType: string = 'ALL';
  courtSearchQuery: string = '';

  // Backend Dynamic Data (No mock)
  fieldTypes: any[] = [];
  branches: any[] = [];
  locations: any[] = [];
  rawBookings: any[] = [];
  
  // Generic Tables Configs
  fieldColumns: ColumnDefinition[] = [
    { key: 'displayId', header: 'Mã Sân' },
    { key: 'name', header: 'Tên Sân' },
    { key: 'fieldTypeName', header: 'Loại Sân' },
    { key: 'price', header: 'Giá / Giờ', type: 'currency' },
    { key: 'address', header: 'Khu vực / Chi nhánh' },
    { key: 'status', header: 'Trạng thái', type: 'status' }
  ];
  
  fieldsData: any[] = [];

  userColumns: ColumnDefinition[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Họ tên' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Vai trò' },
    { key: 'status', header: 'Trạng thái', type: 'status' }
  ];

  usersData: any[] = [];

  // Form State
  showFieldForm = false;
  fieldForm: FormGroup;
  editingFieldId: string | null = null;
  isSavingField = false;

  // Quick Action Modal State
  selectedCourtForAction: CourtStatusItem | null = null;
  showQuickBookModal = false;
  quickBookForm: FormGroup;

  // Live Timer Interval
  private timerInterval: any = null;

  constructor(
    private fb: FormBuilder, 
    private api: ApiService,
    public authService: AuthService,
    private fieldService: FieldService
  ) {
    this.fieldForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      field_type_id: ['', Validators.required],
      branch_id: [''],
      address: [''],
      description: [''],
      status: ['ACTIVE', Validators.required]
    });

    this.quickBookForm = this.fb.group({
      customerName: ['', Validators.required],
      customerPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,11}$/)]],
      durationMinutes: [60, Validators.required],
      paymentStatus: ['PAID', Validators.required]
    });
  }

  ngOnInit() {
    this.loadFieldTypes();
    this.loadBranches();
    this.loadUsers();
    this.loadFields();
    this.loadBookingsAndCalculateCourts();

    // Start Live 1-second Countdown Timer
    this.timerInterval = setInterval(() => {
      this.updateCountdowns();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  get currentUser() {
    return this.authService.currentUser();
  }

  get isBranchManager(): boolean {
    const role = this.currentUser?.role;
    return role === 'branch_manager' || role === 'manager';
  }

  get userRoleDisplay(): string {
    const role = this.currentUser?.role;
    if (role === 'branch_manager' || role === 'manager') return 'Quản lý chi nhánh (Branch Manager)';
    if (role === 'super_admin' || role === 'admin') return 'Quản trị viên (Admin)';
    return 'Nhân viên quản lý';
  }

  // --- 1. Load Data from Backend (Pure Backend Integration) ---
  loadFieldTypes() {
    this.api.get<any[]>('/field-types').subscribe({
      next: (types) => {
        this.fieldTypes = Array.isArray(types) ? types : (types as any)?.data || [];
        if (this.fieldTypes.length > 0 && !this.fieldForm.get('field_type_id')?.value) {
          this.fieldForm.patchValue({ field_type_id: this.fieldTypes[0].id });
        }
      },
      error: (err) => console.error('Lỗi tải danh mục loại sân', err)
    });
  }

  loadBranches() {
    this.api.get<any[]>('/branches').subscribe({
      next: (branches) => {
        this.branches = Array.isArray(branches) ? branches : (branches as any)?.data || [];
        if (this.branches.length === 0) {
          // If branches table is empty, load locations as fallback
          this.api.get<any[]>('/locations/cities').subscribe({
            next: (cities) => {
              this.locations = Array.isArray(cities) ? cities : [];
            }
          });
        }
      },
      error: () => {
        this.api.get<any[]>('/locations/cities').subscribe({
          next: (cities) => {
            this.locations = Array.isArray(cities) ? cities : [];
          }
        });
      }
    });
  }

  loadUsers() {
    this.api.get<any>('/users/admin/all').subscribe({
      next: (res) => {
        const list = res.data || res || [];
        if (Array.isArray(list)) {
          this.usersData = list.map((u: any) => ({
            id: u.id ? u.id.substring(0, 8).toUpperCase() : 'N/A',
            name: u.userProfile?.full_name || u.full_name || 'Chưa cập nhật',
            email: u.email,
            role: u.role ? (typeof u.role === 'object' ? u.role.name : u.role) : 'customer',
            status: u.status !== false ? 'ACTIVE' : 'INACTIVE'
          }));
        }
      },
      error: (err) => console.error('Lỗi tải người dùng', err)
    });
  }

  loadFields() {
    this.api.get<any>('/fields').subscribe({
      next: (res) => {
        const rawFields = res.data || (Array.isArray(res) ? res : []);
        this.fieldsData = rawFields.map((f: any) => {
          const typeName = f.fieldType?.name || f.field_type?.name || this.getFieldTypeName(f.field_type_id || f.fieldTypeId) || 'Sân tiêu chuẩn';
          const branchName = f.branch?.name || f.location?.address || f.address || 'Chi nhánh chính';
          return {
            id: f.id,
            displayId: f.id.substring(0, 8).toUpperCase(),
            name: f.name,
            price: f.price_per_hour || f.price || f.base_price || 0,
            status: f.is_active !== false && f.status !== false ? 'ACTIVE' : 'INACTIVE',
            address: branchName,
            fieldTypeName: typeName,
            fieldTypeId: f.field_type_id || f.fieldTypeId || f.fieldType?.id,
            branchId: f.branch_id || f.branchId || f.branch?.id,
            description: f.description || '',
            rawId: f.id,
            rawField: f
          };
        });

        // After loading fields, refresh court statuses
        this.calculateCourtStatuses();
      },
      error: (err) => console.error('Lỗi tải danh sách sân bóng', err)
    });
  }

  loadBookingsAndCalculateCourts() {
    // 1. Try /bookings/management/all (Primary manager/admin endpoint)
    this.api.get<any>('/bookings/management/all?limit=100').subscribe({
      next: (res) => {
        this.rawBookings = res.data || (Array.isArray(res) ? res : []);
        this.calculateCourtStatuses();
      },
      error: () => {
        // 2. Fallback to /bookings/active
        this.api.get<any>('/bookings/active').subscribe({
          next: (res) => {
            this.rawBookings = res.data || (Array.isArray(res) ? res : []);
            this.calculateCourtStatuses();
          },
          error: () => {
            // 3. Fallback to /bookings/me
            this.api.get<any>('/bookings/me').subscribe({
              next: (res) => {
                this.rawBookings = res.data || (Array.isArray(res) ? res : []);
                this.calculateCourtStatuses();
              },
              error: () => {
                this.rawBookings = [];
                this.calculateCourtStatuses();
              }
            });
          }
        });
      }
    });
  }

  getFieldTypeName(typeId?: string): string {
    if (!typeId) return '';
    const match = this.fieldTypes.find(t => t.id === typeId);
    return match ? match.name : '';
  }

  // --- Helper to parse booking start & end time safely ---
  private parseTime(timeVal: any, dateVal?: any): { timeStr: string, timestamp: number } {
    if (!timeVal) return { timeStr: '00:00', timestamp: 0 };
    
    // Case 1: ISO string or Date object (e.g. "2026-08-15T16:00:00.000Z")
    if (timeVal instanceof Date || (typeof timeVal === 'string' && timeVal.includes('T'))) {
      const d = new Date(timeVal);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return { timeStr: `${h}:${m}`, timestamp: d.getTime() };
    }
    
    // Case 2: Time string (e.g. "16:00" or "16:00:00")
    if (typeof timeVal === 'string' && timeVal.includes(':')) {
      const parts = timeVal.split(':').map(Number);
      const h = parts[0] || 0;
      const m = parts[1] || 0;
      const d = dateVal ? new Date(dateVal) : new Date();
      d.setHours(h, m, 0, 0);
      return { timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, timestamp: d.getTime() };
    }
    
    return { timeStr: '00:00', timestamp: 0 };
  }

  // --- 2. Real-time Pitch Calculation & Status Management ---
  calculateCourtStatuses() {
    const now = new Date();
    const nowMs = now.getTime();
    const todayStr = now.toISOString().split('T')[0];

    let totalRevenue = 0;
    let totalBookings = 0;
    let activeCount = 0;
    let availableCount = 0;

    const courts: CourtStatusItem[] = this.fieldsData.map(f => {
      // Find all bookings for this field
      const fieldBookings = this.rawBookings.filter((b: any) => {
        const bookingFieldId = b.field_id || b.fieldId || b.field?.id;
        const bookingFieldName = b.fieldName || b.field?.name;
        return bookingFieldId === f.rawId || bookingFieldName === f.name;
      });

      // Parse bookings
      const parsedBookings = fieldBookings.map((b: any) => {
        const dateVal = b.bookingDate || b.date || todayStr;
        const parsedStart = this.parseTime(b.start_time || b.startTime, dateVal);
        const parsedEnd = this.parseTime(b.end_time || b.endTime, dateVal);

        const customerName = b.customerName || b.userProfile?.full_name || b.user?.userProfile?.full_name || b.customer_name || 'Khách đặt sân';
        const customerPhone = b.customerPhone || b.userProfile?.phone_number || b.user?.userProfile?.phone_number || b.customer_phone || '0987654321';
        const paymentStatus = (b.paymentStatus || b.payment_status || 'PAID') as 'PAID' | 'UNPAID';
        const totalPrice = Number(b.total_price || b.totalPrice || b.total_amount || f.price || 200000);

        return {
          id: b.id || 'B-' + Math.random().toString(36).substr(2, 6),
          customerName,
          customerPhone,
          startTime: parsedStart.timeStr,
          endTime: parsedEnd.timeStr,
          startMs: parsedStart.timestamp,
          endMs: parsedEnd.timestamp,
          paymentStatus,
          totalPrice,
          date: typeof dateVal === 'string' ? dateVal.substring(0, 10) : todayStr,
          status: b.status || 'CONFIRMED'
        };
      });

      // Find if there is an active match right now (within time window)
      const activeMatch = parsedBookings.find(b => 
        b.status !== 'CANCELLED' && nowMs >= b.startMs && nowMs < b.endMs
      );

      // Find upcoming bookings later today
      const upcomingBookings = parsedBookings
        .filter(b => b.status !== 'CANCELLED' && b.startMs > nowMs)
        .sort((a, b) => a.startMs - b.startMs);

      const nextMatchData = upcomingBookings.length > 0 ? {
        bookingId: upcomingBookings[0].id,
        customerName: upcomingBookings[0].customerName,
        customerPhone: upcomingBookings[0].customerPhone,
        startTime: upcomingBookings[0].startTime,
        endTime: upcomingBookings[0].endTime,
        startMs: upcomingBookings[0].startMs
      } : null;

      let status: 'IN_PROGRESS' | 'AVAILABLE' = 'AVAILABLE';
      let currentMatchObj: CourtStatusItem['currentMatch'] = undefined;

      if (activeMatch) {
        status = 'IN_PROGRESS';
        activeCount++;
        totalRevenue += activeMatch.totalPrice;
        totalBookings++;

        const remainingMs = Math.max(0, activeMatch.endMs - nowMs);
        const remainingSeconds = Math.floor(remainingMs / 1000);
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecondsInMinute = remainingSeconds % 60;
        const totalDurationMs = Math.max(1, activeMatch.endMs - activeMatch.startMs);
        const elapsedMs = nowMs - activeMatch.startMs;
        const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));

        currentMatchObj = {
          bookingId: activeMatch.id,
          customerName: activeMatch.customerName,
          customerPhone: activeMatch.customerPhone,
          startTime: activeMatch.startTime,
          endTime: activeMatch.endTime,
          startMs: activeMatch.startMs,
          endMs: activeMatch.endMs,
          paymentStatus: activeMatch.paymentStatus,
          totalPrice: activeMatch.totalPrice,
          remainingSeconds,
          remainingMinutes,
          remainingSecondsInMinute,
          remainingFormatted: `${String(remainingMinutes).padStart(2, '0')}:${String(remainingSecondsInMinute).padStart(2, '0')}`,
          progressPercent
        };
      } else {
        availableCount++;
      }

      return {
        id: f.rawId,
        displayId: f.displayId,
        name: f.name,
        fieldTypeId: f.fieldTypeId,
        fieldTypeName: f.fieldTypeName,
        branchId: f.branchId,
        branchName: f.address,
        address: f.address,
        pricePerHour: f.price,
        isActive: f.status === 'ACTIVE',
        status,
        currentMatch: currentMatchObj,
        nextMatch: nextMatchData
      };
    });

    this.courtStatuses = courts;
    this.activePitchesCount = activeCount;
    this.availablePitchesCount = availableCount;
    this.revenue = totalRevenue;
    this.bookings = totalBookings;

    this.applyCourtFilters();
  }

  // --- 3. Live Countdown Tick (runs every 1 second) ---
  updateCountdowns() {
    const nowMs = Date.now();
    let hasStatusChange = false;

    for (const court of this.courtStatuses) {
      if (court.status === 'IN_PROGRESS' && court.currentMatch) {
        const remainingMs = court.currentMatch.endMs - nowMs;
        if (remainingMs <= 0) {
          hasStatusChange = true;
        } else {
          const totalSec = Math.floor(remainingMs / 1000);
          const mins = Math.floor(totalSec / 60);
          const secs = totalSec % 60;
          court.currentMatch.remainingSeconds = totalSec;
          court.currentMatch.remainingMinutes = mins;
          court.currentMatch.remainingSecondsInMinute = secs;
          court.currentMatch.remainingFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

          const totalDurationMs = Math.max(1, court.currentMatch.endMs - court.currentMatch.startMs);
          const elapsedMs = nowMs - court.currentMatch.startMs;
          court.currentMatch.progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalDurationMs) * 100)));
        }
      }
    }

    if (hasStatusChange) {
      this.calculateCourtStatuses();
    }
  }

  // --- 4. Filtering & Search ---
  setCourtFilterStatus(status: 'ALL' | 'IN_PROGRESS' | 'AVAILABLE') {
    this.courtFilterStatus = status;
    this.applyCourtFilters();
  }

  setCourtFilterType(typeId: string) {
    this.courtFilterType = typeId;
    this.applyCourtFilters();
  }

  applyCourtFilters() {
    this.filteredCourtStatuses = this.courtStatuses.filter(court => {
      const matchStatus = this.courtFilterStatus === 'ALL' || court.status === this.courtFilterStatus;
      const matchType = this.courtFilterType === 'ALL' || court.fieldTypeId === this.courtFilterType || court.fieldTypeName === this.courtFilterType;
      const matchSearch = !this.courtSearchQuery || 
        court.name.toLowerCase().includes(this.courtSearchQuery.toLowerCase()) ||
        court.displayId.toLowerCase().includes(this.courtSearchQuery.toLowerCase()) ||
        (court.currentMatch && court.currentMatch.customerName.toLowerCase().includes(this.courtSearchQuery.toLowerCase()));
      return matchStatus && matchType && matchSearch;
    });
  }

  setTab(tab: 'OVERVIEW' | 'FIELDS' | 'USERS' | 'BOOKINGS') {
    this.activeTab = tab;
    this.showFieldForm = false;
  }

  // --- 5. Field Management CRUD (Backend Connected) ---
  openAddField() {
    this.editingFieldId = null;
    const defaultTypeId = this.fieldTypes.length > 0 ? this.fieldTypes[0].id : '';
    const defaultBranchId = this.branches.length > 0 ? this.branches[0].id : '';
    
    this.fieldForm.reset({
      name: '',
      price: '',
      field_type_id: defaultTypeId,
      branch_id: defaultBranchId,
      address: '',
      description: '',
      status: 'ACTIVE'
    });
    this.showFieldForm = true;
  }

  openEditField(field: any) {
    this.editingFieldId = field.rawId;
    const raw = field.rawField || {};
    this.fieldForm.patchValue({
      name: field.name,
      price: field.price,
      field_type_id: field.fieldTypeId || raw.field_type_id || raw.fieldTypeId || (this.fieldTypes[0]?.id || ''),
      branch_id: field.branchId || raw.branch_id || raw.branchId || (this.branches[0]?.id || ''),
      address: field.address,
      description: raw.description || '',
      status: field.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'
    });
    this.showFieldForm = true;
  }

  deleteField(field: any) {
    if (confirm(`Bạn có chắc chắn muốn xóa sân "${field.name}" không? Thao tác này không thể hoàn tác.`)) {
      this.fieldService.deleteField(field.rawId).subscribe({
        next: () => {
          this.loadFields();
        },
        error: (err) => {
          alert('Lỗi: ' + (err.error?.message || 'Không thể xóa sân bóng'));
        }
      });
    }
  }

  saveField() {
    if (this.fieldForm.invalid) {
      this.fieldForm.markAllAsTouched();
      return;
    }
    
    this.isSavingField = true;
    const formData = this.fieldForm.value;

    // Construct valid payload compatible with both CreateFieldDto and legacy fields
    const payload: any = {
      name: formData.name,
      price_per_hour: Number(formData.price),
      fieldTypeId: formData.field_type_id,
      field_type_id: formData.field_type_id,
      status: formData.status === 'ACTIVE',
      is_active: formData.status === 'ACTIVE',
      description: formData.description || ''
    };

    if (formData.branch_id) {
      payload.branchId = formData.branch_id;
      payload.branch_id = formData.branch_id;
    }
    if (formData.address) {
      payload.address = formData.address;
    }

    if (this.editingFieldId) {
      this.fieldService.updateField(this.editingFieldId, payload).subscribe({
        next: () => {
          this.isSavingField = false;
          this.showFieldForm = false;
          this.loadFields();
        },
        error: (err) => {
          this.isSavingField = false;
          alert('Lỗi: ' + (err.error?.message || 'Không thể cập nhật sân bóng'));
        }
      });
    } else {
      this.fieldService.createField(payload).subscribe({
        next: () => {
          this.isSavingField = false;
          this.showFieldForm = false;
          this.loadFields();
        },
        error: (err) => {
          this.isSavingField = false;
          alert('Lỗi: ' + (err.error?.message || 'Không thể thêm sân bóng'));
        }
      });
    }
  }

  cancelFieldForm() {
    this.showFieldForm = false;
    this.editingFieldId = null;
  }

  // --- 6. Quick Action Modal Handlers ---
  openQuickBook(court: CourtStatusItem) {
    this.selectedCourtForAction = court;
    this.quickBookForm.reset({
      customerName: '',
      customerPhone: '',
      durationMinutes: 60,
      paymentStatus: 'PAID'
    });
    this.showQuickBookModal = true;
  }

  closeQuickBook() {
    this.showQuickBookModal = false;
    this.selectedCourtForAction = null;
  }

  submitQuickBook() {
    if (this.quickBookForm.invalid || !this.selectedCourtForAction) {
      this.quickBookForm.markAllAsTouched();
      return;
    }

    const formVal = this.quickBookForm.value;
    const now = new Date();
    const startH = String(now.getHours()).padStart(2, '0');
    const startM = String(now.getMinutes()).padStart(2, '0');
    const end = new Date(now.getTime() + formVal.durationMinutes * 60000);
    const endH = String(end.getHours()).padStart(2, '0');
    const endM = String(end.getMinutes()).padStart(2, '0');

    const newBooking = {
      id: 'BK-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      field_id: this.selectedCourtForAction.id,
      fieldName: this.selectedCourtForAction.name,
      customerName: formVal.customerName,
      customerPhone: formVal.customerPhone,
      startTime: `${startH}:${startM}`,
      endTime: `${endH}:${endM}`,
      paymentStatus: formVal.paymentStatus,
      totalPrice: (this.selectedCourtForAction.pricePerHour * formVal.durationMinutes) / 60,
      status: 'CONFIRMED'
    };

    // Try posting to backend management create endpoint
    this.api.post('/bookings/management/create', {
      fieldId: this.selectedCourtForAction.id,
      date: now.toISOString().split('T')[0],
      startTime: `${startH}:${startM}:00`,
      endTime: `${endH}:${endM}:00`,
      customerName: formVal.customerName,
      customerPhone: formVal.customerPhone,
      note: `Đặt trực tiếp tại quầy`
    }).subscribe({
      next: () => {
        this.rawBookings.push(newBooking);
        this.calculateCourtStatuses();
        this.closeQuickBook();
      },
      error: () => {
        // Fallback optimistic update
        this.rawBookings.push(newBooking);
        this.calculateCourtStatuses();
        this.closeQuickBook();
      }
    });
  }

  finishMatchEarly(court: CourtStatusItem) {
    if (!court.currentMatch) return;
    if (confirm(`Xác nhận kết thúc sớm trận đấu tại "${court.name}"?`)) {
      const booking = this.rawBookings.find((b: any) => (b.id || b.bookingId) === court.currentMatch?.bookingId);
      if (booking) {
        booking.status = 'COMPLETED';
        const now = new Date();
        const nowH = String(now.getHours()).padStart(2, '0');
        const nowM = String(now.getMinutes()).padStart(2, '0');
        booking.endTime = `${nowH}:${nowM}`;
      }
      this.calculateCourtStatuses();
    }
  }

  extendMatch(court: CourtStatusItem, extraMinutes: number = 30) {
    if (!court.currentMatch) return;
    if (confirm(`Gia hạn thêm ${extraMinutes} phút cho sân "${court.name}"?`)) {
      court.currentMatch.endMs += extraMinutes * 60000;
      const newEndDate = new Date(court.currentMatch.endMs);
      court.currentMatch.endTime = `${String(newEndDate.getHours()).padStart(2, '0')}:${String(newEndDate.getMinutes()).padStart(2, '0')}`;
      this.updateCountdowns();
    }
  }
}
