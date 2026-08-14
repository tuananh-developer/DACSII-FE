import { Component, Input, Output, EventEmitter, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ColumnDefinition {
  key: string;
  header: string;
  type?: 'text' | 'currency' | 'date' | 'status' | 'custom';
  customTemplate?: TemplateRef<any>;
}

@Component({
  selector: 'app-crud-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-[12px] border border-[#e3e8ee] shadow-[0_1px_3px_rgba(0,55,112,0.08)] overflow-hidden">
      <div class="px-6 py-4 border-b border-[#e3e8ee] bg-white flex justify-between items-center">
        <h2 class="text-[18px] font-medium text-[#0d253d]">{{ title }}</h2>
        <button *ngIf="showAdd" (click)="onAdd.emit()" class="bg-[#533afd] hover:bg-[#4434d4] text-white px-4 py-2 rounded-[6px] text-[13px] font-medium transition-colors shadow-sm">
          {{ addLabel }}
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[14px]">
          <thead class="bg-[#f6f9fc] text-[#64748d] border-b border-[#e3e8ee]">
            <tr>
              <th *ngFor="let col of columns" class="px-6 py-3 font-semibold uppercase tracking-wider text-[12px]">
                {{ col.header }}
              </th>
              <th *ngIf="showActions" class="px-6 py-3 font-semibold uppercase tracking-wider text-[12px] text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#e3e8ee] text-[#0d253d]">
            <tr *ngFor="let item of data" class="hover:bg-[#f8fafc] transition-colors">
              <td *ngFor="let col of columns" class="px-6 py-4">
                
                <ng-container [ngSwitch]="col.type">
                  <span *ngSwitchCase="'currency'" class="tabular-nums font-medium">₫{{ item[col.key] | number:'1.0-0' }}</span>
                  <span *ngSwitchCase="'date'">{{ item[col.key] | date:'dd/MM/yyyy HH:mm' }}</span>
                  
                  <span *ngSwitchCase="'status'" class="inline-flex items-center px-2 py-1 rounded-full text-[12px] font-medium"
                    [ngClass]="{
                      'bg-[#dcfce7] text-[#166534]': item[col.key] === 'COMPLETED' || item[col.key] === 'ACTIVE',
                      'bg-[#fef9c3] text-[#854d0e]': item[col.key] === 'PENDING',
                      'bg-[#fee2e2] text-[#991b1b]': item[col.key] === 'CANCELLED' || item[col.key] === 'INACTIVE'
                    }">
                    {{ item[col.key] }}
                  </span>
                  
                  <ng-container *ngSwitchCase="'custom'">
                    <ng-container *ngTemplateOutlet="col.customTemplate || defaultTemplate; context: { $implicit: item, column: col }"></ng-container>
                  </ng-container>

                  <span *ngSwitchDefault [class.text-[#64748d]]="col.key === 'id'">{{ item[col.key] }}</span>
                </ng-container>

              </td>
              
              <td *ngIf="showActions" class="px-6 py-4 text-right">
                <button (click)="onEdit.emit(item)" class="text-[#533afd] hover:text-[#4434d4] font-medium mr-4 text-[13px]">Sửa</button>
                <button (click)="onDelete.emit(item)" class="text-[#ea2261] hover:text-[#d41c55] font-medium text-[13px]">Xóa</button>
              </td>
            </tr>
            <tr *ngIf="data.length === 0">
              <td [attr.colspan]="columns.length + (showActions ? 1 : 0)" class="px-6 py-12 text-center text-[#64748d]">
                Không có dữ liệu
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <ng-template #defaultTemplate let-item>
      {{ item }}
    </ng-template>
  `
})
export class CrudTableComponent {
  @Input() title: string = 'Dữ liệu';
  @Input() columns: ColumnDefinition[] = [];
  @Input() data: any[] = [];
  @Input() showAdd: boolean = true;
  @Input() addLabel: string = 'Thêm mới';
  @Input() showActions: boolean = true;
  
  @Output() onAdd = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
}
