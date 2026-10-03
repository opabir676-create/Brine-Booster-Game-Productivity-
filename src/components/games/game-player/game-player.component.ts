import { Component, ChangeDetectionStrategy, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Game } from '../games.types';
import { GAMES_LIST } from '../games.data';
import { MemoryGridComponent } from '../memory-grid/memory-grid.component';
import { LogicBlocksComponent } from '../logic-blocks/logic-blocks.component';
import { AiRiddlesComponent } from '../ai-riddles/ai-riddles.component';
import { FocusFlowComponent } from '../focus-flow/focus-flow.component';
import { AiQuizComponent } from '../ai-quiz/ai-quiz.component';
import { AiPuzzlesComponent } from '../ai-puzzles/ai-puzzles.component';
import { NumberSequenceComponent } from '../number-sequence/number-sequence.component';
import { SpeedMathComponent } from '../speed-math/speed-math.component';
import { PatternMatchComponent } from '../pattern-match/pattern-match.component';
import { CodeBreakerComponent } from '../code-breaker/code-breaker.component';
import { SpatialSpinComponent } from '../spatial-spin/spatial-spin.component';
import { ColorClashComponent } from '../color-clash/color-clash.component';
import { CardFlipperComponent } from '../card-flipper/card-flipper.component';
import { ReactionTimeComponent } from '../reaction-time/reaction-time.component';
import { AiWordScrambleComponent } from '../ai-word-scramble/ai-word-scramble.component';
import { AIGuessThePromptComponent } from '../ai-guess-the-prompt/ai-guess-the-prompt.component';
import { AITwoTruthsLieComponent } from '../ai-two-truths-lie/ai-two-truths-lie.component';
import { AISpotTheDifferenceComponent } from '../ai-spot-the-difference/ai-spot-the-difference.component';
import { AIMoralDilemmasComponent } from '../ai-moral-dilemmas/ai-moral-dilemmas.component';
import { AICreativeStoryComponent } from '../ai-creative-story/ai-creative-story.component';
import { WordLadderComponent } from '../word-ladder/word-ladder.component';
import { TrailBlazerComponent } from '../trail-blazer/trail-blazer.component';
import { OddOneOutComponent } from '../odd-one-out/odd-one-out.component';
import { SudokuMiniComponent } from '../sudoku-mini/sudoku-mini.component';
import { GameReport, Difficulty } from '../games.types';
import { ProgressService } from '../../../services/progress.service';
import { GeminiService } from '../../../services/gemini.service';
import { SettingsService } from '../../../services/settings.service';
import { ModalService } from '../../../services/modal.service';

// State Services
import { MemoryGridStateService } from '../../../services/state/memory-grid-state.service';
import { LogicBlocksStateService } from '../../../services/state/logic-blocks-state.service';
import { FocusFlowStateService } from '../../../services/state/focus-flow-state.service';
import { AiRiddlesStateService } from '../../../services/state/ai-riddles-state.service';
import { AiQuizStateService } from '../../../services/state/ai-quiz-state.service';
import { AiPuzzlesStateService } from '../../../services/state/ai-puzzles-state.service';
import { NumberSequenceStateService } from '../../../services/state/number-sequence-state.service';
import { SpeedMathStateService } from '../../../services/state/speed-math-state.service';
import { PatternMatchStateService } from '../../../services/state/pattern-match-state.service';
import { CodeBreakerStateService } from '../../../services/state/code-breaker-state.service';
import { SpatialSpinStateService } from '../../../services/state/spatial-spin-state.service';
import { ColorClashStateService } from '../../../services/state/color-clash-state.service';
import { CardFlipperStateService } from '../../../services/state/card-flipper-state.service';
import { ReactionTimeStateService } from '../../../services/state/reaction-time-state.service';
import { AiWordScrambleStateService } from '../../../services/state/ai-word-scramble-state.service';
import { AIGuessThePromptStateService } from '../../../services/state/ai-guess-the-prompt-state.service';
import { AITwoTruthsLieStateService } from '../../../services/state/ai-two-truths-lie-state.service';
import { AISpotTheDifferenceStateService } from '../../../services/state/ai-spot-the-difference-state.service';
import { AIMoralDilemmasStateService } from '../../../services/state/ai-moral-dilemmas-state.service';
import { AICreativeStoryStateService } from '../../../services/state/ai-creative-story-state.service';
import { WordLadderStateService } from '../../../services/state/word-ladder-state.service';
import { TrailBlazerStateService } from '../../../services/state/trail-blazer-state.service';
import { OddOneOutStateService } from '../../../services/state/odd-one-out-state.service';
import { SudokuMiniStateService } from '../../../services/state/sudoku-mini-state.service';


