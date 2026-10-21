import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert, lucideSearch, lucideSearchX } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';

import { Note } from '../../data/note.model';
import { NoteApi } from '../../data/note-api';
import { NoteList } from '../note-list/note-list';

/** Délai d'attente après la dernière frappe avant d'interroger le back (ms). */
export const SEARCH_DEBOUNCE_MS = 300;

/** Nombre maximum de résultats affichés sous la barre. */
export const SEARCH_MAX_RESULTS = 10;

/**
 * Ce que la zone de résultats peut afficher. Un seul état à la fois :
 * - idle    : le champ est vide, on n'a rien cherché
 * - success : le back a répondu (la liste peut être vide)
 * - error   : la requête a échoué
 */
export type SearchResult =
  { status: 'idle' } | { status: 'success'; notes: Note[]; total: number } | { status: 'error' };

const IDLE: SearchResult = { status: 'idle' };

/**
 * La barre de recherche et ses résultats.
 *
 * Le cœur est un "pipeline" RxJS sur les valeurs du champ :
 *
 *   frappes → nettoyer → attendre 300 ms de calme → ignorer si identique
 *           → appeler le back (en annulant l'appel précédent) → état affiché
 */
@Component({
  selector: 'app-note-search',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    HlmInputGroupImports,
    HlmSpinnerImports,
    HlmEmptyImports,
    HlmAlertImports,
    NoteList,
  ],
  providers: [provideIcons({ lucideSearch, lucideSearchX, lucideCircleAlert })],
  templateUrl: './note-search.html',
})
export class NoteSearch {
  private readonly noteApi = inject(NoteApi);

  protected readonly maxResults = SEARCH_MAX_RESULTS;

  /** Le champ de recherche. `nonNullable` : sa valeur est toujours une string. */
  protected readonly searchControl = new FormControl('', { nonNullable: true });

  /** Vrai pendant qu'une requête est en cours (affiche le spinner dans la barre). */
  protected readonly loading = signal(false);

  /** Le résultat affiché sous la barre, mis à jour à chaque recherche. */
  protected readonly result = toSignal(
    this.searchControl.valueChanges.pipe(
      // 1. On retire les espaces autour : "  java " → "java"
      map((value) => value.trim()),
      // 2. On attend 300 ms sans nouvelle frappe avant de continuer
      debounceTime(SEARCH_DEBOUNCE_MS),
      // 3. On ignore la valeur si elle est identique à la précédente
      distinctUntilChanged(),
      // 4. On lance la recherche. switchMap ANNULE la requête précédente
      //    si une nouvelle arrive : une réponse lente ne peut pas écraser
      //    une réponse plus récente.
      switchMap((term) => (term === '' ? of(IDLE) : this.search(term))),
    ),
    { initialValue: IDLE },
  );

  /** Une recherche : appel au back, transformé en état affichable. */
  private search(term: string): Observable<SearchResult> {
    this.loading.set(true);

    return this.noteApi.searchByTitle(term).pipe(
      map((notes): SearchResult => ({
        status: 'success',
        notes: notes.slice(0, SEARCH_MAX_RESULTS),
        total: notes.length,
      })),
      // L'erreur est rattrapée ICI, dans la recherche, et transformée en état.
      // Si elle remontait jusqu'au pipeline principal, il s'arrêterait
      // et plus aucune recherche ne fonctionnerait.
      catchError(() => of<SearchResult>({ status: 'error' })),
      // Appelé quand la requête se termine OU quand switchMap l'annule.
      finalize(() => this.loading.set(false)),
    );
  }
}
