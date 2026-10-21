import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideCircleAlert, lucideFileQuestion } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';

import { Note } from '../../data/note.model';
import { NoteApi } from '../../data/note-api';

/** Les états possibles de la page : un seul à la fois. */
type DetailState =
  | { status: 'loading' }
  | { status: 'success'; note: Note }
  | { status: 'not-found' }
  | { status: 'error' };

const LOADING: DetailState = { status: 'loading' };

/**
 * La page de détail (route "/notes/:id") : affiche une note en entier (US-03).
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
  ],
  providers: [provideIcons({ lucideArrowLeft, lucideCircleAlert, lucideFileQuestion })],
  templateUrl: './note-detail-page.html',
})
export class NoteDetailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly noteApi = inject(NoteApi);

  protected readonly state = toSignal(
    this.route.paramMap.pipe(
      // "/notes/12" → paramMap.get('id') vaut "12" (toujours une string) → 12
      map((params) => Number(params.get('id'))),
      switchMap((id) => this.load(id)),
    ),
    { initialValue: LOADING },
  );

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
