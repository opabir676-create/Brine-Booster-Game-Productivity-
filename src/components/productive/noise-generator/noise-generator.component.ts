import { Component, ChangeDetectionStrategy, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type NoiseType = 'white' | 'pink' | 'brown';
interface Sound {
  type: NoiseType;
  name: string;
  icon: string;
}

@Component({
  selector: 'app-noise-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './noise-generator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoiseGeneratorComponent implements OnDestroy {
  sounds: Sound[] = [
    { type: 'white', name: 'White Noise', icon: '🌊' },
    { type: 'pink', name: 'Pink Noise', icon: '🌧️' },
    { type: 'brown', name: 'Brown Noise', icon: '💨' },
  ];

  activeSound = signal<NoiseType | null>(null);
  volume = signal(0.5);

  private audioContext: AudioContext | null = null;
  private noiseNode: AudioWorkletNode | ScriptProcessorNode | null = null;
  private gainNode: GainNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported.");
      }
    }
  }

  ngOnDestroy() {
    this.stop();
  }

  toggleSound(type: NoiseType) {
    if (this.activeSound() === type) {
      this.stop();
    } else {
      this.play(type);
    }
  }

  private play(type: NoiseType) {
    if (!this.audioContext) return;
    this.stop(); // Stop any existing sound

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.setValueAtTime(this.volume(), this.audioContext.currentTime);
    this.gainNode.connect(this.audioContext.destination);

    // Using ScriptProcessorNode for broader compatibility
    const bufferSize = 4096;
    let lastOut = 0;
    
    // Coefficients for pink and brown noise
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;

    const node = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    node.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        switch(type) {
            case 'pink':
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                b3 = 0.86650 * b3 + white * 0.3104856;
                b4 = 0.55000 * b4 + white * 0.5329522;
                b5 = -0.7616 * b5 - white * 0.0168980;
                output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                output[i] *= 0.11; // (roughly) compensate for gain
                b6 = white * 0.115926;
                break;
            case 'brown':
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                output[i] = lastOut * 3.5;
                break;
            default: // white
                output[i] = white;
        }
      }
    };
    node.connect(this.gainNode);
    this.noiseNode = node;
    this.activeSound.set(type);
  }

  private stop() {
    if (this.noiseNode) {
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
    }
    this.activeSound.set(null);
  }

  onVolumeChange(event: Event) {
    const newVolume = (event.target as HTMLInputElement).valueAsNumber;
    this.volume.set(newVolume);
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.setValueAtTime(newVolume, this.audioContext.currentTime);
    }
  }
}