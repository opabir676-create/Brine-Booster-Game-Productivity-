import { Component, ChangeDetectionStrategy, input, output, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, MemoryGridReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { MemoryGridStateService } from '../../../services/state/memory-grid-state.service';

@Component({
  selector: 'app-memory-grid',
  templateUrl: './memory-grid.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryGridComponent implements OnInit, OnDestroy {
  gridSizeInput = input.required<number>({ alias: 'gridSize' });
  gameFinished = output<MemoryGridReport>();
  
  soundService = inject(SoundService);
  state = inject(MemoryGridStateService);

  // Expose signals from the state service to the template
  gridSize = this.state.gridSize;
  tiles = this.state.tiles;
  sequence = this.state.sequence;
  playerSequence = this.state.playerSequence;
  gameState = this.state.gameState;
  round = this.state.round;
  
  constructor() {}

  ngOnInit() {
    // If no game is in progress, initialize it
    if (this.state.gameState() === 'setup') {
      this.state.gridSize.set(this.gridSizeInput());
      this.createGrid();
      this.startGame();
    }
  }
  
  ngOnDestroy() {
    // State is preserved in the service, no cleanup needed unless there are subscriptions.
  }

  createGrid() {
    const size = this.gridSize();
    const newTiles: any[] = [];
    for (let i = 0; i < size * size; i++) {
      newTiles.push({ id: i, state: 'idle' });
    }
    this.tiles.set(newTiles);
  }

  startGame() {
    this.state.round.set(1);
    this.state.sequence.set([]);
    this.state.playerSequence.set([]);
    this.state.reactionTimes = [];
    this.state.totalClicks.set(0);
    this.state.correctClicks.set(0);
    this.nextRound();
  }

  nextRound() {
    this.gameState.set('watching');
    this.playerSequence.set([]);
    
    const newSequence: number[] = [];
    const sequenceLength = this.round();
    const totalTiles = this.tiles().length;
    for (let i = 0; i < sequenceLength; i++) {
        newSequence.push(Math.floor(Math.random() * totalTiles));
    }
    this.sequence.set(newSequence);
    
    this.playSequence();
  }

  async playSequence() {
    await this.sleep(700);
    for (const tileId of this.sequence()) {
      this.tiles.update(tiles => {
        tiles[tileId].state = 'active';
        return [...tiles];
      });
      this.soundService.playClick();
      await this.sleep(400);
      this.tiles.update(tiles => {
        tiles[tileId].state = 'idle';
        return [...tiles];
      });
      await this.sleep(200);
    }
    this.gameState.set('playing');
    this.state.startTime = Date.now();
  }

  async handleTileClick(tileId: number) {
    if (this.gameState() !== 'playing') return;
    
    this.soundService.playClick();
    this.state.reactionTimes.push(Date.now() - this.state.startTime);
    this.state.startTime = Date.now();
    this.state.totalClicks.update(t => t + 1);
    
    this.playerSequence.update(s => [...s, tileId]);
    const currentStep = this.playerSequence().length - 1;

    if (this.playerSequence()[currentStep] !== this.sequence()[currentStep]) {
      this.tiles.update(tiles => {
        tiles[tileId].state = 'incorrect';
        return [...tiles];
      });
      this.soundService.playFailure();
      this.gameOver();
      return;
    }

    this.state.correctClicks.update(c => c + 1);
    this.tiles.update(tiles => {
      tiles[tileId].state = 'correct';
      return [...tiles];
    });
    await this.sleep(200);
    this.tiles.update(tiles => {
      tiles[tileId].state = 'idle';
      return [...tiles];
    });

    if (this.playerSequence().length === this.sequence().length) {
      this.soundService.playSuccess();
      this.round.update(r => r + 1);
      await this.sleep(300);
      this.nextRound();
    }
  }

  async gameOver() {
    this.gameState.set('gameover');
    await this.sleep(1000);
    this.createReport();
  }
  
  createReport() {
    const accuracy = this.state.totalClicks() > 0 ? (this.state.correctClicks() / this.state.totalClicks()) * 100 : 0;
    const avgReactionTime = this.state.reactionTimes.length > 0 ? this.state.reactionTimes.reduce((a, b) => a + b, 0) / this.state.reactionTimes.length : 0;
    
    const report: MemoryGridReport = {
      type: 'MemoryGrid',
      stats: [
        { label: 'Rounds Completed', value: this.round() - 1 },
        { label: 'Grid Size', value: `${this.gridSize()}x${this.gridSize()}` },
        { label: 'Accuracy', value: `${accuracy.toFixed(1)}%` },
        { label: 'Avg. Reaction', value: `${avgReactionTime.toFixed(0)}ms` },
      ],
      accuracy: accuracy,
      avgReactionTime: avgReactionTime
    };
    this.gameFinished.emit(report);
    this.state.reset();
  }

  sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
}
