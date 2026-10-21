import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NotesService, NoteResponse } from './notes.service';

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly notesService = inject(NotesService);
  private readonly platformId = inject(PLATFORM_ID);

  notes: NoteResponse[] = [];
  selectedNote: NoteResponse | null = null;
  searchTitle = '';
  noteTitle = '';
  noteContent = '';
  editingNoteId: number | null = null;
  loading = false;
  saving = false;
  detailLoadingId: number | null = null;
  deletingId: number | null = null;
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadNotes();
    }
  }

  searchNotes(): void {
    this.loadNotes(this.searchTitle.trim());
  }

  loadNotes(title = ''): void {
    this.loading = true;
    this.errorMessage = '';

    this.notesService.getAll(title).subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.loading = false;
      },
    });
  }

  showNote(id: number): void {
    this.detailLoadingId = id;
    this.errorMessage = '';

    this.notesService.getById(id).subscribe({
      next: (note) => {
        this.selectedNote = note;
        this.detailLoadingId = null;
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.detailLoadingId = null;
      },
    });
  }

  saveNote(): void {
    const title = this.noteTitle.trim();
    const content = this.noteContent.trim();
    if (!title || !content || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    const request = { title, content };
    const saveRequest =
      this.editingNoteId === null
        ? this.notesService.create(request)
        : this.notesService.update(this.editingNoteId, request);

    saveRequest.subscribe({
      next: (note) => {
        this.successMessage =
          this.editingNoteId === null
            ? 'Note créée.'
            : 'Note modifiée.';
        this.saving = false;
        this.resetForm();
        this.selectedNote = note;
        this.loadNotes(this.searchTitle.trim());
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.saving = false;
      },
    });
  }

  editNote(note: NoteResponse): void {
    this.editingNoteId = note.id;
    this.noteTitle = note.title;
    this.noteContent = note.content;
    this.successMessage = '';
    this.errorMessage = '';
  }

  cancelEdit(): void {
    this.resetForm();
  }

  deleteNote(note: NoteResponse): void {
    if (this.deletingId !== null) {
      return;
    }

    this.deletingId = note.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.notesService.delete(note.id).subscribe({
      next: () => {
        this.successMessage = 'Note supprimée.';
        this.deletingId = null;
        if (this.selectedNote?.id === note.id) {
          this.selectedNote = null;
        }
        if (this.editingNoteId === note.id) {
          this.resetForm();
        }
        this.loadNotes(this.searchTitle.trim());
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.deletingId = null;
      },
    });
  }

  private resetForm(): void {
    this.editingNoteId = null;
    this.noteTitle = '';
    this.noteContent = '';
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }
      if (
        typeof error.error === 'object' &&
        error.error !== null &&
        'message' in error.error &&
        typeof error.error.message === 'string'
      ) {
        return error.error.message;
      }
      return error.status === 0
        ? 'Le serveur est injoignable. Vérifie que le back est lancé sur le port 8080.'
        : `Erreur du serveur (${error.status}).`;
    }
    return 'Une erreur inattendue est survenue.';
  }
}
