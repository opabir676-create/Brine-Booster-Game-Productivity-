import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type Category = 'length' | 'weight' | 'temperature';

@Component({
  selector: 'app-unit-converter',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './unit-converter.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnitConverterComponent {
  category = signal<Category>('length');
  fromUnit = signal('meters');
  toUnit = signal('feet');
  inputValue = signal<number | null>(1);

  units: { [key in Category]: { name: string, factor: number, offset?: number }[] } = {
    length: [
      { name: 'meters', factor: 1 },
      { name: 'kilometers', factor: 1000 },
      { name: 'feet', factor: 0.3048 },
      { name: 'miles', factor: 1609.34 },
    ],
    weight: [
      { name: 'kilograms', factor: 1 },
      { name: 'grams', factor: 0.001 },
      { name: 'pounds', factor: 0.453592 },
      { name: 'ounces', factor: 0.0283495 },
    ],
    temperature: [
      { name: 'celsius', factor: 1, offset: 0 },
      { name: 'fahrenheit', factor: 5/9, offset: 32 },
      { name: 'kelvin', factor: 1, offset: 273.15 },
    ]
  };

  availableUnits = computed(() => this.units[this.category()]);

  result = computed(() => {
    const value = this.inputValue() ?? 0;
    const from = this.availableUnits().find(u => u.name === this.fromUnit());
    const to = this.availableUnits().find(u => u.name === this.toUnit());

    if (!from || !to) return 0;

    if (this.category() === 'temperature') {
      // Convert to Celsius first (base unit)
      const valueInCelsius = (value - (from.offset ?? 0)) * from.factor;
      // Convert from Celsius to target unit
      return (valueInCelsius / to.factor) + (to.offset ?? 0);
    } else {
      // Convert to meters/kg first (base unit)
      const valueInBase = value * from.factor;
      // Convert from base to target unit
      return valueInBase / to.factor;
    }
  });
  
  onCategoryChange(newCategory: Category) {
    this.category.set(newCategory);
    this.fromUnit.set(this.units[newCategory][0].name);
    this.toUnit.set(this.units[newCategory][1].name);
  }
}
