import { Component, ChangeDetectionStrategy, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, SpatialSpinReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { SpatialSpinStateService, ShapeOption } from '../../../services/state/spatial-spin-state.service';

const SHAPES = [
  'M 20 20 L 80 20 L 80 40 L 40 40 L 40 80 L 20 80 Z', // F-like shape
  'M 50 20 L 80 80 L 20 80 Z', // Triangle
  'M 20 20 L 80 20 L 80 80 L 60 80 L 60 40 L 20 40 Z', // G-like shape
  'M 20 50 L 50 20 L 80 50 L 50 80 Z', // Diamond
  'M 20 20 L 80 80 M 80 20 L 20 80', // X-shape (for easier rounds)
  'M 20 80 L 20 20 L 80 20', // L-shape
];

const ROTATIONS = [0, 45, 90, 135, 180, 225, 270, 315];

@Component({
  selector: 'app-spatial-spin',
  templateUrl: './spatial-spin.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpatialSpinComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<SpatialSpinReport>();

  soundService = inject(SoundService);
  state = inject(SpatialSpinStateService);

  // Expose state signals
  gameState = this.state.gameState;
  targetShapePath = this.state.targetShapePath;
  options = this.state.options;
  feedback = this.state.feedback;
  selectedOptionId = this.state.selectedOptionId;
  round = this.state.round;
  score = this.state.score;
  lives = this.state.lives;

  ngOnInit() {
    if (this.options().length === 0) {
      this.nextRound();
    }
  }

  nextRound() {
    this.feedback.set('');
    this.selectedOptionId.set(null);
    this.generateOptions();
  }
  
  generateOptions() {
    const targetPath = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    this.targetShapePath.set(targetPath);
    
    const correctRotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
    const correctTransform = `rotate(${correctRotation} 50 50)`;

    const newOptions: ShapeOption[] = [{
      id: 0,
      path: targetPath,
      transform: correctTransform,
      isCorrect: true,
    }];
    
    // Generate distractors
    const distractorTypes = ['rotate', 'mirror', 'wrong_shape'];
    for (let i = 1; i < 4; i++) {
        const type = distractorTypes[Math.floor(Math.random() * distractorTypes.length)];
        let path = targetPath;
        let transform = '';

        switch(type) {
            case 'mirror':
                // Mirror horizontally or vertically
                transform = Math.random() > 0.5 ? 'scale(-1, 1) translate(-100 0)' : 'scale(1, -1) translate(0 -100)';
                break;
            case 'wrong_shape':
                let wrongPath = SHAPES[Math.floor(Math.random() * SHAPES.length)];
                while (wrongPath === targetPath) {
                    wrongPath = SHAPES[Math.floor(Math.random() * SHAPES.length)];
                }
                path = wrongPath;
                transform = `rotate(${correctRotation} 50 50)`;
                break;
            case 'rotate':
            default:
                let wrongRotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
                while(wrongRotation === correctRotation) {
                    wrongRotation = ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
                }
                transform = `rotate(${wrongRotation} 50 50)`;
                break;
        }

        newOptions.push({ id: i, path, transform, isCorrect: false });
    }
    
    // Shuffle options
    for (let i = newOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newOptions[i], newOptions[j]] = [newOptions[j], newOptions[i]];
    }

    this.options.set(newOptions);
  }

  handleSelection(option: ShapeOption) {
    if (this.gameState() !== 'playing') return;
    
    this.gameState.set('feedback');
    this.selectedOptionId.set(option.id);

    if (option.isCorrect) {
      this.soundService.playSuccess();
      this.feedback.set('correct');
      this.score.update(s => s + 100);
      this.round.update(r => r + 1);
      setTimeout(() => {
        this.gameState.set('playing');
        this.nextRound();
      }, 1000);
    } else {
      this.soundService.playFailure();
      this.feedback.set('incorrect');
      this.lives.update(l => l - 1);
      if (this.lives() <= 0) {
        setTimeout(() => this.gameOver(), 1500);
      } else {
        setTimeout(() => {
          this.gameState.set('playing');
          this.nextRound();
        }, 1500);
      }
    }
  }

  gameOver() {
    this.gameState.set('feedback');
    const report: SpatialSpinReport = {
      type: 'SpatialSpin',
      stats: [
        { label: 'Final Score', value: this.score() },
        { label: 'Rounds Completed', value: this.round() - 1 },
        { label: 'Lives Remaining', value: this.lives() },
        { label: 'Difficulty', value: this.difficulty() },
      ],
    };
    this.gameFinished.emit(report);
    this.state.reset();
  }
}