type GameState = 'start' | 'instructions' | 'playing' | 'report' | 'awaiting_api_key';

interface GameInstructions {
  title: string;
  steps: { instruction: string; example?: string }[];
  tips: string[];
}

export interface MemoryGridSettings { size: number; }
export interface LogicBlocksSettings { size: number; time: number; }


@Component({
  selector: 'app-game-player',
  templateUrl: './game-player.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink, MemoryGridComponent, LogicBlocksComponent, AiRiddlesComponent, FocusFlowComponent, AiQuizComponent, AiPuzzlesComponent, NumberSequenceComponent, SpeedMathComponent, PatternMatchComponent, CodeBreakerComponent, SpatialSpinComponent, ColorClashComponent, CardFlipperComponent, ReactionTimeComponent, AiWordScrambleComponent, AIGuessThePromptComponent, AITwoTruthsLieComponent, AISpotTheDifferenceComponent, AIMoralDilemmasComponent, AICreativeStoryComponent, WordLadderComponent, TrailBlazerComponent, OddOneOutComponent, SudokuMiniComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:popstate)': 'onPopState($event)'
  }
})
export class GamePlayerComponent {
  private route = inject(ActivatedRoute);
  private progressService = inject(ProgressService);
  private geminiService = inject(GeminiService);
  settingsService = inject(SettingsService);
  modalService = inject(ModalService);
  
  // Game data
  private gameId = signal<string>('');
  game = signal<Game | undefined>(undefined);
  
  // Game state
  gameState = signal<GameState>('start');
  selectedDifficulty = signal<Difficulty | 'Custom'>('Medium');
  gameReport = signal<GameReport>(null);
  bestScore = signal<number>(0);
  isNewBestScore = signal<boolean>(false);
  instructionsLoading = signal(false);
  gameInstructions = signal<GameInstructions | null>(null);

  // Game-specific settings
  isSettingsPanelOpen = signal(false);
  memoryGridSettings = signal<MemoryGridSettings>({ size: 4 });
  logicBlocksSettings = signal<LogicBlocksSettings>({ size: 3, time: 6 });


  // State Services for resetting games
  private memoryGridState = inject(MemoryGridStateService);
  private logicBlocksState = inject(LogicBlocksStateService);
  private focusFlowState = inject(FocusFlowStateService);
  private aiRiddlesState = inject(AiRiddlesStateService);
  private aiQuizState = inject(AiQuizStateService);
  private aiPuzzlesState = inject(AiPuzzlesStateService);
  private numberSequenceState = inject(NumberSequenceStateService);
  private speedMathState = inject(SpeedMathStateService);
  private patternMatchState = inject(PatternMatchStateService);
  private codeBreakerState = inject(CodeBreakerStateService);
  private spatialSpinState = inject(SpatialSpinStateService);
  private colorClashState = inject(ColorClashStateService);
  private cardFlipperState = inject(CardFlipperStateService);
  private reactionTimeState = inject(ReactionTimeStateService);
  private aiWordScrambleState = inject(AiWordScrambleStateService);
  private aiGuessThePromptState = inject(AIGuessThePromptStateService);
  private aiTwoTruthsLieState = inject(AITwoTruthsLieStateService);
  private aiSpotTheDifferenceState = inject(AISpotTheDifferenceStateService);
  private aiMoralDilemmasState = inject(AIMoralDilemmasStateService);
  private aiCreativeStoryState = inject(AICreativeStoryStateService);
  private wordLadderState = inject(WordLadderStateService);
  private trailBlazerState = inject(TrailBlazerStateService);
  private oddOneOutState = inject(OddOneOutStateService);
  private sudokuMiniState = inject(SudokuMiniStateService);


  // Available difficulties
  difficulties: Difficulty[] = ['Easy', 'Medium', 'Hard'];

  isCustomizable = computed(() => {
    const id = this.game()?.id;
    return id === 'memory-grid' || id === 'logic-blocks';
  });

