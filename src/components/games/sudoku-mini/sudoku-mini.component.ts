import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Difficulty, SudokuMiniReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { SudokuMiniStateService, SudokuCell } from '../../../services/state/sudoku-mini-state.service';

@Component({
  selector: 'app-sudoku-mini',
  templateUrl: './sudoku-mini.component.html',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SudokuMiniComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>();
  gameFinished = output<SudokuMiniReport>();

  soundService = inject(SoundService);
  state = inject(SudokuMiniStateService);
  
  // Expose state signals
  gameState = this.state.gameState;
  grid = this.state.grid;
  selectedCellIndex = this.state.selectedCellIndex;
  mistakes = this.state.mistakes;
  timer = this.state.timer;

  numbers = [1, 2, 3, 4];
  
  ngOnInit() {
    if (this.grid().length === 0) {
        this.generatePuzzle();
        this.startTimer();
    }
  }

  ngOnDestroy() {
    clearInterval(this.state.timerId);
  }
  
  startTimer() {
    this.state.timerId = setInterval(() => this.timer.update(t => t + 1), 1000);
  }

  generatePuzzle() {
    // For simplicity, using a pre-defined solved 4x4 grid and removing some numbers.
    const solvedGrid = [
        1, 2, 3, 4,
        3, 4, 1, 2,
        2, 1, 4, 3,
        4, 3, 2, 1
    ];
    
    // Shuffle rows within blocks and columns within blocks to create variations
    // This is a simple way to generate new valid puzzles from one seed.
    
    const cellsToRemove = this.difficulty() === 'Easy' ? 6 : (this.difficulty() === 'Medium' ? 8 : 10);
    const newGrid: SudokuCell[] = solvedGrid.map(val => ({ value: val, isOriginal: true, isInvalid: false }));
    
    let removed = 0;
    while(removed < cellsToRemove) {
        const index = Math.floor(Math.random() * 16);
        if (newGrid[index].value !== null) {
            newGrid[index].value = null;
            newGrid[index].isOriginal = false;
            removed++;
        }
    }
    this.grid.set(newGrid);
  }

  selectCell(index: number) {
    if (this.grid()[index].isOriginal) return;
    this.selectedCellIndex.set(index);
  }

  enterNumber(num: number) {
    const index = this.selectedCellIndex();
    if (index === null) return;

    this.soundService.playClick();
    this.grid.update(grid => {
        grid[index].value = num;
        // Check for validity immediately for feedback
        if (!this.isValid(grid, index)) {
            grid[index].isInvalid = true;
            this.mistakes.update(m => m + 1);
            this.soundService.playFailure();
        } else {
            grid[index].isInvalid = false;
        }
        return [...grid];
    });

    // Check for win condition
    const isFull = this.grid().every(cell => cell.value !== null);
    const noErrors = this.grid().every(cell => !cell.isInvalid);
    if(isFull && noErrors) {
        this.gameOver();
    }
  }
  
  isValid(grid: SudokuCell[], index: number): boolean {
    const val = grid[index].value;
    if (val === null) return true;

    // Check row
    const row = Math.floor(index / 4);
    for (let c = 0; c < 4; c++) {
        const i = row * 4 + c;
        if (i !== index && grid[i].value === val) return false;
    }

    // Check column
    const col = index % 4;
    for (let r = 0; r < 4; r++) {
        const i = r * 4 + col;
        if (i !== index && grid[i].value === val) return false;
    }

    // Check 2x2 box
    const boxRow = Math.floor(row / 2);
    const boxCol = Math.floor(col / 2);
    for (let r = boxRow * 2; r < boxRow * 2 + 2; r++) {
        for (let c = boxCol * 2; c < boxCol * 2 + 2; c++) {
            const i = r * 4 + c;
            if (i !== index && grid[i].value === val) return false;
        }
    }

    return true;
  }
  
  gameOver() {
    clearInterval(this.state.timerId);
    this.state.gameState.set('finished');
    
    const score = Math.max(0, 1000 - this.timer() * 5 - this.mistakes() * 50);

    const report: SudokuMiniReport = {
        type: 'SudokuMini',
        stats: [
            { label: 'Final Score', value: score },
            { label: 'Time', value: this.timer() },
            { label: 'Mistakes', value: this.mistakes() }
        ]
    };
    this.gameFinished.emit(report);
  }

  isRightBorder(index: number): boolean {
    return (index + 1) % 2 === 0 && (index + 1) % 4 !== 0;
  }

  isBottomBorder(index: number): boolean {
    const row = Math.floor(index / 4);
    return (row + 1) % 2 === 0 && (row + 1) % 4 !== 0;
  }
}