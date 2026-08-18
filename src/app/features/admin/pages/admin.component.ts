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
  utilities: any[];
  images: any[];
  
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
  activeTab: 'OVERVIEW' | 'BRANCHES' | 'FIELDS' | 'USERS' | 'BOOKINGS' = 'OVERVIEW';
  
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
  utilities: any[] = [];
  cities: any[] = [];
  wards: any[] = [];
  availableManagers: any[] = [];
  rawBookings: any[] = [];
  
  // Generic Tables Configs
  branchColumns: ColumnDefinition[] = [
    { key: 'displayId', header: 'Mã CN' },
    { key: 'name', header: 'Tên Chi Nhánh' },
    { key: 'fullAddress', header: 'Địa Chỉ' },
    { key: 'phone', header: 'Số Điện Thoại' },
    { key: 'managerName', header: 'Quản Lý' },
    { key: 'operatingHours', header: 'Giờ Mở Cửa' }
  ];
  branchesData: any[] = [];

  fieldColumns: ColumnDefinition[] = [
    { key: 'displayId', header: 'Mã Sân' },
    { key: 'name', header: 'Tên Sân' },
    { key: 'fieldTypeName', header: 'Loại Sân' },
    { key: 'branchName', header: 'Chi nhánh' },
    { key: 'utilitiesCount', header: 'Tiện ích' },
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

  // Form State - Fields
  showFieldForm = false;
  fieldForm: FormGroup;
  editingFieldId: string | null = null;
  isSavingField = false;
  selectedUtilityIds: number[] = [];
  selectedFiles: File[] = [];

  // Form State - Branches
  showBranchForm = false;
  branchForm: FormGroup;
  editingBranchId: string | null = null;
  isSavingBranch = false;

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
      field_type_id: ['', Validators.required],
      branch_id: [''],
      description: [''],
      status: [true, Validators.required]
    });

    this.branchForm = this.fb.group({
      name: ['', Validators.required],
      phone_number: ['', [Validators.required, Validators.pattern(/^[0-9]{9,11}$/)]],
      open_time: ['06:00:00', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)]],
      close_time: ['23:00:00', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/)]],
      cityId: ['', Validators.required],
      wardId: ['', Validators.required],
      street: ['', Validators.required],
      latitude: [''],
      longitude: [''],
      manager_id: [''],
      description: ['']
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
    this.loadCities();
    this.loadBranches();
    this.loadAvailableManagers();
    this.loadUtilities();
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

  get isAdmin(): boolean {
    const role = this.currentUser?.role;
    return role === 'super_admin' || role === 'admin';
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

  loadCities() {
    this.api.get<any[]>('/locations/cities').subscribe({
      next: (cities) => {
        this.cities = Array.isArray(cities) ? cities : [];
        if (this.cities.length > 0 && !this.branchForm.get('cityId')?.value) {
          this.branchForm.patchValue({ cityId: this.cities[0].id });
          this.onCityChange(this.cities[0].id);
        }
      }
    });
  }

  onCityChange(cityId: any) {
    if (!cityId) return;
    this.api.get<any[]>(`/locations/wards/${cityId}`).subscribe({
      next: (wards) => {
        this.wards = Array.isArray(wards) ? wards : [];
        if (this.wards.length > 0 && !this.branchForm.get('wardId')?.value) {
          this.branchForm.patchValue({ wardId: this.wards[0].id });
        }
      }
    });
  }

  loadAvailableManagers() {
    this.api.get<any[]>('/branches/available-managers').subscribe({
      next: (managers) => {
        this.availableManagers = Array.isArray(managers) ? managers : [];
      },
      error: () => {
        this.availableManagers = [];
      }
    });
  }

  loadBranches() {
    this.api.get<any[]>('/branches').subscribe({
      next: (branches) => {
        const list = Array.isArray(branches) ? branches : (branches as any)?.data || [];
        this.branches = list;
        this.branchesData = list.map((b: any) => ({
          id: b.id,
          displayId: b.id ? b.id.substring(0, 8).toUpperCase() : 'N/A',
          name: b.name,
          phone: b.phone_number || 'Chưa có',
          operatingHours: `${b.open_time || '06:00'} - ${b.close_time || '23:00'}`,
          managerName: b.manager?.full_name || 'Chưa gán',
          fullAddress: b.address ? `${b.address.street || ''}, ${b.address.ward_name || ''}, ${b.address.city_name || ''}` : (b.address || 'Hà Nội'),
          raw: b
        }));

        if (this.branches.length > 0 && !this.fieldForm.get('branch_id')?.value) {
          this.fieldForm.patchValue({ branch_id: this.branches[0].id });
        }
      },
      error: (err) => console.error('Lỗi tải chi nhánh', err)
    });
  }

  loadUtilities() {
    this.api.get<any[]>('/utilities').subscribe({
      next: (utils) => {
        this.utilities = Array.isArray(utils) ? utils : (utils as any)?.data || [];
      },
      error: (err) => console.error('Lỗi tải tiện ích', err)
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
          const branchName = f.branch?.name || f.branch?.address?.city_name || f.address || 'Chi nhánh chính';
          const isAct = f.status !== false && f.is_active !== false;
          const utilsCount = f.utilities ? `${f.utilities.length} tiện ích` : '0 tiện ích';
          return {
            id: f.id,
            displayId: f.id.substring(0, 8).toUpperCase(),
            name: f.name,
            status: isAct ? 'ACTIVE' : 'INACTIVE',
            address: branchName,
            branchName: branchName,
            fieldTypeName: typeName,
            fieldTypeId: f.field_type_id || f.fieldTypeId || f.fieldType?.id,
            branchId: f.branch_id || f.branchId || f.branch?.id,
            description: f.description || '',
            utilities: f.utilities || [],
            utilitiesCount: utilsCount,
            images: f.images || [],
            rawId: f.id,
            rawField: f
          };
        });

        this.calculateCourtStatuses();
      },
      error: (err) => console.error('Lỗi tải danh sách sân bóng', err)
    });
  }

  loadBookingsAndCalculateCourts() {
    this.api.get<any>('/bookings/management/all?limit=100').subscribe({
      next: (res) => {
        this.rawBookings = res.data || (Array.isArray(res) ? res : []);
        this.calculateCourtStatuses();
      },
      error: () => {
        this.api.get<any>('/bookings/active').subscribe({
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

  getFieldTypeName(typeId?: string): string {
    if (!typeId) return '';
    const match = this.fieldTypes.find(t => t.id === typeId);
    return match ? match.name : '';
  }

  // --- Helper to parse booking start & end time safely ---
  private parseTime(timeVal: any, dateVal?: any): { timeStr: string, timestamp: number } {
    if (!timeVal) return { timeStr: '00:00', timestamp: 0 };
    
    if (timeVal instanceof Date || (typeof timeVal === 'string' && timeVal.includes('T'))) {
      const d = new Date(timeVal);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return { timeStr: `${h}:${m}`, timestamp: d.getTime() };
    }
    
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
      const fieldBookings = this.rawBookings.filter((b: any) => {
        const bookingFieldId = b.field_id || b.fieldId || b.field?.id;
        const bookingFieldName = b.fieldName || b.field?.name;
        return bookingFieldId === f.rawId || bookingFieldName === f.name;
      });

      const parsedBookings = fieldBookings.map((b: any) => {
        const dateVal = b.bookingDate || b.date || todayStr;
        const parsedStart = this.parseTime(b.start_time || b.startTime, dateVal);
        const parsedEnd = this.parseTime(b.end_time || b.endTime, dateVal);

        const customerName = b.customerName || b.userProfile?.full_name || b.user?.userProfile?.full_name || b.customer_name || 'Khách đặt sân';
        const customerPhone = b.customerPhone || b.userProfile?.phone_number || b.user?.userProfile?.phone_number || b.customer_phone || '0987654321';
        const paymentStatus = (b.paymentStatus || b.payment_status || 'PAID') as 'PAID' | 'UNPAID';
        const totalPrice = Number(b.total_price || b.totalPrice || b.total_amount || 200000);

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

      const activeMatch = parsedBookings.find(b => 
        b.status !== 'CANCELLED' && nowMs >= b.startMs && nowMs < b.endMs
      );

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
        branchName: f.branchName,
        address: f.address,
        pricePerHour: f.rawField?.price || f.rawField?.base_price || 200000,
        isActive: f.status === 'ACTIVE',
        utilities: f.utilities || [],
        images: f.images || [],
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

  setTab(tab: 'OVERVIEW' | 'BRANCHES' | 'FIELDS' | 'USERS' | 'BOOKINGS') {
    this.activeTab = tab;
    this.showFieldForm = false;
    this.showBranchForm = false;
  }

  // --- Utility Selection Toggle ---
  toggleUtility(utilId: number) {
    if (this.selectedUtilityIds.includes(utilId)) {
      this.selectedUtilityIds = this.selectedUtilityIds.filter(id => id !== utilId);
    } else {
      this.selectedUtilityIds.push(utilId);
    }
  }

  isUtilitySelected(utilId: number): boolean {
    return this.selectedUtilityIds.includes(utilId);
  }

  onFilesSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFiles = Array.from(event.target.files);
    }
  }

  // --- 5. Branch Management CRUD ---
  openAddBranch() {
    this.editingBranchId = null;
    const defaultCity = this.cities.length > 0 ? this.cities[0].id : '';
    this.branchForm.reset({
      name: '',
      phone_number: '',
      open_time: '06:00:00',
      close_time: '23:00:00',
      cityId: defaultCity,
      wardId: '',
      street: '',
      latitude: '',
      longitude: '',
      manager_id: '',
      description: ''
    });
    if (defaultCity) {
      this.onCityChange(defaultCity);
    }
    this.showBranchForm = true;
  }

  openEditBranch(branchItem: any) {
    this.editingBranchId = branchItem.id;
    const raw = branchItem.raw || {};
    const addr = raw.address || {};
    
    this.branchForm.patchValue({
      name: raw.name || '',
      phone_number: raw.phone_number || '',
      open_time: raw.open_time || '06:00:00',
      close_time: raw.close_time || '23:00:00',
      cityId: addr.city_id || addr.cityId || (this.cities[0]?.id || ''),
      wardId: addr.ward_id || addr.wardId || '',
      street: addr.street || '',
      latitude: addr.latitude ?? addr.lat ?? raw.latitude ?? raw.lat ?? '',
      longitude: addr.longitude ?? addr.lng ?? addr.lon ?? raw.longitude ?? raw.lng ?? raw.lon ?? '',
      manager_id: raw.manager_id || raw.manager?.id || '',
      description: raw.description || ''
    });
    
    if (addr.city_id) {
      this.onCityChange(addr.city_id);
    }
    this.showBranchForm = true;
  }

  deleteBranch(branchItem: any) {
    if (confirm(`Bạn có chắc chắn muốn xóa chi nhánh "${branchItem.name}"? Tất cả sân thuộc chi nhánh này cũng sẽ bị ảnh hưởng.`)) {
      this.api.delete(`/branches/${branchItem.id}`).subscribe({
        next: () => {
          this.loadBranches();
        },
        error: (err) => {
          alert('Lỗi: ' + (err.error?.message || 'Không thể xóa chi nhánh'));
        }
      });
    }
  }

  // --- Coordinate parsing helper ---
  parseGpsCoordinates(input: string): { lat: number; lng: number } | null {
    if (!input || typeof input !== 'string') return null;
    let text = input.trim();

    // 1. Check Google Maps URL with @lat,lng (e.g. https://www.google.com/maps/@21.028511,105.854167,17z)
    const atMatch = text.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (this.isValidGps(lat, lng)) return { lat, lng };
    }

    // 2. Check for !3d{lat}!4d{lng} in Google Maps embed URLs
    const d3d4Match = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (d3d4Match) {
      const lat = parseFloat(d3d4Match[1]);
      const lng = parseFloat(d3d4Match[2]);
      if (this.isValidGps(lat, lng)) return { lat, lng };
    }

    // 3. Check for q= / query= / place/ in Google Maps URLs
    const qMatch = text.match(/(?:q=|query=|place\/)(-?\d+(?:\.\d+)?)[,+ ]+(-?\d+(?:\.\d+)?)/i);
    if (qMatch) {
      const lat = parseFloat(qMatch[1]);
      const lng = parseFloat(qMatch[2]);
      if (this.isValidGps(lat, lng)) return { lat, lng };
    }

    // 4. Check DMS format (e.g. 21°01'42.6"N 105°51'15.0"E)
    const dmsRegex = /(\d+(?:\.\d+)?)[°\s]+(\d+(?:\.\d+)?)?['\s]*([0-9.]+)?["\s]*([NSEWnsew])[\s,;]+(\d+(?:\.\d+)?)[°\s]+(\d+(?:\.\d+)?)?['\s]*([0-9.]+)?["\s]*([NSEWnsew])/;
    const dmsMatch = text.match(dmsRegex);
    if (dmsMatch) {
      const parseDMS = (deg: string, min?: string, sec?: string, dir?: string) => {
        let val = parseFloat(deg) + (parseFloat(min || '0') / 60) + (parseFloat(sec || '0') / 3600);
        if (dir && ['S', 'W'].includes(dir.toUpperCase())) val = -val;
        return val;
      };
      let lat = parseDMS(dmsMatch[1], dmsMatch[2], dmsMatch[3], dmsMatch[4]);
      let lng = parseDMS(dmsMatch[5], dmsMatch[6], dmsMatch[7], dmsMatch[8]);
      if (['E', 'W'].includes(dmsMatch[4].toUpperCase()) && ['N', 'S'].includes(dmsMatch[8].toUpperCase())) {
        [lat, lng] = [lng, lat];
      }
      if (this.isValidGps(lat, lng)) return { lat, lng };
    }

    // 5. Standard decimal pair: e.g. "21.028511, 105.854167" or "21.028511,105.854167" or "21.028511 105.854167"
    const numMatches = text.match(/-?\d+(?:\.\d+)?/g);
    if (numMatches && numMatches.length >= 2) {
      const lat = parseFloat(numMatches[0]);
      const lng = parseFloat(numMatches[1]);
      if (this.isValidGps(lat, lng)) {
        return { lat, lng };
      }
    }

    return null;
  }

  private isValidGps(lat: number, lng: number): boolean {
    return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  onCoordinatePaste(event: ClipboardEvent, targetField: 'latitude' | 'longitude') {
    const text = event.clipboardData?.getData('text');
    if (text) {
      const coords = this.parseGpsCoordinates(text);
      if (coords) {
        event.preventDefault();
        this.branchForm.patchValue({
          latitude: coords.lat,
          longitude: coords.lng
        });
        this.branchForm.get('latitude')?.markAsDirty();
        this.branchForm.get('longitude')?.markAsDirty();
      }
    }
  }

  onCoordinateInput(targetField: 'latitude' | 'longitude') {
    const val = this.branchForm.get(targetField)?.value;
    if (val && typeof val === 'string' && (val.includes(',') || val.includes('@') || val.includes(';') || val.trim().includes(' '))) {
      const coords = this.parseGpsCoordinates(val);
      if (coords) {
        this.branchForm.patchValue({
          latitude: coords.lat,
          longitude: coords.lng
        });
        this.branchForm.get('latitude')?.markAsDirty();
        this.branchForm.get('longitude')?.markAsDirty();
      }
    }
  }

  onCoordinateBlur(targetField: 'latitude' | 'longitude') {
    const val = this.branchForm.get(targetField)?.value;
    if (val && typeof val === 'string') {
      const coords = this.parseGpsCoordinates(val);
      if (coords) {
        this.branchForm.patchValue({
          latitude: coords.lat,
          longitude: coords.lng
        });
      }
    }
  }

  saveBranch() {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    this.isSavingBranch = true;
    const fv = this.branchForm.value;
    const payload: any = {
      name: fv.name,
      phone_number: fv.phone_number,
      open_time: fv.open_time,
      close_time: fv.close_time,
      street: fv.street,
      cityId: Number(fv.cityId),
      wardId: Number(fv.wardId),
      description: fv.description || ''
    };

    if (fv.latitude !== undefined && fv.latitude !== null && fv.latitude !== '') {
      const lat = Number(fv.latitude);
      if (!isNaN(lat)) {
        payload.latitude = lat;
      }
    }
    if (fv.longitude !== undefined && fv.longitude !== null && fv.longitude !== '') {
      const lng = Number(fv.longitude);
      if (!isNaN(lng)) {
        payload.longitude = lng;
      }
    }

    if (fv.manager_id) {
      payload.manager_id = fv.manager_id;
    }

    if (this.editingBranchId) {
      this.api.put(`/branches/${this.editingBranchId}`, payload).subscribe({
        next: () => {
          this.isSavingBranch = false;
          this.showBranchForm = false;
          this.loadBranches();
          this.loadAvailableManagers();
        },
        error: (err) => {
          this.isSavingBranch = false;
          alert('Lỗi: ' + (err.error?.message || 'Không thể cập nhật chi nhánh'));
        }
      });
    } else {
      this.api.post('/branches', payload).subscribe({
        next: () => {
          this.isSavingBranch = false;
          this.showBranchForm = false;
          this.loadBranches();
          this.loadAvailableManagers();
        },
        error: (err) => {
          this.isSavingBranch = false;
          alert('Lỗi: ' + (err.error?.message || 'Không thể tạo chi nhánh mới'));
        }
      });
    }
  }

  cancelBranchForm() {
    this.showBranchForm = false;
    this.editingBranchId = null;
  }

  // --- 6. Field Management CRUD (Backend Connected) ---
  openAddField(presetBranchId?: string) {
    this.editingFieldId = null;
    this.selectedUtilityIds = [];
    this.selectedFiles = [];

    const defaultTypeId = this.fieldTypes.length > 0 ? this.fieldTypes[0].id : '';
    const defaultBranchId = presetBranchId || (this.branches.length > 0 ? this.branches[0].id : '');
    
    this.fieldForm.reset({
      name: '',
      field_type_id: defaultTypeId,
      branch_id: defaultBranchId,
      description: '',
      status: true
    });
    this.showFieldForm = true;
    this.activeTab = 'FIELDS';
  }

  openEditField(field: any) {
    this.editingFieldId = field.rawId;
    this.selectedFiles = [];
    const raw = field.rawField || {};

    this.selectedUtilityIds = (field.utilities || []).map((u: any) => u.id);

    this.fieldForm.patchValue({
      name: field.name,
      field_type_id: field.fieldTypeId || raw.fieldTypeId || (this.fieldTypes[0]?.id || ''),
      branch_id: field.branchId || raw.branchId || (this.branches[0]?.id || ''),
      description: raw.description || '',
      status: raw.status !== false
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

    const payload: any = {
      name: formData.name,
      fieldTypeId: formData.field_type_id,
      description: formData.description || '',
      status: Boolean(formData.status),
      utilityIds: this.selectedUtilityIds
    };

    if (formData.branch_id) {
      payload.branchId = formData.branch_id;
    }

    if (this.editingFieldId) {
      this.fieldService.updateField(this.editingFieldId, payload).subscribe({
        next: () => {
          if (this.selectedFiles.length > 0) {
            this.uploadFieldImages(this.editingFieldId!, this.selectedFiles);
          } else {
            this.isSavingField = false;
            this.showFieldForm = false;
            this.loadFields();
          }
        },
        error: (err) => {
          this.isSavingField = false;
          alert('Lỗi: ' + (err.error?.message || 'Không thể cập nhật sân bóng'));
        }
      });
    } else {
      this.fieldService.createField(payload).subscribe({
        next: (createdField) => {
          const newId = createdField.id || createdField.data?.id;
          if (newId && this.selectedFiles.length > 0) {
            this.uploadFieldImages(newId, this.selectedFiles);
          } else {
            this.isSavingField = false;
            this.showFieldForm = false;
            this.loadFields();
          }
        },
        error: (err) => {
          this.isSavingField = false;
          alert('Lỗi: ' + (err.error?.message || 'Không thể thêm sân bóng'));
        }
      });
    }
  }

  private uploadFieldImages(fieldId: string, files: File[]) {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));

    this.api.post(`/fields/${fieldId}/images`, formData).subscribe({
      next: () => {
        this.isSavingField = false;
        this.showFieldForm = false;
        this.loadFields();
      },
      error: () => {
        this.isSavingField = false;
        this.showFieldForm = false;
        this.loadFields();
      }
    });
  }

  cancelFieldForm() {
    this.showFieldForm = false;
    this.editingFieldId = null;
  }

  // --- 7. Quick Action Modal Handlers ---
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
