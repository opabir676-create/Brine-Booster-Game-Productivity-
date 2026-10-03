import { Injectable, inject } from '@angular/core';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private settingsService = inject(SettingsService);
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser");
      }
    }
  }

  private play(type: OscillatorType, frequency: number, duration: number, volume: number = 0.3) {
    if (!this.settingsService.soundOn() || !this.audioContext) return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  playClick() {
    this.play('sine', 800, 0.1, 0.15);
  }

  playSuccess() {
    this.play('sine', 600, 0.2, 0.2);
    setTimeout(() => this.play('sine', 800, 0.2, 0.2), 100);
  }

  playFailure() {
    this.play('sawtooth', 200, 0.3, 0.2);
  }
  
  playNotify() {
    this.play('sine', 523.25, 1.5, 0.3);
  }
}
