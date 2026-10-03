import { Component, ChangeDetectionStrategy, input, output, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Difficulty, WordLadderReport } from '../games.types';
import { SoundService } from '../../../services/sound.service';
import { WordLadderStateService, LadderPuzzle } from '../../../services/state/word-ladder-state.service';

const PUZZLES: { [key in Difficulty]: LadderPuzzle[] } = {
    Easy: [
        { start: 'CAT', end: 'DOG', path: ['CAT', null, 'DOG'], solution: ['CAT', 'COG', 'DOG'] },
        { start: 'ONE', end: 'TWO', path: ['ONE', null, 'TWO'], solution: ['ONE', 'OWE', 'TWO'] },
    ],
    Medium: [
        { start: 'COLD', end: 'WARM', path: ['COLD', null, null, 'WARM'], solution: ['COLD', 'CORD', 'WORD', 'WARM'] },
        { start: 'HEAD', end: 'TAIL', path: ['HEAD', null, null, 'TAIL'], solution: ['HEAD', 'HEAL', 'TEAL', 'TAIL'] },
    ],
    Hard: [
        { start: 'FLOUR', end: 'BREAD', path: ['FLOUR', null, null, null, 'BREAD'], solution: ['FLOUR', 'FLOOR', 'FLOOD', 'BLOOD', 'BROOD', 'BREAD'] },
    ],
};


@Component({
  selector: 'app-word-ladder',
  templateUrl: './word-ladder.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WordLadderComponent implements OnInit, OnDestroy {
  difficulty = input.required<Difficulty>();
  gameFinished = output<WordLadderReport>();

  soundService = inject(SoundService);
  state = inject(WordLadderStateService);

  // Expose state signals
  gameState = this.state.gameState;
  puzzles = this.state.puzzles;
  currentPuzzleIndex = this.state.currentPuzzleIndex;
  userGuesses = this.state.userGuesses;
  score = this.state.score;
  timer = this.state.timer;
  
  ngOnInit() {
    if (this.puzzles().length === 0) {
        this.startGame();
    }
  }

  ngOnDestroy() {
    clearInterval(this.state.timerId);
  }

  startGame() {
    this.state.puzzles.set(PUZZLES[this.difficulty()]);
    this.startTimer();
  }
  
  startTimer() {
    this.state.timerId = setInterval(() => this.timer.update(t => t + 1), 1000);
  }

  updateGuess(index: number, value: string) {
    this.userGuesses.update(g => ({...g, [index]: value}));
  }

  submitGuesses() {
    const puzzle = this.puzzles()[this.currentPuzzleIndex()];
    let allCorrect = true;
    let currentScore = 0;

    puzzle.path.forEach((rung, index) => {
        if (rung === null) {
            const userGuess = (this.userGuesses()[index] || '').toUpperCase();
            if (userGuess === puzzle.solution[index]) {
                currentScore += 100;
            } else {
                allCorrect = false;
            }
        }
    });

    if (allCorrect) {
        this.soundService.playSuccess();
        this.score.update(s => s + currentScore);
        if (this.currentPuzzleIndex() + 1 >= this.puzzles().length) {
            this.gameOver();
        } else {
            this.currentPuzzleIndex.update(i => i + 1);
            this.userGuesses.set({}); // Reset for next puzzle
        }
    } else {
        this.soundService.playFailure();
        // Maybe add a visual indicator for wrong answers
    }
  }

  gameOver() {
    clearInterval(this.state.timerId);
    this.gameState.set('finished');
    
    // Final score calculation can add a time bonus
    const timeBonus = Math.max(0, 100 - this.timer());
    this.score.update(s => s + timeBonus);

    const report: WordLadderReport = {
        type: 'WordLadder',
        stats: [
            { label: 'Final Score', value: this.score() },
            { label: 'Puzzles Solved', value: this.puzzles().length },
            { label: 'Time', value: `${this.timer()}s` },
        ]
    };
    this.gameFinished.emit(report);
  }
}