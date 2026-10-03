
import { Injectable, signal, inject, effect } from '@angular/core';
import { GeminiService } from './gemini.service';
import { SettingsService } from './settings.service';
import type { Content, Part } from '@google/genai';

export interface ChatMessage {
  role: 'user' | 'model' | 'error';
  text: string;
  isStreaming?: boolean;
  image?: string;
}

const SYSTEM_INSTRUCTION = `You are Briney, a friendly and helpful AI assistant for the 'Brine Booster' app. Your purpose is to assist users with questions about cognitive enhancement, productivity techniques (like the Pomodoro Technique), brain training, and how to use the features within the Brine Booster application. Keep your answers concise, encouraging, and easy to understand. Use simple markdown for formatting like bold, italics, lists, and code blocks.`;

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private geminiService = inject(GeminiService);
  private settingsService = inject(SettingsService);
  private history = signal<Content[]>([]);

  isLoading = signal(false);
  messages = signal<ChatMessage[]>([]);

  constructor() {
    // Re-initialize chat if the API key becomes valid
    effect(() => {
        if (this.settingsService.apiKeyValidationState() === 'valid') {
            this.initializeChat();
        } else {
            this.history.set([]);
            this.messages.set([]);
        }
    });
  }

  initializeChat() {
    this.clearChat();
  }
  
  clearChat() {
    this.history.set([]);
    if (this.settingsService.apiKeyValidationState() === 'valid') {
      this.messages.set([{ role: 'model', text: 'Hi! I\'m Briney. How can I help you boost your brain today?' }]);
    } else {
       this.messages.set([{ role: 'error', text: 'Chatbot is unavailable. Please set a valid Gemini API key in Settings.' }]);
    }
  }

  async sendMessage(prompt: string, imageBase64: string | null = null) {
    if ((!prompt.trim() && !imageBase64) || this.isLoading()) return;

    this.isLoading.set(true);
    
    // Add user message to display
    this.messages.update(m => [...m, { role: 'user', text: prompt, image: imageBase64 ?? undefined }]);

    // Prepare parts for API call
    const userParts: Part[] = [];
    if (imageBase64) {
        // data:image/png;base64,iVBORw0KGgo...
        const match = imageBase64.match(/^data:(image\/.+);base64,(.+)$/);
        if (match) {
            const mimeType = match[1];
            const data = match[2];
            userParts.push({ inlineData: { mimeType, data } });
        }
    }
     if (prompt.trim()) {
        userParts.push({ text: prompt });
    }
    
    // Update API history
    this.history.update(h => [...h, { role: 'user', parts: userParts }]);
    
    const ai = this.geminiService.getAi();
    if (!ai) {
       this.messages.update(m => [...m, { role: 'error', text: 'Chat session is not initialized. Check API key.' }]);
       this.isLoading.set(false);
       return;
    }
    
    // Add a placeholder for the streaming response
    this.messages.update(m => [...m, { role: 'model', text: '', isStreaming: true }]);
    
    let accumulatedText = '';

    try {
      const responseStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: this.history(),
          config: { systemInstruction: SYSTEM_INSTRUCTION }
      });
      
      for await (const chunk of responseStream) {
        accumulatedText += chunk.text;
        this.messages.update(m => {
          const lastMessage = m[m.length - 1];
          if (lastMessage && lastMessage.role === 'model') {
            lastMessage.text = accumulatedText;
          }
          return [...m];
        });
      }
      
      // Update API history with the full model response
      this.history.update(h => [...h, { role: 'model', parts: [{ text: accumulatedText }] }]);

    } catch (e) {
      console.error(e);
      this.messages.update(m => {
          const lastMessage = m[m.length - 1];
           if (lastMessage && lastMessage.role === 'model') {
             m.pop(); // Remove the streaming placeholder
           }
          return [...m, { role: 'error', text: 'Sorry, I encountered an error. Please try again.' }];
      });
    } finally {
       this.messages.update(m => {
          const lastMessage = m[m.length - 1];
          if (lastMessage && lastMessage.role === 'model') {
            lastMessage.isStreaming = false;
          }
          return [...m];
        });
      this.isLoading.set(false);
    }
  }
}