  constructor() {
    const gameList = GAMES_LIST;
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.gameId.set(id);
        const foundGame = gameList.find(g => g.id === id);
        this.game.set(foundGame);
        
        if (foundGame) {
          if (foundGame.isOnline && this.settingsService.apiKeyValidationState() !== 'valid') {
            this.gameState.set('awaiting_api_key');
            this.modalService.showApiKeyModal();
          } else {
            this.gameState.set('start');
          }
          
          const initialDifficulty = foundGame.difficulty || 'Medium';
          this.selectedDifficulty.set(initialDifficulty);
          this.updateSettingsForDifficulty(initialDifficulty);
          const bestScores = this.progressService.stats().bestScoresByGame;
          this.bestScore.set(bestScores[id] || 0);
        }
      }
    });

    effect(() => {
        const difficulty = this.selectedDifficulty();
        if (difficulty !== 'Custom') {
            this.updateSettingsForDifficulty(difficulty);
        }
    });

    effect(() => {
      if (this.gameState() === 'awaiting_api_key' && this.settingsService.apiKeyValidationState() === 'valid') {
        this.gameState.set('start');
      }
    });
  }

  onPopState(event: PopStateEvent) {
    if (this.gameState() === 'report') {
      event.preventDefault();
      this.playAgain();
    } else if (this.gameState() === 'instructions') {
      event.preventDefault();
      this.backToStart();
    } else if (this.gameState() === 'playing') {
       event.preventDefault();
       this.backToStart();
    }
  }

  async startGame() {
    // If the API key isn't valid, there's no point trying to fetch AI-generated instructions.
    // The user can still play any offline games without them.
    if (this.settingsService.apiKeyValidationState() !== 'valid') {
      this.proceedToPlay();
      return;
    }

    this.instructionsLoading.set(true);
    this.gameState.set('instructions');
    try {
      const game = this.game();
      if (!game) throw new Error("Game data not found.");
      
      const cached = this.getCachedInstructions(game.id, this.settingsService.language());
      if (cached) {
        this.gameInstructions.set(cached);
      } else {
        const instructionsJson = await this.geminiService.generateGameInstructions(game.name, game.description);
        const instructions = JSON.parse(instructionsJson);
        this.gameInstructions.set(instructions);
        this.cacheInstructions(game.id, this.settingsService.language(), instructions);
      }
    } catch (e) {
      console.error("Failed to load instructions", e);
      this.proceedToPlay();
    } finally {
      this.instructionsLoading.set(false);
    }
  }

  proceedToPlay() {
    this.gameState.set('playing');
  }

  backToStart() {
    this.gameState.set('start');
    this.gameInstructions.set(null);
  }
  
  private getCachedInstructions(gameId: string, language: string): GameInstructions | null {
    if (typeof sessionStorage === 'undefined') return null;
    const key = `bb_instr_${gameId}_${language}`;
    const cachedData = sessionStorage.getItem(key);
    return cachedData ? JSON.parse(cachedData) : null;
  }
  
  private cacheInstructions(gameId: string, language: string, instructions: GameInstructions) {
    if (typeof sessionStorage === 'undefined') return;
    const key = `bb_instr_${gameId}_${language}`;
    try {
        sessionStorage.setItem(key, JSON.stringify(instructions));
    } catch (e) {
        console.warn('Could not cache game instructions, sessionStorage might be full.');
    }
  }

  onGameFinished(report: GameReport) {
    this.gameReport.set(report);
    this.gameState.set('report');
    
    const finalScore = this.calculateFinalScore(report);
    const oldBest = this.bestScore();

    this.isNewBestScore.set(finalScore > oldBest);
    
    this.progressService.updateStatsFromGame(report, this.gameId());

    this.bestScore.set(Math.max(oldBest, Math.floor(finalScore)));
  }
  
  private calculateFinalScore(report: GameReport): number {
    if (!report) return 0;
    let score = 0;
    switch (report.type) {
        case 'LogicBlocks':
        case 'AIRiddles':
        case 'FocusFlow':
        case 'AIQuiz':
        case 'AIPuzzles':
        case 'NumberSequence':
        case 'SpeedMath':
        case 'PatternMatch':
        case 'CodeBreaker':
        case 'SpatialSpin':
        case 'ColorClash':
        case 'CardFlipper':
        case 'ReactionTime':
        case 'AIWordScramble':
        case 'AIGuessThePrompt':
        case 'AITwoTruthsLie':
        case 'AISpotTheDifference':
        case 'AIMoralDilemmas':
        case 'AICreativeStory':
        case 'WordLadder':
        case 'TrailBlazer':
        case 'OddOneOut':
        case 'SudokuMini':
            score = report.stats.find(s => s.label === 'Final Score')?.value as number || 0;
            break;
        case 'MemoryGrid':
            const memRounds = report.stats.find(s => s.label === 'Rounds Completed')?.value as number || 0;
            score = Math.floor(memRounds * (report.accuracy / 10));
            break;
    }
    return score;
  }

  playAgain() {
    // Reset the state for the current game
    switch(this.gameId()) {
      case 'memory-grid': this.memoryGridState.reset(); break;
      case 'logic-blocks': this.logicBlocksState.reset(); break;
      case 'focus-flow': this.focusFlowState.reset(); break;
      case 'ai-riddles': this.aiRiddlesState.reset(); break;
      case 'ai-quiz': this.aiQuizState.reset(); break;
      case 'ai-puzzles': this.aiPuzzlesState.reset(); break;
      case 'number-sequence': this.numberSequenceState.reset(); break;
      case 'speed-math': this.speedMathState.reset(); break;
      case 'pattern-match': this.patternMatchState.reset(); break;
      case 'code-breaker': this.codeBreakerState.reset(); break;
      case 'spatial-spin': this.spatialSpinState.reset(); break;
      case 'color-clash': this.colorClashState.reset(); break;
      case 'card-flipper': this.cardFlipperState.reset(); break;
      case 'reaction-time': this.reactionTimeState.reset(); break;
      case 'ai-word-scramble': this.aiWordScrambleState.reset(); break;
      case 'ai-guess-the-prompt': this.aiGuessThePromptState.reset(); break;
      case 'ai-two-truths-lie': this.aiTwoTruthsLieState.reset(); break;
      case 'ai-spot-the-difference': this.aiSpotTheDifferenceState.reset(); break;
      case 'ai-moral-dilemmas': this.aiMoralDilemmasState.reset(); break;
      case 'ai-creative-story': this.aiCreativeStoryState.reset(); break;
      case 'word-ladder': this.wordLadderState.reset(); break;
      case 'trail-blazer': this.trailBlazerState.reset(); break;
      case 'odd-one-out': this.oddOneOutState.reset(); break;
      case 'sudoku-mini': this.sudokuMiniState.reset(); break;
    }

    this.gameReport.set(null);
    this.isNewBestScore.set(false);
    this.isSettingsPanelOpen.set(false);
    this.gameState.set('start');
  }

  // --- Game Settings Logic ---
  updateSettingsForDifficulty(difficulty: Difficulty) {
    const memSettings = { Easy: { size: 3 }, Medium: { size: 4 }, Hard: { size: 5 } };
    this.memoryGridSettings.set(memSettings[difficulty]);

    const logicSettings = { Easy: { size: 2, time: 8 }, Medium: { size: 3, time: 6 }, Hard: { size: 4, time: 5 } };
    this.logicBlocksSettings.set(logicSettings[difficulty]);
  }

  onMemoryGridSizeChange(event: Event) {
    const size = (event.target as HTMLInputElement).valueAsNumber;
    this.memoryGridSettings.set({ size });
    this.selectedDifficulty.set('Custom');
  }

  onLogicBlocksSizeChange(event: Event) {
    const size = (event.target as HTMLInputElement).valueAsNumber;
    this.logicBlocksSettings.update(s => ({ ...s, size }));
    this.selectedDifficulty.set('Custom');
  }

  onLogicBlocksTimeChange(event: Event) {
    const time = (event.target as HTMLInputElement).valueAsNumber;
    this.logicBlocksSettings.update(s => ({ ...s, time }));
    this.selectedDifficulty.set('Custom');
  }

  get radarChartPoints() {
    const report = this.gameReport();
    if (!report || report.type !== 'MemoryGrid') return '';
    
    const size = 100;
    const center = size / 2;
    const maxStatValue = 100; // Assuming accuracy is out of 100
    const maxReactionScore = 1000; // Lower is better, let's cap at 1s for scoring

    const accuracyScore = (report.accuracy / maxStatValue) * (center * 0.8);
    // Invert reaction time score: faster time = higher score
    const reactionScore = (1 - Math.min(report.avgReactionTime, maxReactionScore) / maxReactionScore) * (center * 0.8);
    // For the third axis, let's use a combination, e.g., 'focus'
    const focusScore = (accuracyScore + reactionScore) / 2;


    const p1 = `${center},${center - focusScore}`; // Top point (Focus)
    const p2_x = center + accuracyScore * Math.sin(2 * Math.PI / 3);
    const p2_y = center - accuracyScore * Math.cos(2 * Math.PI / 3);
    const p3_x = center + reactionScore * Math.sin(4 * Math.PI / 3);
    const p3_y = center - reactionScore * Math.cos(4 * Math.PI / 3);
    
    return `${p1} ${p2_x},${p2_y} ${p3_x},${p3_y}`;
  }
}