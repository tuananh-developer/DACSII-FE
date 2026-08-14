import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CrudTableComponent, ColumnDefinition } from '../../../shared/components/crud-table/crud-table.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CrudTableComponent],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  activeTab: 'OVERVIEW' | 'FIELDS' | 'USERS' | 'BOOKINGS' = 'OVERVIEW';
  
  // Dashboard Metrics
  revenue = 14500000;
  bookings = 124;

  // Generic Tables Configs
  fieldColumns: ColumnDefinition[] = [
    { key: 'id', header: 'Mã Sân' },
    { key: 'name', header: 'Tên Sân' },
    { key: 'price', header: 'Giá / Giờ', type: 'currency' },
    { key: 'status', header: 'Trạng thái', type: 'status' }
  ];
  
  fieldsData = [
    { id: 'F001', name: 'Sân số 1 (5 người)', price: 150000, status: 'ACTIVE' },
    { id: 'F002', name: 'Sân số 2 (7 người)', price: 250000, status: 'ACTIVE' },
    { id: 'F003', name: 'Sân số 3 (11 người)', price: 500000, status: 'INACTIVE' }
  ];

  userColumns: ColumnDefinition[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Họ tên' },
    { key: 'email', header: 'Email' },
    { key: 'status', header: 'Trạng thái', type: 'status' }
  ];

  usersData = [
    { id: 'U001', name: 'Nguyễn Văn A', email: 'a@example.com', status: 'ACTIVE' },
    { id: 'U002', name: 'Trần Văn B', email: 'b@example.com', status: 'ACTIVE' }
  ];

  // Form State
  showFieldForm = false;
  fieldForm: FormGroup;
  editingFieldId: string | null = null;

  constructor(private fb: FormBuilder) {
    this.fieldForm = this.fb.group({
      name: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      address: ['', Validators.required],
      status: ['ACTIVE', Validators.required]
    });
  }

  ngOnInit() {}

  setTab(tab: 'OVERVIEW' | 'FIELDS' | 'USERS' | 'BOOKINGS') {
    this.activeTab = tab;
    this.showFieldForm = false; // reset form state when switching tabs
  }

  // --- Field Handlers ---
  openAddField() {
    this.editingFieldId = null;
    this.fieldForm.reset({ status: 'ACTIVE' });
    this.showFieldForm = true;
  }

  openEditField(field: any) {
    this.editingFieldId = field.id;
    this.fieldForm.patchValue(field);
    this.showFieldForm = true;
  }

  deleteField(field: any) {
    if (confirm(`Bạn có chắc muốn xóa sân ${field.name}?`)) {
      this.fieldsData = this.fieldsData.filter(f => f.id !== field.id);
    }
  }

  saveField() {
    if (this.fieldForm.invalid) {
      this.fieldForm.markAllAsTouched();
      return;
    }
    
    const formData = this.fieldForm.value;
    
    if (this.editingFieldId) {
      // Update
      const idx = this.fieldsData.findIndex(f => f.id === this.editingFieldId);
      if (idx !== -1) {
        this.fieldsData[idx] = { ...this.fieldsData[idx], ...formData };
      }
    } else {
      // Create
      const newField = {
        id: 'F00' + (this.fieldsData.length + 1),
        ...formData
      };
      this.fieldsData = [...this.fieldsData, newField];
    }
    this.showFieldForm = false;
  }

  cancelFieldForm() {
    this.showFieldForm = false;
  }
}
