import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NoteRequest, NotesService, NoteResponse } from './notes.service';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-notes-list',
  styleUrl: './app.css',
  templateUrl: './notes-list.html',
})
export class NotesListPage implements OnInit {
  private readonly notesService = inject(NotesService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  notes: NoteResponse[] = [];
  searchTitle = '';
  noteTitle = '';
  noteContent = '';
  loading = false;
  saving = false;
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

  saveNote(): void {
    const request: NoteRequest = {
      title: this.noteTitle.trim(),
      content: this.noteContent.trim(),
    };
    if (!request.title || !request.content || this.saving) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.notesService.create(request).subscribe({
      next: (note) => {
        this.saving = false;
        this.noteTitle = '';
        this.noteContent = '';
        this.changeDetectorRef.markForCheck();
        void this.router.navigate(['/notes', note.id]);
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.saving = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private loadNotes(title = ''): void {
    this.loading = true;
    this.errorMessage = '';
    this.notesService.getAll(title).subscribe({
      next: (notes) => {
        this.notes = notes;
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.loading = false;
        this.changeDetectorRef.markForCheck();
      },
    });
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
