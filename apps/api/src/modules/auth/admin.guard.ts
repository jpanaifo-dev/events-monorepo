import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Se requiere autenticación de administrador');
    try {
      const payload = await this.jwt.verifyAsync<{ role?: string }>(token, { secret: process.env.JWT_ACCESS_SECRET });
      if (!['SUPER_ADMIN', 'SAAS_ADMIN'].includes(payload.role ?? '')) throw new UnauthorizedException('Se requiere un administrador global');
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Sesión inválida o expirada');
    }
  }
}
