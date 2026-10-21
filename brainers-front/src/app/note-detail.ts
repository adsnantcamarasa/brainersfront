import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NoteRequest, NotesService, NoteResponse } from './notes.service';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-note-detail',
  styleUrl: './app.css',
  templateUrl: './note-detail.html',
})
export class NoteDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notesService = inject(NotesService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  note = signal<NoteResponse | null>(null);
  noteTitle = '';
  noteContent = '';
  loading = signal(true);
  saving = false;
  deleting = false;
  editing = signal(false);
  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id < 1) {
      this.loading.set(false);
      this.errorMessage = 'Identifiant de note invalide.';
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
    this.noteTitle = note.title;
    this.noteContent = note.content;
    this.editing.set(true);
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.noteTitle = '';
    this.noteContent = '';
  }

  saveNote(): void {
    const note = this.note();
    if (!note || this.saving) {
      return;
    }
    const request: NoteRequest = {
      title: this.noteTitle.trim(),
      content: this.noteContent.trim(),
    };
    if (!request.title || !request.content) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.notesService.update(note.id, request).subscribe({
      next: (note) => {
        this.note.set(note);
        this.editing.set(false);
        this.saving = false;
        this.successMessage = 'Note modifiée.';
        this.changeDetectorRef.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.saving = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  deleteNote(): void {
    const note = this.note();
    if (!note || this.deleting) {
      return;
    }

    this.deleting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.notesService.delete(note.id).subscribe({
      next: () => {
        this.note.set(null);
        this.deleting = false;
        void this.router.navigate(['/']);
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.deleting = false;
        this.changeDetectorRef.markForCheck();
      },
    });
  }

  private loadNote(id: number): void {
    this.loading.set(true);
    this.errorMessage = '';
    this.notesService.getById(id).subscribe({
      next: (note) => {
        this.note.set(note);
        this.loading.set(false);
        this.changeDetectorRef.markForCheck();
      },
      error: (error: unknown) => {
        this.errorMessage = this.getErrorMessage(error);
        this.loading.set(false);
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
