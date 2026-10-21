import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormField, FormRoot, form } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { noteSchema, toNoteRequest } from './note-form';
import { NoteRequest, NoteResponse, NotesService, getErrorMessage } from './notes.service';

@Component({
  imports: [FormField, FormRoot, RouterLink],
  selector: 'app-notes-list',
  styleUrl: './app.css',
  templateUrl: './notes-list.html',
})
export class NotesListPage implements OnInit {
  private readonly notesService = inject(NotesService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly notes = signal<NoteResponse[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly searchForm = form(signal({ title: '' }), {
    submission: { action: async (field) => this.loadNotes(field.title().value().trim()) },
  });

  readonly createForm = form(signal<NoteRequest>({ title: '', content: '' }), noteSchema, {
    submission: { action: (field) => this.createNote(field().value()) },
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadNotes();
    }
  }

  private async createNote(value: NoteRequest): Promise<void> {
    this.errorMessage.set('');
    try {
      const note = await firstValueFrom(this.notesService.create(toNoteRequest(value)));
      await this.router.navigate(['/notes', note.id]);
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error));
    }
  }

  private loadNotes(title = ''): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.notesService.getAll(title).subscribe({
      next: (notes) => {
        this.notes.set(notes);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }
}
