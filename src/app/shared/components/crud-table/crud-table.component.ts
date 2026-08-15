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
      <div class="px-6 py-4 border-b border-[#e3e8ee] bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 class="text-[18px] font-medium text-[#0d253d] tracking-tight">{{ title }}</h2>
          <p *ngIf="subtitle" class="text-[13px] text-[#64748d] mt-0.5">{{ subtitle }}</p>
        </div>
        <button *ngIf="showAdd" (click)="onAdd.emit()" class="bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white px-4 py-2 rounded-full text-[13px] font-medium transition-all shadow-sm flex items-center gap-1.5 cursor-pointer">
          <svg viewBox="0 0 24 24" class="w-4 h-4 fill-current"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
          {{ addLabel }}
        </button>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[14px]">
          <thead class="bg-[#f6f9fc] text-[#64748d] border-b border-[#e3e8ee]">
            <tr>
              <th *ngFor="let col of columns" class="px-6 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#64748d]">
                {{ col.header }}
              </th>
              <th *ngIf="showActions" class="px-6 py-3 font-semibold uppercase tracking-wider text-[11px] text-[#64748d] text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#e3e8ee] text-[#0d253d]">
            <tr *ngFor="let item of data" class="hover:bg-[#f8fafc] transition-colors">
              <td *ngFor="let col of columns" class="px-6 py-3.5">
                
                <ng-container [ngSwitch]="col.type">
                  <span *ngSwitchCase="'currency'" class="tabular-nums font-medium text-[#0d253d]">₫{{ item[col.key] | number:'1.0-0' }}</span>
                  <span *ngSwitchCase="'date'" class="tabular-nums text-[#64748d]">{{ item[col.key] | date:'dd/MM/yyyy HH:mm' }}</span>
                  
                  <span *ngSwitchCase="'status'" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
                    [ngClass]="{
                      'bg-[#dcfce7] text-[#166534]': item[col.key] === 'COMPLETED' || item[col.key] === 'ACTIVE',
                      'bg-[#fef9c3] text-[#854d0e]': item[col.key] === 'PENDING',
                      'bg-[#fee2e2] text-[#991b1b]': item[col.key] === 'CANCELLED' || item[col.key] === 'INACTIVE'
                    }">
                    <span class="w-1.5 h-1.5 rounded-full mr-1.5"
                      [ngClass]="{
                        'bg-[#166534]': item[col.key] === 'COMPLETED' || item[col.key] === 'ACTIVE',
                        'bg-[#854d0e]': item[col.key] === 'PENDING',
                        'bg-[#991b1b]': item[col.key] === 'CANCELLED' || item[col.key] === 'INACTIVE'
                      }"></span>
                    {{ item[col.key] === 'ACTIVE' ? 'Hoạt động' : (item[col.key] === 'INACTIVE' ? 'Tạm ngưng' : item[col.key]) }}
                  </span>
                  
                  <ng-container *ngSwitchCase="'custom'">
                    <ng-container *ngTemplateOutlet="col.customTemplate || defaultTemplate; context: { $implicit: item, column: col }"></ng-container>
                  </ng-container>

                  <span *ngSwitchDefault [class.text-[#64748d]]="col.key === 'id' || col.key === 'displayId'" [class.font-mono]="col.key === 'displayId' || col.key === 'id'">{{ item[col.key] }}</span>
                </ng-container>

              </td>
              
              <td *ngIf="showActions" class="px-6 py-3.5 text-right whitespace-nowrap">
                <button (click)="onEdit.emit(item)" class="text-[#533afd] hover:text-[#4434d4] font-medium mr-3 text-[13px] hover:underline cursor-pointer">Sửa</button>
                <button (click)="onDelete.emit(item)" class="text-[#ea2261] hover:text-[#d41c55] font-medium text-[13px] hover:underline cursor-pointer">Xóa</button>
              </td>
            </tr>
            <tr *ngIf="data.length === 0">
              <td [attr.colspan]="columns.length + (showActions ? 1 : 0)" class="px-6 py-12 text-center text-[#64748d]">
                <div class="flex flex-col items-center justify-center">
                  <svg viewBox="0 0 24 24" class="w-8 h-8 fill-[#cbd5e1] mb-2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"></path></svg>
                  <span>Chưa có dữ liệu nào trong danh sách</span>
                </div>
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
  @Input() subtitle: string = '';
  @Input() columns: ColumnDefinition[] = [];
  @Input() data: any[] = [];
  @Input() showAdd: boolean = true;
  @Input() addLabel: string = 'Thêm mới';
  @Input() showActions: boolean = true;
  
  @Output() onAdd = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
}
