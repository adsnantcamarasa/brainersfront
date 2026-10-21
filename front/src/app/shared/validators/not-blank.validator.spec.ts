import { FormControl } from '@angular/forms';

import { notBlankValidator } from './not-blank.validator';

/** Un validateur est une fonction pure : on le teste sans Angular autour. */
describe('notBlankValidator', () => {
  const validate = (value: unknown) => notBlankValidator(new FormControl(value));

  it('refuse une chaîne composée uniquement d’espaces', () => {
    expect(validate('   ')).toEqual({ blank: true });
  });

  it('refuse aussi les tabulations et retours à la ligne seuls', () => {
    expect(validate('\t\n ')).toEqual({ blank: true });
  });

  it('accepte un texte entouré d’espaces', () => {
    expect(validate('  Java  ')).toBeNull();
  });

  it('laisse la chaîne vide à Validators.required', () => {
    expect(validate('')).toBeNull();
  });

  it('ignore les valeurs qui ne sont pas des chaînes', () => {
    expect(validate(null)).toBeNull();
  });
});
