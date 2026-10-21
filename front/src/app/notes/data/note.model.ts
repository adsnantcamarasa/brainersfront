/**
 * LE CONTRAT AVEC LE BACK
 *
 * Ces types recopient exactement le JSON échangé avec Spring.
 * Si un nom change côté Java, il doit changer ici aussi : TypeScript te le signalera
 * partout où il est utilisé.
 */

/**
 * Une note telle que le back la renvoie.
 * Côté Java : le record NoteResponse (les noms viennent de ses composants).
 */
export interface Note {
  id: number;
  title: string;
  content: string;
  /** LocalDateTime sérialisé en texte ISO, ex. "2026-10-16T09:49:25.123456" */
  createdAt: string;
  /**
   * ⚠️ Nom imposé par le composant `lastUpdateAt` du record Java NoteResponse.
   * Si tu le renommes côté back (ex. `updatedAt`), renomme-le ici.
   */
  lastUpdateAt: string;
}

/**
 * Ce que le front envoie pour créer ou modifier une note.
 * Côté Java : NoteRequest. Le client n'envoie ni id ni dates (RG3).
 */
export interface NoteRequest {
  title: string;
  content: string;
}
