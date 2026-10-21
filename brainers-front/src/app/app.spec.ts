import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { NoteDetailPage } from './note-detail';

describe('Notes routes', () => {
  let httpTestingController: HttpTestingController;
  let router: Router;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  async function openNotePage() {
    harness = await RouterTestingHarness.create('/notes/1');
    const note = { id: 1, title: 'Courses', content: 'Acheter du café' };
    httpTestingController.expectOne('/notes/1').flush(note);
    await harness.fixture.whenStable();
    harness.detectChanges();
    return { harness, note };
  }

  it('opens /notes/:id with the note and its update and delete actions', async () => {
    const { harness, note } = await openNotePage();
    const detail = harness.routeNativeElement?.querySelector('.note-detail-page') as HTMLElement;

    expect(router.url).toBe('/notes/1');
    expect(detail.querySelector('h2')?.textContent).toContain(note.title);
    expect(detail.querySelector('.detail-content')?.textContent).toContain(note.content);
    expect(detail.querySelector('[aria-label="Modifier cette note"]')?.textContent?.trim())
      .toBe('Modifier');
    expect(detail.querySelector('[aria-label="Supprimer cette note"]')?.textContent?.trim())
      .toBe('Supprimer');
  });

  it('prefills title and content in the edit form on the detail route', async () => {
    const { harness, note } = await openNotePage();
    const detail = harness.routeNativeElement?.querySelector('.note-detail-page') as HTMLElement;
    (detail.querySelector('[aria-label="Modifier cette note"]') as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect((harness.routeNativeElement?.querySelector('#edit-note-title') as HTMLInputElement).value)
      .toBe(note.title);
    expect(
      (harness.routeNativeElement?.querySelector('#edit-note-content') as HTMLTextAreaElement)
        .value,
    ).toBe(note.content);
  });

  it('updates the note from its detail page', async () => {
    const { harness } = await openNotePage();
    const detailPage = harness.routeDebugElement?.componentInstance as NoteDetailPage;
    detailPage.noteTitle = 'Courses modifiées';
    detailPage.noteContent = 'Acheter du thé';
    detailPage.saveNote();
    const updateRequest = httpTestingController.expectOne('/notes/1');
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual({
      title: 'Courses modifiées',
      content: 'Acheter du thé',
    });
    updateRequest.flush({ id: 1, title: 'Courses modifiées', content: 'Acheter du thé' });
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(harness.routeNativeElement?.querySelector('.detail-content')?.textContent)
      .toContain('Acheter du thé');
  });

  it('deletes the note from its detail page and returns to the list', async () => {
    const { harness } = await openNotePage();
    const detail = harness.routeNativeElement?.querySelector('.note-detail-page') as HTMLElement;
    (detail.querySelector('[aria-label="Supprimer cette note"]') as HTMLButtonElement).click();

    const deleteRequest = httpTestingController.expectOne('/notes/1');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush(null);
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(router.url).toBe('/');
    httpTestingController.expectOne('/notes').flush([]);
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('#notes-heading')).toBeTruthy();
  });
});
