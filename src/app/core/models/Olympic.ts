import { Participation } from './Participation';

/**
 * Représente un pays dans le fichier olympique avec la liste de ses participations.
 */
export interface Olympic {
  id: number;
  country: string;
  participations: Participation[];
}
