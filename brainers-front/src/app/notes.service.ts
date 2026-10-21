import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NoteRequest {
  title: string;
  content: string;
}

export interface NoteResponse extends NoteRequest {
  id: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotesService {
  private readonly http = inject(HttpClient);
  // Prefixed with /api so API calls never collide with the /notes/:id front route;
  // the dev proxy strips the prefix before forwarding to the backend.
  private readonly endpoint = '/api/notes';

  getAll(title = ''): Observable<NoteResponse[]> {
    let params = new HttpParams();
    if (title) {
      params = params.set('title', title);
    }
    return this.http.get<NoteResponse[]>(this.endpoint, { params });
  }

  getById(id: number): Observable<NoteResponse> {
    return this.http.get<NoteResponse>(`${this.endpoint}/${id}`);
  }

  create(note: NoteRequest): Observable<NoteResponse> {
    return this.http.post<NoteResponse>(this.endpoint, note);
  }

  update(id: number, note: NoteRequest): Observable<NoteResponse> {
    return this.http.put<NoteResponse>(`${this.endpoint}/${id}`, note);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}

export function getErrorMessage(error: unknown): string {
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
