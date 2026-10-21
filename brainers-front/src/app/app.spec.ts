import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

describe('App', () => {
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    })
      .compileComponents();
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpTestingController.expectOne('/notes').flush([]);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the notes interface', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    httpTestingController.expectOne('/notes').flush([]);
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Mes notes');
  });

  it('selects a note and opens its edit form from the edit icon', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const note = { id: 1, title: 'Courses', content: 'Acheter du café' };
    httpTestingController.expectOne('/notes').flush([note]);
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.note-card-select') as HTMLButtonElement).click();
    httpTestingController.expectOne('/notes/1').flush(note);
    await fixture.whenStable();
    fixture.detectChanges();

    const detailCard = fixture.nativeElement.querySelector('.detail-card') as HTMLElement;
    const editButton = detailCard.querySelector(
      '[aria-label="Modifier cette note"]',
    ) as HTMLButtonElement;
    expect(editButton).toBeTruthy();
    expect(
      detailCard.querySelector('[aria-label="Supprimer cette note"]'),
    ).toBeTruthy();

    editButton.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.editingNoteId).toBe(note.id);
    expect(fixture.componentInstance.noteTitle).toBe(note.title);
    expect(fixture.componentInstance.noteContent).toBe(note.content);
    expect(
      (fixture.nativeElement.querySelector('#note-title') as HTMLInputElement).value,
    ).toBe(note.title);
    expect(
      (fixture.nativeElement.querySelector('#note-content') as HTMLTextAreaElement).value,
    ).toBe(note.content);
  });

  it('deletes the selected note from the delete icon', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const note = { id: 1, title: 'Courses', content: 'Acheter du café' };
    httpTestingController.expectOne('/notes').flush([note]);
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.note-card-select') as HTMLButtonElement).click();
    httpTestingController.expectOne('/notes/1').flush(note);
    await fixture.whenStable();
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector(
      '.detail-card [aria-label="Supprimer cette note"]',
    ) as HTMLButtonElement;
    deleteButton.click();
    httpTestingController.expectOne({ method: 'DELETE', url: '/notes/1' }).flush(null);
    httpTestingController.expectOne('/notes').flush([]);

    expect(fixture.componentInstance.selectedNote).toBeNull();
  });
});
