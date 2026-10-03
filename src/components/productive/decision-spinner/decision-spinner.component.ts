import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SoundService } from '../../../services/sound.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-decision-spinner',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './decision-spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecisionSpinnerComponent {
  private soundService = inject(SoundService);
  options = signal<string[]>(['Pizza', 'Sushi', 'Tacos', 'Salad']);
  newOption = signal('');
  isSpinning = signal(false);
  result = signal<string | null>(null);
  rotation = signal(0);
  
  private colors = ['#ef4444', '#3b82f6', '#22c55e', '#f97316', '#a855f7', '#eab308', '#ec4899', '#64748b'];

  wheelSlices = computed(() => {
    const numOptions = this.options().length;
    if (numOptions === 0) return [];
    
    const arc = 360 / numOptions;
    return this.options().map((option, i) => ({
      path: this.describeArc(50, 50, 45, i * arc, (i + 1) * arc),
      color: this.colors[i % this.colors.length],
      textTransform: `rotate(${i * arc + arc / 2} 50 50)`,
      option: option,
    }));
  });

  addOption() {
    if (this.newOption().trim() && !this.options().includes(this.newOption().trim())) {
      this.options.update(opts => [...opts, this.newOption().trim()]);
      this.newOption.set('');
    }
  }

  removeOption(optionToRemove: string) {
    this.options.update(opts => opts.filter(opt => opt !== optionToRemove));
  }

  spin() {
    if (this.isSpinning() || this.options().length < 2) return;

    this.isSpinning.set(true);
    this.result.set(null);
    this.soundService.playClick();
    
    const randomSpins = Math.floor(Math.random() * 5) + 5; // 5-10 full spins
    const degreesPerOption = 360 / this.options().length;
    const winningIndex = Math.floor(Math.random() * this.options().length);
    const randomOffset = Math.random() * degreesPerOption;
    
    const finalRotation = (randomSpins * 360) + (winningIndex * degreesPerOption) + randomOffset;
    
    // Add the current rotation to the final one to make it spin from its current position
    this.rotation.update(r => r + finalRotation);
    
    setTimeout(() => {
      this.isSpinning.set(false);
      const actualIndex = Math.floor((360 - (this.rotation() % 360)) / degreesPerOption) % this.options().length;
      this.result.set(this.options()[actualIndex]);
      this.soundService.playSuccess();
    }, 6000); // Corresponds to the animation duration
  }

  // SVG arc helper functions
  private polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  private describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
    const start = this.polarToCartesian(x, y, radius, endAngle);
    const end = this.polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${x} ${y} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  }
}
