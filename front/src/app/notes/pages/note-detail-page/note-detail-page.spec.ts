import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { NoteDetailPage } from './note-detail-page';

describe('NoteDetailPage', () => {
  /** Crée la page comme si l'URL était /notes/{id}. */
  const openPage = (id: string) => {
    TestBed.configureTestingModule({
      imports: [NoteDetailPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        // On remplace la route active par une fausse, avec l'id voulu.
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id })) } },
      ],
    });
    const fixture = TestBed.createComponent(NoteDetailPage);
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController) };
  };

  it('affiche la note renvoyée par le back', () => {
    const { fixture, http } = openPage('12');

    http.expectOne('/api/notes/12').flush({
      id: 12,
      title: 'Maven',
      content: 'Un outil de build.',
      createdAt: '2026-10-16T09:49:25',
      lastUpDateTime: '2026-10-16T09:49:25',
    });
    fixture.detectChanges();

    const page: HTMLElement = fixture.nativeElement;
    expect(page.querySelector('h1')?.textContent).toContain('Maven');
    expect(page.textContent).toContain('Un outil de build.');
    http.verify();
  });

  it('affiche "Note introuvable" quand le back répond 404', () => {
    const { fixture, http } = openPage('999');

    http
      .expectOne('/api/notes/999')
      .flush('Note not found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Note introuvable');
    http.verify();
  });

  it('n’appelle pas le back si l’id n’est pas un nombre', () => {
    const { fixture, http } = openPage('abc');

    http.expectNone(() => true);
    expect(fixture.nativeElement.textContent).toContain('Note introuvable');
  });

  it('affiche une erreur générique quand le back est en panne', () => {
    const { fixture, http } = openPage('12');

    http.expectOne('/api/notes/12').flush('Erreur', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Impossible de charger la note.');
    http.verify();
  });
});
