import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Refuse une valeur composée uniquement d'espaces (RG1 et RG2).
 *
 * Pourquoi un validateur maison ? `Validators.required` accepte "   " :
 * pour lui, une chaîne de 3 espaces n'est pas vide.
 *
 * - ""        → null : c'est le travail de Validators.required
 * - "   "     → { blank: true }
 * - " Java "  → null : il y a du texte
 *
 * Un validateur est une simple fonction : il reçoit le contrôle et renvoie
 * `null` si tout va bien, ou un objet d'erreurs sinon.
 */
export const notBlankValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value: unknown = control.value;

  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  return value.trim().length === 0 ? { blank: true } : null;
};
