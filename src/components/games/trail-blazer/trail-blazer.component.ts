import { Component, ChangeDetectionStrategy, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, TrailBlazerReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { TrailBlazerStateService, TrailCell } from '../../../services/state/trail-blazer-state.service';

@Component({
  selector: 'app-trail-blazer',
  templateUrl: './trail-blazer.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrailBlazerComponent implements OnInit {
  difficulty = input.required<Difficulty>();
  gameFinished = output<TrailBlazerReport>();

  soundService = inject(SoundService);
  state = inject(TrailBlazerStateService);
  
  // Expose state signals
  gameState = this.state.gameState;
  grid = this.state.grid;
  path = this.state.path;
  round = this.state.round;
  lives = this.state.lives;

  private config = {
      Easy: { gridSize: 3, initialLength: 3 },
      Medium: { gridSize: 4, initialLength: 4 },
      Hard: { gridSize: 5, initialLength: 5 },
  };

  ngOnInit() {
    if (this.grid().length === 0) {
        this.createGrid();
        this.nextRound();
    }
  }

  createGrid() {
      const gridSize = this.config[this.difficulty()].gridSize;
      const newGrid: TrailCell[] = [];
      for (let i = 0; i < gridSize * gridSize; i++) {
          newGrid.push({ id: i, state: 'idle' });
      }
      this.grid.set(newGrid);
  }

  nextRound() {
    this.state.gameState.set('watching');
    this.state.userPath.set([]);
    this.generatePath();
    this.showPath();
  }

  generatePath() {
    const { gridSize, initialLength } = this.config[this.difficulty()];
    const pathLength = initialLength + this.round() - 1;
    const newPath: number[] = [];
    
    let currentCell = Math.floor(Math.random() * (gridSize * gridSize));
    newPath.push(currentCell);

    for (let i = 1; i < pathLength; i++) {
        const neighbors = this.getNeighbors(currentCell, gridSize);
        const validNeighbors = neighbors.filter(n => !newPath.includes(n));
        currentCell = validNeighbors.length > 0
            ? validNeighbors[Math.floor(Math.random() * validNeighbors.length)]
            : neighbors[Math.floor(Math.random() * neighbors.length)]; // Allow revisiting if stuck
        newPath.push(currentCell);
    }
    this.path.set(newPath);
  }
  
  getNeighbors(index: number, size: number): number[] {
    const neighbors = [];
    const row = Math.floor(index / size);
    const col = index % size;
    if (row > 0) neighbors.push(index - size); // Up
    if (row < size - 1) neighbors.push(index + size); // Down
    if (col > 0) neighbors.push(index - 1); // Left
    if (col < size - 1) neighbors.push(index + 1); // Right
    return neighbors;
  }

  async showPath() {
    await this.sleep(1000);
    for (const cellId of this.path()) {
        this.grid.update(grid => {
            grid[cellId].state = 'path';
            return [...grid];
        });
        this.soundService.playClick();
        await this.sleep(400);
        this.grid.update(grid => {
            grid[cellId].state = 'idle';
            return [...grid];
        });
        await this.sleep(100);
    }
    this.state.gameState.set('playing');
  }
  
  handleCellClick(cellId: number) {
    if (this.gameState() !== 'playing') return;

    const userPath = this.state.userPath();
    const currentStep = userPath.length;

    if (this.path()[currentStep] === cellId) {
        this.soundService.playClick();
        this.state.userPath.update(p => [...p, cellId]);
        this.grid.update(grid => {
            grid[cellId].state = 'correct';
            return [...grid];
        });
        
        if (this.state.userPath().length === this.path().length) {
            this.soundService.playSuccess();
            this.round.update(r => r + 1);
            setTimeout(() => this.resetGridStates() && this.nextRound(), 1000);
        }
    } else {
        this.soundService.playFailure();
        this.grid.update(grid => {
            grid[cellId].state = 'incorrect';
            return [...grid];
        });
        this.lives.update(l => l - 1);
        this.state.gameState.set('feedback');
        if (this.lives() <= 0) {
            setTimeout(() => this.gameOver(), 1500);
        } else {
            setTimeout(() => this.resetGridStates() && this.nextRound(), 1500);
        }
    }
  }

  resetGridStates() {
    this.grid.update(grid => grid.map(cell => ({ ...cell, state: 'idle' })));
    return true; // for chaining
  }

  gameOver() {
    const score = (this.round() - 1) * 100;
    const report: TrailBlazerReport = {
        type: 'TrailBlazer',
        stats: [
            { label: 'Final Score', value: score },
            { label: 'Rounds Completed', value: this.round() - 1 },
            { label: 'Lives Remaining', value: this.lives() }
        ]
    };
    this.gameFinished.emit(report);
  }

  sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

  getGridSize(): number {
    return this.config[this.difficulty()].gridSize;
  }
}
