import { maxLength, pattern, required, schema } from '@angular/forms/signals';
import { NoteRequest } from './notes.service';

/** Validation rules shared by the create and edit note forms. */
export const noteSchema = schema<NoteRequest>((note) => {
  required(note.title);
  pattern(note.title, /\S/);
  maxLength(note.title, 200);
  required(note.content);
  pattern(note.content, /\S/);
});

export function toNoteRequest({ title, content }: NoteRequest): NoteRequest {
  return { title: title.trim(), content: content.trim() };
}
