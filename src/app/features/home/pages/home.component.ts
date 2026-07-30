import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FieldService, Field } from '../../home/services/field.service';
import { NotificationDropdownComponent } from '../../../shared/components/notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NotificationDropdownComponent],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit {
  // Search state
  searchQuery = signal('');
  searchLocation = signal('');
  searchType = signal('');
  searchBranch = signal('');
  searchDate = signal(new Date().toISOString().split('T')[0]);

  // Options
  locations = signal<any[]>([]);
  branches = signal<any[]>([]);
  fieldTypes = signal<any[]>([]);

  constructor(public fieldService: FieldService) {}

  ngOnInit() {
    this.fieldService.getFields().subscribe();
    this.loadFilterOptions();
  }

  loadFilterOptions() {
    this.fieldService.getLocations().subscribe({
      next: (data) => this.locations.set(data),
      error: () => this.locations.set([])
    });
    this.fieldService.getBranches().subscribe({
      next: (data) => this.branches.set(data),
      error: () => this.branches.set([])
    });
    this.fieldService.getFieldTypes().subscribe({
      next: (data) => this.fieldTypes.set(data),
      error: () => this.fieldTypes.set([])
    });
  }

  toggleSave(field: Field, event: Event) {
    event.stopPropagation();
    field.isSaved = !field.isSaved;
    this.fieldService.fields.update(arr => [...arr]);
  }

  onSearch() {
    this.fieldService.getFields({
      q: this.searchQuery(),
      location: this.searchLocation(),
      branch: this.searchBranch(),
      type: this.searchType(),
      date: this.searchDate()
    }).subscribe();
  }
}
