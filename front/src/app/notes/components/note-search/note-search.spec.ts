import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Note } from '../../data/note.model';
import { NoteSearch, SEARCH_DEBOUNCE_MS, SEARCH_MAX_RESULTS } from './note-search';

/** Fabrique n notes de test. */
const makeNotes = (count: number): Note[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Note java ${i + 1}`,
    content: 'Contenu',
    createdAt: '2026-10-16T09:49:25',
    lastUpDateTime: '2026-10-16T09:49:25',
  }));

/**
 * On teste le composant comme un utilisateur : on tape dans le champ,
 * et on regarde les requêtes envoyées et ce qui s'affiche.
 *
 * vi.useFakeTimers() remplace l'horloge : on avance le temps à la main
 * (advanceTimersByTime) au lieu d'attendre vraiment 300 ms.
 */
describe('NoteSearch', () => {
  let fixture: ComponentFixture<NoteSearch>;
  let http: HttpTestingController;
  let input: HTMLInputElement;
  let page: HTMLElement;

  const type = (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [NoteSearch],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(NoteSearch);
    fixture.detectChanges();
    page = fixture.nativeElement;
    input = page.querySelector('input')!;
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  it('attend la fin de la frappe et n’envoie qu’une seule requête', () => {
    type('j');
    type('ja');
    type('java');

    // Avant la fin du délai : aucune requête.
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    http.expectNone(() => true);

    // Délai écoulé : une seule requête, pour la dernière valeur.
    vi.advanceTimersByTime(1);
    const req = http.expectOne((r) => r.url === '/api/notes');
    expect(req.request.params.get('title')).toBe('java');
    req.flush(makeNotes(2));
  });

  it(`affiche au maximum ${SEARCH_MAX_RESULTS} résultats`, () => {
    type('java');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    http.expectOne((r) => r.url === '/api/notes').flush(makeNotes(15));
    fixture.detectChanges();

    expect(page.querySelectorAll('app-note-list li').length).toBe(SEARCH_MAX_RESULTS);
    expect(page.textContent).toContain(`${SEARCH_MAX_RESULTS} premiers résultats sur 15`);
  });

  it('affiche "Aucune note trouvée." quand rien ne correspond', () => {
    type('zzz');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    http.expectOne((r) => r.url === '/api/notes').flush([]);
    fixture.detectChanges();

    expect(page.textContent).toContain('Aucune note trouvée.');
  });

  it('n’appelle pas le back pour une recherche vide ou faite d’espaces', () => {
    type('   ');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    http.expectNone(() => true);
  });

  it('affiche une erreur si le back ne répond pas, et continue de fonctionner ensuite', () => {
    type('java');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    http
      .expectOne((r) => r.url === '/api/notes')
      .flush('Erreur', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(page.textContent).toContain('La recherche a échoué.');

    // La recherche suivante fonctionne toujours (l'erreur n'a pas cassé le flux).
    type('spring');
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    http.expectOne((r) => r.url === '/api/notes').flush(makeNotes(1));
    fixture.detectChanges();
    expect(page.querySelectorAll('app-note-list li').length).toBe(1);
  });
});
