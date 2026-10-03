import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SoundService } from '../../../services/sound.service';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './password-generator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordGeneratorComponent {
  private soundService = inject(SoundService);
  password = signal('');
  length = signal(16);
  includeUppercase = signal(true);
  includeNumbers = signal(true);
  includeSymbols = signal(true);
  isCopied = signal(false);

  constructor() {
    this.generatePassword();
  }

  generatePassword() {
    this.soundService.playClick();
    let charset = 'abcdefghijklmnopqrstuvwxyz';
    if (this.includeUppercase()) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (this.includeNumbers()) charset += '0123456789';
    if (this.includeSymbols()) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    let newPassword = '';
    for (let i = 0, n = charset.length; i < this.length(); ++i) {
      newPassword += charset.charAt(Math.floor(Math.random() * n));
    }
    this.password.set(newPassword);
    this.isCopied.set(false);
  }

  copyPassword() {
    if (!this.password()) return;
    navigator.clipboard.writeText(this.password()).then(() => {
      this.soundService.playSuccess();
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    });
  }
}
