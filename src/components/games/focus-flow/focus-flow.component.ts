import { Component, ChangeDetectionStrategy, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, FocusFlowReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { FocusFlowStateService } from '../../../services/state/focus-flow-state.service';

@Component({
  selector: 'app-focus-flow',
  templateUrl: './focus-flow.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FocusFlowComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<FocusFlowReport>();
  
  soundService = inject(SoundService);
  state = inject(FocusFlowStateService);

  // Expose state signals
  gameState = this.state.gameState;
  objects = this.state.objects;
  feedback = this.state.feedback;
  selectedId = this.state.selectedId;
  round = this.state.round;
  score = this.state.score;
  lives = this.state.lives;


  private config = {
    Easy: { count: 5, speed: 5, watchTime: 5000 },
    Medium: { count: 8, speed: 4, watchTime: 6000 },
    Hard: { count: 12, speed: 3, watchTime: 7000 },
  };

  ngOnInit() {
    if (this.gameState() === 'setup') {
      this.nextRound();
    }
  }

  nextRound() {
    this.gameState.set('prepare');
    this.generateObjects();

    setTimeout(() => {
      this.gameState.set('watching');
      setTimeout(() => this.moveObjects(), 1000);
    }, 2000);
  }

  generateObjects() {
    const newObjects: any[] = [];
    const count = this.config[this.difficulty()].count;
    const targetIndex = Math.floor(Math.random() * count);
    for (let i = 0; i < count; i++) {
      newObjects.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        isTarget: i === targetIndex,
      });
    }
    this.objects.set(newObjects);
  }

  moveObjects() {
    this.objects.update(currentObjects => 
      currentObjects.map(obj => ({
        ...obj,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
      }))
    );
    
    setTimeout(() => {
      this.gameState.set('selecting');
    }, this.config[this.difficulty()].watchTime);
  }

  handleObjectClick(clickedObject: any) {
    if (this.gameState() !== 'selecting') return;

    this.gameState.set('feedback');
    this.selectedId.set(clickedObject.id);

    if (clickedObject.isTarget) {
      this.soundService.playSuccess();
      this.feedback.set('correct');
      this.score.update(s => s + 100);
      this.round.update(r => r + 1);
    } else {
      this.soundService.playFailure();
      this.feedback.set('incorrect');
      this.lives.update(l => l - 1);
    }
    
    setTimeout(() => {
      this.feedback.set('');
      this.selectedId.set(null);
      if (this.lives() > 0) {
        this.nextRound();
      } else {
        this.gameOver();
      }
    }, 2000);
  }

  gameOver() {
    const report: FocusFlowReport = {
      type: 'FocusFlow',
      stats: [
        { label: 'Final Score', value: this.score() },
        { label: 'Rounds Completed', value: this.round() - 1 },
        { label: 'Lives Remaining', value: this.lives() },
        { label: 'Difficulty', value: this.difficulty() }
      ],
    };
    this.gameFinished.emit(report);
    this.state.reset();
  }
  
  getSpeedInSeconds(): number {
    return this.config[this.difficulty()].speed;
  }
}