import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { FormField, FormRoot, form } from '@angular/forms/signals';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { noteSchema, toNoteRequest } from './note-form';
import { NoteRequest, NoteResponse, NotesService, getErrorMessage } from './notes.service';

@Component({
  imports: [FormField, FormRoot, RouterLink],
  selector: 'app-note-detail',
  styleUrl: './app.css',
  templateUrl: './note-detail.html',
})
export class NoteDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notesService = inject(NotesService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly note = signal<NoteResponse | null>(null);
  readonly loading = signal(true);
  readonly editing = signal(false);
  readonly confirmingDelete = signal(false);
  readonly deleting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly editForm = form(signal<NoteRequest>({ title: '', content: '' }), noteSchema, {
    submission: { action: (field) => this.saveNote(field().value()) },
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id < 1) {
      this.loading.set(false);
      this.errorMessage.set('Identifiant de note invalide.');
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      this.loadNote(id);
    }
  }

  editNote(): void {
    const note = this.note();
    if (!note) {
      return;
    }
    this.editForm().reset({ title: note.title, content: note.content });
    this.editing.set(true);
    this.confirmingDelete.set(false);
    this.clearMessages();
  }

  cancelEdit(): void {
    this.editing.set(false);
  }

  askDeleteConfirmation(): void {
    this.confirmingDelete.set(true);
    this.clearMessages();
  }

  cancelDelete(): void {
    this.confirmingDelete.set(false);
  }

  deleteNote(): void {
    const note = this.note();
    if (!note || this.deleting()) {
      return;
    }

    this.deleting.set(true);
    this.clearMessages();
    this.notesService.delete(note.id).subscribe({
      next: () => void this.router.navigate(['/']),
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error));
        this.deleting.set(false);
        this.confirmingDelete.set(false);
      },
    });
  }

  private async saveNote(value: NoteRequest): Promise<void> {
    const note = this.note();
    if (!note) {
      return;
    }

    this.clearMessages();
    try {
      const updated = await firstValueFrom(this.notesService.update(note.id, toNoteRequest(value)));
      this.note.set(updated);
      this.editing.set(false);
      this.successMessage.set('Note modifiée.');
    } catch (error) {
      this.errorMessage.set(getErrorMessage(error));
    }
  }

  private loadNote(id: number): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.notesService.getById(id).subscribe({
      next: (note) => {
        this.note.set(note);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.errorMessage.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  private clearMessages(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
