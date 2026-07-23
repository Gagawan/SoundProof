import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../types/authenticated-user';

/** Contrôle d'accès par rôle, appliqué globalement après le guard JWT. */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const allowed = user !== undefined && requiredRoles.includes(user.role);
    if (!allowed) {
      // A09 — journalisation des refus d'accès, sans donnée sensible
      this.logger.warn(`Accès refusé (rôle insuffisant) — utilisateur ${user?.id ?? 'inconnu'}`);
    }
    return allowed;
  }
}
