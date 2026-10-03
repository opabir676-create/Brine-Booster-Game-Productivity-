import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bill-splitter',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bill-splitter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillSplitterComponent {
  billAmount = signal<number | null>(null);
  tipPercentage = signal(15);
  numberOfPeople = signal(2);

  tipAmount = computed(() => {
    const bill = this.billAmount() ?? 0;
    return bill * (this.tipPercentage() / 100);
  });

  totalAmount = computed(() => {
    const bill = this.billAmount() ?? 0;
    return bill + this.tipAmount();
  });

  perPersonAmount = computed(() => {
    const total = this.totalAmount();
    const people = this.numberOfPeople();
    return people > 0 ? total / people : 0;
  });
}
