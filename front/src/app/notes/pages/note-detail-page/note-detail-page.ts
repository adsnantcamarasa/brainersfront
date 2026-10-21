import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, linkedSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCircleAlert, lucideFileQuestion } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { NoteForm } from '../../components/note-form/note-form';
import { Note } from '../../data/note.model';
import { NoteApi } from '../../data/note-api';

/** Les états possibles du chargement de la note : un seul à la fois. */
type DetailState =
  | { status: 'loading' }
  | { status: 'success'; note: Note }
  | { status: 'not-found' }
  | { status: 'error' };

/**
 * Ce que l'utilisateur fait de la note affichée :
 * - read           : il la lit (boutons "Modifier" et "Supprimer")
 * - edit           : il la modifie (le formulaire remplace la carte)
 * - confirm-delete : il a cliqué "Supprimer", on attend sa confirmation
 */
type Mode = 'read' | 'edit' | 'confirm-delete';

const LOADING: DetailState = { status: 'loading' };

/**
 * La page de détail (route "/notes/:id") : affiche une note en entier (US-03),
 * et permet de la modifier (US-04) ou de la supprimer (US-05).
 *
 * L'id est lu dans l'URL. On écoute `paramMap` (un Observable) plutôt que de
 * lire l'URL une seule fois : si on passe de /notes/1 à /notes/2, Angular
 * RÉUTILISE ce composant, et seul paramMap nous prévient du changement.
 */
@Component({
  selector: 'app-note-detail-page',
  imports: [
    DatePipe,
    RouterLink,
    NgIcon,
    HlmButtonImports,
    HlmCardImports,
    HlmEmptyImports,
    HlmSpinnerImports,
    HlmAlertImports,
    NoteForm,
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideCircleAlert, lucideFileQuestion })],
  templateUrl: './note-detail-page.html',
})
export class NoteDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly noteApi = inject(NoteApi);

  /** La note telle que le back l'a renvoyée au chargement de la page. */
  private readonly loaded = toSignal(
    this.route.paramMap.pipe(
      // "/notes/12" → paramMap.get('id') vaut "12" (toujours une string) → 12
      map((params) => Number(params.get('id'))),
      switchMap((id) => this.load(id)),
    ),
    { initialValue: LOADING },
  );

  /**
   * L'état affiché. `linkedSignal` suit `loaded` (il se met à jour à chaque chargement),
   * mais on peut aussi le modifier à la main : après une modification réussie,
   * on y range la note renvoyée par le back, sans recharger la page.
   */
  protected readonly state = linkedSignal(() => this.loaded());

  protected readonly mode = signal<Mode>('read');

  /** Vrai pendant la suppression : bloque les boutons et affiche un spinner. */
  protected readonly deleting = signal(false);

  /** Vrai si la dernière suppression a échoué (affiche une alerte). */
  protected readonly deleteFailed = signal(false);

  protected startEdit(): void {
    this.mode.set('edit');
  }

  /** Appelé quand le formulaire émet `saved` : on affiche la note modifiée. */
  protected onSaved(note: Note): void {
    this.state.set({ status: 'success', note });
    this.mode.set('read');
  }

  protected askDeleteConfirmation(): void {
    this.deleteFailed.set(false);
    this.mode.set('confirm-delete');
  }

  /** "Annuler" dans le formulaire ou dans la confirmation : retour à la lecture. */
  protected backToReading(): void {
    this.mode.set('read');
  }

  /** Suppression confirmée : DELETE, puis retour à l'accueil (la note n'existe plus). */
  protected deleteNote(note: Note): void {
    this.deleting.set(true);

    this.noteApi.delete(note.id).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.deleting.set(false);
        this.deleteFailed.set(true);
        this.mode.set('read');
      },
    });
  }

  private load(id: number): Observable<DetailState> {
    // "/notes/abc" → NaN : inutile d'appeler le back, la note ne peut pas exister.
    if (!Number.isInteger(id) || id <= 0) {
      return of<DetailState>({ status: 'not-found' });
    }

    return this.noteApi.getById(id).pipe(
      map((note): DetailState => ({ status: 'success', note })),
      // 404 → "Note introuvable" (US-03). Toute autre erreur → message générique.
      catchError((error: HttpErrorResponse) =>
        of<DetailState>(error.status === 404 ? { status: 'not-found' } : { status: 'error' }),
      ),
      // Émis tout de suite, avant la réponse du back : affiche le spinner.
      startWith(LOADING),
    );
  }
}
