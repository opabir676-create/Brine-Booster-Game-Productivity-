import { Component, ChangeDetectionStrategy, signal, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SoundService } from '../../../services/sound.service';

type BreathingState = 'stopped' | 'in' | 'hold1' | 'out' | 'hold2';

@Component({
  selector: 'app-breathing-exercise',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breathing-exercise.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreathingExerciseComponent implements OnDestroy {
  private soundService = inject(SoundService);
  state = signal<BreathingState>('stopped');
  
  private timer: any;
  private sequence: BreathingState[] = ['in', 'hold1', 'out', 'hold2'];
  private sequenceIndex = 0;

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  toggleExercise() {
    this.soundService.playClick();
    if (this.state() === 'stopped') {
      this.startExercise();
    } else {
      this.stopExercise();
    }
  }

  private startExercise() {
    this.sequenceIndex = 0;
    this.state.set(this.sequence[this.sequenceIndex]);
    this.soundService.playNotify();
    
    this.timer = setInterval(() => {
      this.sequenceIndex = (this.sequenceIndex + 1) % this.sequence.length;
      this.state.set(this.sequence[this.sequenceIndex]);
      this.soundService.playClick();
    }, 4000);
  }

  private stopExercise() {
    clearInterval(this.timer);
    this.state.set('stopped');
  }

  getInstruction(): string {
    switch(this.state()) {
      case 'in': return 'Breathe In...';
      case 'out': return 'Breathe Out...';
      case 'hold1':
      case 'hold2': return 'Hold';
      default: return 'Press Start to Begin';
    }
  }
}
