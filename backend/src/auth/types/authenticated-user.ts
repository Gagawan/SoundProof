import { Role } from '@prisma/client';

/** Utilisateur attaché à la requête après validation du JWT. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

/** Payload signé dans les tokens JWT. */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
