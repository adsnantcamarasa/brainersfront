import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleAlert, lucideSearch, lucideSearchX } from '@ng-icons/lucide';
import { HlmAlertImports } from '@spartan-ng/helm/alert';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { HlmSpinnerImports } from '@spartan-ng/helm/spinner';
import { catchError, finalize, map, Observable, of, Subject, switchMap } from 'rxjs';

import { Note } from '../../data/note.model';
import { NoteApi } from '../../data/note-api';
import { NoteList } from '../note-list/note-list';

/** Nombre maximum de résultats affichés sous la barre. */
export const SEARCH_MAX_RESULTS = 10;

/**
 * Ce que la zone de résultats peut afficher. Un seul état à la fois :
 * - idle    : on n'a encore rien cherché
 * - success : le back a répondu (la liste peut être vide)
 * - error   : la requête a échoué
 */
export type SearchResult =
  { status: 'idle' } | { status: 'success'; notes: Note[]; total: number } | { status: 'error' };

const IDLE: SearchResult = { status: 'idle' };

/**
 * La barre de recherche, le bouton "Rechercher" et les résultats.
 *
 * La recherche part au clic sur "Rechercher" (ou avec Entrée), pas à chaque frappe.
 * Le cœur est un "pipeline" RxJS sur les recherches demandées :
 *
 *   clic → texte nettoyé → appeler le back (en annulant l'appel précédent) → état affiché
 *
 * Le parent peut ajouter ses propres boutons à côté de "Rechercher" :
 *   <app-note-search> <a hlmBtn …>Créer</a> </app-note-search>
 */
@Component({
  selector: 'app-note-search',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    HlmButtonImports,
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

  /**
   * Les recherches demandées. Un Subject est un Observable dans lequel
   * on pousse soi-même les valeurs : ici, un texte à chaque clic sur "Rechercher".
   */
  private readonly searches = new Subject<string>();

  /** Le résultat affiché sous la barre, mis à jour à chaque recherche. */
  protected readonly result = toSignal(
    this.searches.pipe(
      // switchMap ANNULE la requête précédente si une nouvelle recherche arrive :
      // une réponse lente ne peut pas écraser une réponse plus récente.
      switchMap((term) => this.search(term)),
    ),
    { initialValue: IDLE },
  );

  /**
   * Clic sur "Rechercher" ou touche Entrée dans le champ.
   * preventDefault() : sans lui, le navigateur enverrait le formulaire et rechargerait la page.
   * Un champ vide est une vraie recherche : elle renvoie toutes les notes.
   */
  protected submit(event: Event): void {
    event.preventDefault();
    // On retire les espaces autour : "  java " → "java"
    this.searches.next(this.searchControl.value.trim());
  }

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
