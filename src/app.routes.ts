import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { GameListComponent } from './components/games/game-list.component';
import { ProductiveListComponent } from './components/productive/productive-list.component';
import { SettingsComponent } from './components/settings/settings.component';
import { GamePlayerComponent } from './components/games/game-player/game-player.component';
import { HabitTrackerComponent } from './components/productive/habit-tracker/habit-tracker.component';
import { PomodoroTimerComponent } from './components/productive/pomodoro-timer/pomodoro-timer.component';
import { AiIdeaGeneratorComponent } from './components/productive/ai-idea-generator/ai-idea-generator.component';
import { ProgressComponent } from './components/progress/progress.component';
import { AchievementsComponent } from './components/achievements/achievements.component';
import { LeaderboardComponent } from './components/leaderboard/leaderboard.component';
import { AiGoalSetterComponent } from './components/productive/ai-goal-setter/ai-goal-setter.component';
import { AiMeetingSummarizerComponent } from './components/productive/ai-meeting-summarizer/ai-meeting-summarizer.component';
import { SavedItemsComponent } from './components/saved/saved-items.component';
import { DailyJournalComponent } from './components/productive/daily-journal/daily-journal.component';
import { DecisionSpinnerComponent } from './components/productive/decision-spinner/decision-spinner.component';
import { BrainDumpComponent } from './components/productive/brain-dump/brain-dump.component';
import { NoiseGeneratorComponent } from './components/productive/noise-generator/noise-generator.component';
import { QuickNotesComponent } from './components/productive/quick-notes/quick-notes.component';
import { PersonalCrmComponent } from './components/productive/personal-crm/personal-crm.component';
import { PasswordGeneratorComponent } from './components/productive/password-generator/password-generator.component';
import { UnitConverterComponent } from './components/productive/unit-converter/unit-converter.component';
import { BreathingExerciseComponent } from './components/productive/breathing-exercise/breathing-exercise.component';
import { BillSplitterComponent } from './components/productive/bill-splitter/bill-splitter.component';
import { TodoListComponent } from './components/productive/todo-list/todo-list.component';
import { ChatComponent } from './components/chat/chat.component';

export const APP_ROUTES: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, title: 'Brine Booster - Home' },
  { path: 'games', component: GameListComponent, title: 'Brine Booster - Games' },
  { path: 'games/:id', component: GamePlayerComponent, title: 'Brine Booster - Play' },
  { path: 'productive', component: ProductiveListComponent, title: 'Brine Booster - Productive' },
  { path: 'productive/habit-tracker', component: HabitTrackerComponent, title: 'Brine Booster - Habit Tracker' },
  { path: 'productive/pomodoro-timer', component: PomodoroTimerComponent, title: 'Brine Booster - Pomodoro Timer' },
  { path: 'productive/ai-idea-generator', component: AiIdeaGeneratorComponent, title: 'Brine Booster - Idea Generator' },
  { path: 'productive/ai-goal-setter', component: AiGoalSetterComponent, title: 'Brine Booster - Goal Setter' },
  { path: 'productive/ai-meeting-summarizer', component: AiMeetingSummarizerComponent, title: 'Brine Booster - Meeting Summarizer' },
  { path: 'productive/daily-journal', component: DailyJournalComponent, title: 'Brine Booster - Daily Journal' },
  { path: 'productive/decision-spinner', component: DecisionSpinnerComponent, title: 'Brine Booster - Decision Spinner' },
  { path: 'productive/brain-dump', component: BrainDumpComponent, title: 'Brine Booster - Brain Dump' },
  { path: 'productive/noise-generator', component: NoiseGeneratorComponent, title: 'Brine Booster - Noise Generator' },
  { path: 'productive/quick-notes', component: QuickNotesComponent, title: 'Brine Booster - Quick Notes' },
  { path: 'productive/personal-crm', component: PersonalCrmComponent, title: 'Brine Booster - Personal CRM' },
  { path: 'productive/password-generator', component: PasswordGeneratorComponent, title: 'Brine Booster - Password Generator' },
  { path: 'productive/unit-converter', component: UnitConverterComponent, title: 'Brine Booster - Unit Converter' },
  { path: 'productive/breathing-exercise', component: BreathingExerciseComponent, title: 'Brine Booster - Breathing Exercise' },
  { path: 'productive/bill-splitter', component: BillSplitterComponent, title: 'Brine Booster - Bill Splitter' },
  { path: 'productive/todo-list', component: TodoListComponent, title: 'Brine Booster - To-Do List' },
  { path: 'chat', component: ChatComponent, title: 'Brine Booster - Chat' },
  { path: 'settings', component: SettingsComponent, title: 'Brine Booster - Settings' },
  { path: 'progress', component: ProgressComponent, title: 'Brine Booster - Progress' },
  { path: 'achievements', component: AchievementsComponent, title: 'Brine Booster - Achievements' },
  { path: 'leaderboard', component: LeaderboardComponent, title: 'Brine Booster - Leaderboard' },
  { path: 'saved', component: SavedItemsComponent, title: 'Brine Booster - Saved Items' },
  { path: '**', redirectTo: 'home' } // Fallback route
];