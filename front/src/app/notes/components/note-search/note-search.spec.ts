import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Note } from '../../data/note.model';
import { NoteSearch, SEARCH_MAX_RESULTS } from './note-search';

/** Fabrique n notes de test. */
const makeNotes = (count: number): Note[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Note java ${i + 1}`,
    content: 'Contenu',
    createdAt: '2026-10-16T09:49:25',
    lastUpdateAt: '2026-10-16T09:49:25',
  }));

/**
 * On teste le composant comme un utilisateur : on tape dans le champ,
 * on clique sur "Rechercher", et on regarde les requêtes envoyées et ce qui s'affiche.
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

  /** Clic sur "Rechercher" : le bouton submit déclenche l'envoi du formulaire. */
  const clickSearch = () => {
    page.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    fixture.detectChanges();
  };

  beforeEach(() => {
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

  afterEach(() => http.verify());

  it('ne cherche rien tant qu’on n’a pas cliqué sur "Rechercher"', () => {
    type('java');
    http.expectNone(() => true);
  });

  it('envoie le texte nettoyé au clic sur "Rechercher"', () => {
    type('  java  ');
    clickSearch();

    const req = http.expectOne((r) => r.url === '/api/notes');
    expect(req.request.params.get('title')).toBe('java');
    req.flush(makeNotes(2));
    fixture.detectChanges();

    expect(page.querySelectorAll('app-note-list li').length).toBe(2);
  });

  it('demande toutes les notes quand le champ est vide', () => {
    type('   ');
    clickSearch();

    const req = http.expectOne((r) => r.url === '/api/notes');
    expect(req.request.params.has('title')).toBe(false);
    req.flush(makeNotes(3));
  });

  it(`affiche au maximum ${SEARCH_MAX_RESULTS} résultats`, () => {
    type('java');
    clickSearch();
    http.expectOne((r) => r.url === '/api/notes').flush(makeNotes(15));
    fixture.detectChanges();

    expect(page.querySelectorAll('app-note-list li').length).toBe(SEARCH_MAX_RESULTS);
    expect(page.textContent).toContain(`${SEARCH_MAX_RESULTS} premiers résultats sur 15`);
  });

  it('affiche "Aucune note trouvée." quand rien ne correspond', () => {
    type('zzz');
    clickSearch();
    http.expectOne((r) => r.url === '/api/notes').flush([]);
    fixture.detectChanges();

    expect(page.textContent).toContain('Aucune note trouvée.');
  });

  it('affiche une erreur si le back ne répond pas, et continue de fonctionner ensuite', () => {
    type('java');
    clickSearch();
    http
      .expectOne((r) => r.url === '/api/notes')
      .flush('Erreur', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(page.textContent).toContain('La recherche a échoué.');

    // La recherche suivante fonctionne toujours (l'erreur n'a pas cassé le flux).
    type('spring');
    clickSearch();
    http.expectOne((r) => r.url === '/api/notes').flush(makeNotes(1));
    fixture.detectChanges();
    expect(page.querySelectorAll('app-note-list li').length).toBe(1);
  });

  it('annule la recherche précédente si on relance avant la réponse', () => {
    type('ja');
    clickSearch();
    type('java');
    clickSearch();

    // switchMap a annulé la première requête : seule la seconde attend une réponse.
    const [first, second] = http.match((r) => r.url === '/api/notes');
    expect(first.cancelled).toBe(true);
    expect(second.request.params.get('title')).toBe('java');
    second.flush(makeNotes(1));
  });
});
