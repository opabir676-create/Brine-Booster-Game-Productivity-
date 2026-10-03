import { Component, ChangeDetectionStrategy, inject, signal, viewChild, ElementRef, afterNextRender, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';
import { SettingsService } from '../../services/settings.service';
import { ModalService } from '../../services/modal.service';
import { SoundService } from '../../services/sound.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  chatbotService = inject(ChatbotService);
  settingsService = inject(SettingsService);
  modalService = inject(ModalService);
  soundService = inject(SoundService);
  
  userInput = signal('');
  copiedIndex = signal<number | null>(null);
  selectedImage = signal<string | null>(null);
  
  chatContainer = viewChild<ElementRef>('chatContainer');
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  suggestedPrompts = [
    'Explain the Pomodoro Technique',
    'Give me a tip for better focus',
    'How do I play the Memory Grid game?',
    'What are the benefits of brain training?'
  ];

  constructor() {
    effect(() => {
        // This effect runs whenever messages change
        this.chatbotService.messages(); 
        this.scrollToBottom();
    }, { allowSignalWrites: true });

    afterNextRender(() => {
      // Ensure chat is initialized when component is loaded, if not already
      if (this.chatbotService.messages().length === 0) {
        this.chatbotService.initializeChat();
      }
      this.scrollToBottom();
    });
  }

  sendMessage(prompt?: string) {
    const message = prompt || this.userInput();
    const image = this.selectedImage();
    if (!message.trim() && !image) return;
    
    this.chatbotService.sendMessage(message, image);
    this.userInput.set('');
    this.selectedImage.set(null);
  }
  
  clearChat() {
    this.soundService.playClick();
    this.chatbotService.clearChat();
  }

  copyMessage(message: ChatMessage, index: number) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.stripMarkdown(message.text)).then(() => {
        this.copiedIndex.set(index);
        setTimeout(() => {
          if (this.copiedIndex() === index) {
            this.copiedIndex.set(null);
          }
        }, 2000);
      });
    }
  }
  
  triggerFileInput() {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.selectedImage.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeSelectedImage() {
    this.selectedImage.set(null);
  }

  parseMarkdown(text: string): string {
    // Basic markdown parsing
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>')       // Italic
      .replace(/^\s*\*\s(.*)/gm, '<ul class="list-disc list-inside ml-4"><li>$1</li></ul>') // Lists
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-black/30 p-2 rounded-md text-sm whitespace-pre-wrap font-mono"><code>$1</code></pre>'); // Code blocks
  }

  stripMarkdown(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^\s*\*\s/gm, '')
      .replace(/```/g, '');
  }

  private scrollToBottom(): void {
    setTimeout(() => {
        try {
            if (this.chatContainer()) {
                this.chatContainer()!.nativeElement.scrollTop = this.chatContainer()!.nativeElement.scrollHeight;
            }
        } catch (err) { console.error('Could not scroll to bottom of chat:', err); }
    }, 100);
  }
}