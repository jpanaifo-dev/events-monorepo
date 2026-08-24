import { Body, Controller, Post } from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service.js';

class LoginDto { @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; }
class ForgotDto { @IsEmail() email!: string; }
class ResetDto { @IsString() token!: string; @IsString() @MinLength(8) password!: string; }
class AdminCreateDto { @IsEmail() email!: string; @IsString() @MinLength(8) password!: string; @IsOptional() @IsString() firstName?: string; @IsOptional() @IsString() lastName?: string; @IsOptional() @IsString() role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER'; }

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto.email, dto.password); }
  @Post('forgot-password') forgot(@Body() dto: ForgotDto) { return this.auth.forgotPassword(dto.email); }
  @Post('reset-password') reset(@Body() dto: ResetDto) { return this.auth.resetPassword(dto.token, dto.password); }
  @Post('admin-create') adminCreate(@Body() dto: AdminCreateDto) { return this.auth.createAccount(dto); }
}
