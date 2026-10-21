import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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
  private readonly endpoint = '/notes';

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
