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
  searchDate = signal('');

  constructor(public fieldService: FieldService) {}

  ngOnInit() {
    this.fieldService.getFields().subscribe();
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
      type: this.searchType(),
      date: this.searchDate()
    }).subscribe();
  }
}
