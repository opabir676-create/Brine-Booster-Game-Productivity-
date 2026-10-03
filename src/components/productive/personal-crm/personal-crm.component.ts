import { Component, ChangeDetectionStrategy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Contact {
  id: number;
  name: string;
  notes: string;
  followUpDate?: string;
}

@Component({
  selector: 'app-personal-crm',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './personal-crm.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonalCrmComponent {
  contacts = signal<Contact[]>([]);
  searchQuery = signal('');

  isFormVisible = signal(false);
  isEditing = signal(false);
  currentContact = signal<Contact>({ id: 0, name: '', notes: '', followUpDate: '' });

  filteredContacts = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.contacts().filter(
      c => c.name.toLowerCase().includes(query) || c.notes.toLowerCase().includes(query)
    ).sort((a, b) => (a.followUpDate || '9999').localeCompare(b.followUpDate || '9999'));
  });

  constructor() {
    this.loadContacts();
    effect(() => {
      this.saveContacts();
    });
  }

  private loadContacts() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bb_personalCrm');
      if (stored) {
        this.contacts.set(JSON.parse(stored));
      }
    }
  }

  private saveContacts() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('bb_personalCrm', JSON.stringify(this.contacts()));
    }
  }
  
  showAddForm() {
    this.isEditing.set(false);
    this.currentContact.set({ id: 0, name: '', notes: '', followUpDate: '' });
    this.isFormVisible.set(true);
  }

  showEditForm(contact: Contact) {
    this.isEditing.set(true);
    this.currentContact.set({ ...contact });
    this.isFormVisible.set(true);
  }

  hideForm() {
    this.isFormVisible.set(false);
  }
  
  saveContact() {
    if (!this.currentContact().name.trim()) return;

    if (this.isEditing()) {
      // Update existing contact
      this.contacts.update(contacts => 
        contacts.map(c => c.id === this.currentContact().id ? this.currentContact() : c)
      );
    } else {
      // Add new contact
      this.contacts.update(contacts => [
        { ...this.currentContact(), id: Date.now() },
        ...contacts
      ]);
    }
    this.hideForm();
  }

  deleteContact(id: number) {
    if (confirm('Are you sure you want to delete this contact?')) {
        this.contacts.update(contacts => contacts.filter(c => c.id !== id));
    }
  }
}