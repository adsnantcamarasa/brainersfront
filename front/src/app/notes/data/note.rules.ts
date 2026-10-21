/**
 * Règles de gestion des notes (README du projet).
 *
 * Elles sont centralisées ici pour qu'un seul endroit les définisse côté front.
 * Le back doit appliquer les MÊMES limites : la validation du front sert le confort
 * de l'utilisateur, celle du back est la source de vérité.
 */
export const NOTE_RULES = {
  /** RG1 : titre obligatoire, 100 caractères maximum, pas uniquement des espaces. */
  titleMaxLength: 100,
  /** RG2 : contenu obligatoire, 10 000 caractères maximum, pas uniquement des espaces. */
  contentMaxLength: 10_000,
} as const;
