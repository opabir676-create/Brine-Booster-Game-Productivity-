import { Component, ChangeDetectionStrategy, input, output, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, LogicBlocksReport } from '../games.types';
import { LogicBlocksStateService } from '../../../services/state/logic-blocks-state.service';

@Component({
  selector: 'app-logic-blocks',
  templateUrl: './logic-blocks.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogicBlocksComponent implements OnInit, OnDestroy {
  gridSizeInput = input.required<number>({ alias: 'gridSize' });
  roundTimeInput = input.required<number>({ alias: 'roundTime' });
  gameFinished = output<LogicBlocksReport>();

  state = inject(LogicBlocksStateService);
  
  // Expose signals from state service
  gridSize = this.state.gridSize;
  shapes = this.state.shapes;
  round = this.state.round;
  score = this.state.score;
  timeLeft = this.state.timeLeft;

  constructor() {}

  ngOnInit() {
    if (!this.state.isGameInProgress()) {
      this.gridSize.set(this.gridSizeInput());
      this.timeLeft.set(this.roundTimeInput());
      this.startGame();
    } else {
      // Resume timer if it was active
      this.startTimer();
    }
  }
  
  ngOnDestroy() {
      clearInterval(this.state.timerId);
  }

  startGame() {
    this.round.set(1);
    this.score.set(0);
    this.state.responseTimes = [];
    this.state.isGameInProgress.set(true);
    this.nextRound();
  }
  
  nextRound() {
    this.generateShapes();
    this.startTimer();
    this.state.roundStartTime = Date.now();
  }

  generateShapes() {
    const size = this.gridSize();
    const totalShapes = size * size;
    const oddOneIndex = Math.floor(Math.random() * totalShapes);
    
    const newShapes: any[] = [];

    for (let i = 0; i < totalShapes; i++) {
      const isOdd = i === oddOneIndex;
      let shape: any = {
        id: i,
        isOdd: isOdd,
        color: 'var(--theme-color-primary)',
      };

      if (isOdd) {
        shape = this.createOddShape(shape);
      }
      
      newShapes.push(shape);
    }
    this.shapes.set(newShapes);
  }

  createOddShape(baseShape: any): any {
    const oddShape = { ...baseShape };
    oddShape.color = '#f59e0b'; // Make odd one out always a distinct color
    return oddShape;
  }

  startTimer() {
    clearInterval(this.state.timerId);
    if(this.timeLeft() <= 0) this.timeLeft.set(this.roundTimeInput()); // Reset if timer expired while away

    this.state.timerId = setInterval(() => {
      this.timeLeft.update(t => t - 1);
      if (this.timeLeft() <= 0) {
        this.gameOver();
      }
    }, 1000);
  }

  handleShapeClick(shape: any) {
    clearInterval(this.state.timerId);
    if (shape.isOdd) {
      this.score.update(s => s + 100 + this.timeLeft() * 10);
      this.round.update(r => r + 1);
      this.state.responseTimes.push(Date.now() - this.state.roundStartTime);
      this.nextRound();
    } else {
      this.gameOver();
    }
  }

  gameOver() {
    clearInterval(this.state.timerId);
    this.createReport();
  }
  
  createReport() {
    const responseTimes = this.state.responseTimes;
    const fastestTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
    const slowestTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
    const timeRange = slowestTime - fastestTime;
    
    const chartData = responseTimes.map((time, index) => {
        const x = (100 / (responseTimes.length - 1 || 1)) * index;
        let yRatio = 0.5;
        if (timeRange > 0) {
            yRatio = (time - fastestTime) / timeRange;
        }
        const y = 45 - (1 - yRatio) * 40; 
        return `${x},${y}`;
      }).join(' ');

    const report: LogicBlocksReport = {
      type: 'LogicBlocks',
      stats: [
        { label: 'Final Score', value: this.score() },
        { label: 'Rounds Completed', value: this.round() - 1 },
        { label: 'Fastest Round', value: `${fastestTime.toFixed(0)}ms` },
        { label: 'Grid Size', value: `${this.gridSize()}x${this.gridSize()}` }
      ],
      chartData: chartData
    };
    this.gameFinished.emit(report);
    this.state.reset();
  }
}
