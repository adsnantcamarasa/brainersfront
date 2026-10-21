import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Note, NoteRequest } from './note.model';

/**
 * Le SEUL endroit de l'application qui fait des appels HTTP pour les notes.
 *
 * Les composants ne connaissent ni les URL ni HttpClient : ils appellent ces méthodes.
 * Si une route du back change, c'est le seul fichier à modifier.
 *
 * Chaque méthode renvoie un Observable "froid" : la requête part seulement
 * quand quelqu'un s'y abonne (subscribe, switchMap, toSignal...).
 *
 * `@Service()` (Angular 22) = une seule instance pour toute l'application,
 * injectable partout avec `inject(NoteApi)`.
 * Dans les versions plus anciennes : `@Injectable({ providedIn: 'root' })`, même effet.
 */
@Service()
export class NoteApi {
  private readonly http = inject(HttpClient);
  private readonly notesUrl = `${environment.apiUrl}/notes`;

  /**
   * GET /api/notes?title=...  →  NoteController.getAll(search)
   * Renvoie les notes dont le titre contient le texte (sans tenir compte de la casse).
   * Titre vide : GET /api/notes, sans paramètre → toutes les notes.
   */
  searchByTitle(title: string): Observable<Note[]> {
    const params: Record<string, string> = title === '' ? {} : { title };
    return this.http.get<Note[]>(this.notesUrl, { params });
  }

  /**
   * GET /api/notes/{id}  →  NoteController.getById(id)
   * Erreur HTTP 404 si la note n'existe pas.
   */
  getById(id: number): Observable<Note> {
    return this.http.get<Note>(`${this.notesUrl}/${id}`);
  }

  /**
   * POST /api/notes  →  NoteController.create(noteRequest)
   * Réponse 201 avec la note créée. Erreur HTTP 409 si le titre existe déjà.
   */
  create(request: NoteRequest): Observable<Note> {
    return this.http.post<Note>(this.notesUrl, request);
  }

  /**
   * PUT /api/notes/{id}  →  NoteController.update(id, noteRequest)
   * Réponse 200 avec la note modifiée. Erreur HTTP 404 si la note n'existe pas.
   */
  update(id: number, request: NoteRequest): Observable<Note> {
    return this.http.put<Note>(`${this.notesUrl}/${id}`, request);
  }

  /**
   * DELETE /api/notes/{id}  →  NoteController.delete(id)
   * Réponse 204 sans contenu. Erreur HTTP 404 si la note n'existe pas.
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.notesUrl}/${id}`);
  }
}
