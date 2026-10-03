import { Injectable, signal, effect } from '@angular/core';

export type SavedItemType = 'idea' | 'goal-plan' | 'meeting-summary';

export interface SavedItem {
  id: number;
  type: SavedItemType;
  title: string;
  content: any;
  date: number;
}

@Injectable({ providedIn: 'root' })
export class SavedItemsService {
  private getItem<T>(key: string, defaultValue: T): T {
    if (typeof window !== 'undefined') {
      const storedValue = window.localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : defaultValue;
    }
    return defaultValue;
  }

  savedItems = signal<SavedItem[]>(this.getItem('bb_savedItems', []));

  constructor() {
    effect(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('bb_savedItems', JSON.stringify(this.savedItems()));
      }
    });
  }

  saveItem(item: Omit<SavedItem, 'id' | 'date'>) {
    const newItem: SavedItem = {
      ...item,
      id: Date.now(),
      date: Date.now(),
    };
    this.savedItems.update(items => [newItem, ...items]);
  }

  deleteItem(itemId: number) {
    this.savedItems.update(items => items.filter(item => item.id !== itemId));
  }
}
