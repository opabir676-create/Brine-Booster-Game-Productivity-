import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ModalService {
  apiKeyModalVisible = signal(false);

  showApiKeyModal() {
    this.apiKeyModalVisible.set(true);
  }

  hideApiKeyModal() {
    this.apiKeyModalVisible.set(false);
  }
}
