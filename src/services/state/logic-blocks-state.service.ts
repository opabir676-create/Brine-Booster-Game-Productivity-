import { Injectable, signal } from '@angular/core';

interface Shape {
  id: number;
  isOdd: boolean;
  color: string;
}

@Injectable({ providedIn: 'root' })
export class LogicBlocksStateService {
  gridSize = signal(2);
  shapes = signal<Shape[]>([]);
  round = signal(1);
  score = signal(0);
  timeLeft = signal(5);
  timerId: any;
  responseTimes: number[] = [];
  roundStartTime = 0;
  isGameInProgress = signal(false);

  reset() {
    clearInterval(this.timerId);
    this.gridSize.set(2);
    this.shapes.set([]);
    this.round.set(1);
    this.score.set(0);
    this.timeLeft.set(5);
    this.responseTimes = [];
    this.roundStartTime = 0;
    this.isGameInProgress.set(false);
  }
}