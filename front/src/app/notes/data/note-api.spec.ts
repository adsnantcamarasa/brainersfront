import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { Note } from './note.model';
import { NoteApi } from './note-api';

/**
 * On teste que le service construit les BONNES requêtes.
 * HttpTestingController intercepte les appels : aucune requête ne part vraiment,
 * et c'est le test qui décide de la réponse (flush).
 */
describe('NoteApi', () => {
  let api: NoteApi;
  let http: HttpTestingController;

  const note: Note = {
    id: 1,
    title: 'Stream java',
    content: 'Traiter des collections de manière fonctionnelle.',
    createdAt: '2026-10-16T09:49:25.123456',
    lastUpdateAt: '2026-10-16T09:49:25.123456',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(NoteApi);
    http = TestBed.inject(HttpTestingController);
  });

  // Échoue si un test a laissé une requête sans réponse (ou en a fait une de trop).
  afterEach(() => http.verify());

  it('searchByTitle : GET /api/notes avec le paramètre title', () => {
    let received: Note[] | undefined;
    api.searchByTitle('java').subscribe((notes) => (received = notes));

    const req = http.expectOne((r) => r.url === '/api/notes');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('title')).toBe('java');

    req.flush([note]);
    expect(received).toEqual([note]);
  });

  it('searchByTitle avec un titre vide : GET /api/notes sans paramètre', () => {
    api.searchByTitle('').subscribe();

    const req = http.expectOne((r) => r.url === '/api/notes');
    expect(req.request.params.has('title')).toBe(false);
    req.flush([note]);
  });

  it('getById : GET /api/notes/{id}', () => {
    api.getById(12).subscribe();

    const req = http.expectOne('/api/notes/12');
    expect(req.request.method).toBe('GET');
    req.flush(note);
  });

  it('create : POST /api/notes avec le titre et le contenu', () => {
    let created: Note | undefined;
    api
      .create({ title: 'Stream java', content: 'Traiter des collections.' })
      .subscribe((n) => (created = n));

    const req = http.expectOne('/api/notes');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Stream java', content: 'Traiter des collections.' });

    req.flush(note, { status: 201, statusText: 'Created' });
    expect(created).toEqual(note);
  });

  it('update : PUT /api/notes/{id} avec le titre et le contenu', () => {
    let updated: Note | undefined;
    api
      .update(1, { title: 'Stream java', content: 'Nouveau contenu.' })
      .subscribe((n) => (updated = n));

    const req = http.expectOne('/api/notes/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ title: 'Stream java', content: 'Nouveau contenu.' });

    req.flush(note);
    expect(updated).toEqual(note);
  });

  it('delete : DELETE /api/notes/{id}', () => {
    let done = false;
    api.delete(1).subscribe(() => (done = true));

    const req = http.expectOne('/api/notes/1');
    expect(req.request.method).toBe('DELETE');

    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(done).toBe(true);
  });
});
