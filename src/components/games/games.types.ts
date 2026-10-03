export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface GameReportStat {
    label: string;
    value: string | number;
}

export interface Game {
  id: string;
  name: string;
  icon: string;
  type: string;
  description: string;
  category: 'Memory' | 'Logic' | 'Focus' | 'AI';
  isOnline: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isPlayable?: boolean;
}

export interface MemoryGridReport {
  type: 'MemoryGrid';
  stats: GameReportStat[];
  accuracy: number;
  avgReactionTime: number;
}

export interface LogicBlocksReport {
  type: 'LogicBlocks';
  stats: GameReportStat[];
  chartData: string;
}

export interface AIRiddlesReport {
  type: 'AIRiddles';
  stats: GameReportStat[];
}

export interface FocusFlowReport {
  type: 'FocusFlow';
  stats: GameReportStat[];
}

export interface AIQuizReport {
  type: 'AIQuiz';
  stats: GameReportStat[];
}

export interface AIPuzzlesReport {
  type: 'AIPuzzles';
  stats: GameReportStat[];
}

export interface NumberSequenceReport {
  type: 'NumberSequence';
  stats: GameReportStat[];
}

export interface SpeedMathReport {
  type: 'SpeedMath';
  stats: GameReportStat[];
}

export interface PatternMatchReport {
  type: 'PatternMatch';
  stats: GameReportStat[];
  accuracy: number;
  avgReactionTime: number;
  chartData: string;
}

export interface CodeBreakerReport {
  type: 'CodeBreaker';
  stats: GameReportStat[];
}

export interface SpatialSpinReport {
  type: 'SpatialSpin';
  stats: GameReportStat[];
}

export interface ColorClashReport {
  type: 'ColorClash';
  stats: GameReportStat[];
}

export interface CardFlipperReport {
  type: 'CardFlipper';
  stats: GameReportStat[];
}

export interface ReactionTimeReport {
  type: 'ReactionTime';
  stats: GameReportStat[];
}

export interface AIWordScrambleReport {
  type: 'AIWordScramble';
  stats: GameReportStat[];
}

export interface AIGuessThePromptReport {
  type: 'AIGuessThePrompt';
  stats: GameReportStat[];
}

export interface AITwoTruthsLieReport {
  type: 'AITwoTruthsLie';
  stats: GameReportStat[];
}

export interface AISpotTheDifferenceReport {
  type: 'AISpotTheDifference';
  stats: GameReportStat[];
}

export interface AIMoralDilemmasReport {
  type: 'AIMoralDilemmas';
  stats: GameReportStat[];
}

export interface AICreativeStoryReport {
  type: 'AICreativeStory';
  stats: GameReportStat[];
}

export interface WordLadderReport {
  type: 'WordLadder';
  stats: GameReportStat[];
}

export interface TrailBlazerReport {
  type: 'TrailBlazer';
  stats: GameReportStat[];
}

export interface OddOneOutReport {
  type: 'OddOneOut';
  stats: GameReportStat[];
}

export interface SudokuMiniReport {
  type: 'SudokuMini';
  stats: GameReportStat[];
}


export type GameReport = MemoryGridReport | LogicBlocksReport | AIRiddlesReport | FocusFlowReport | AIQuizReport | AIPuzzlesReport | NumberSequenceReport | SpeedMathReport | PatternMatchReport | CodeBreakerReport | SpatialSpinReport | ColorClashReport | CardFlipperReport | ReactionTimeReport | AIWordScrambleReport | AIGuessThePromptReport | AITwoTruthsLieReport | AISpotTheDifferenceReport | AIMoralDilemmasReport | AICreativeStoryReport | WordLadderReport | TrailBlazerReport | OddOneOutReport | SudokuMiniReport | null;