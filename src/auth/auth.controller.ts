import { Controller, Post, Body, UnauthorizedException, ValidationPipe, HttpException, HttpStatus, Logger, UseGuards, Request, Get, Res, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService
  ) {}

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    this.logger.log(`Registration request received for email: ${registerDto.email}`);
    try {
      const result = await this.authService.register(registerDto);
      this.logger.log(`Registration successful: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException) {
        throw new HttpException({
          status: HttpStatus.UNAUTHORIZED,
          error: error.message,
        }, HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Registration failed due to server error',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    try {
      const user = await this.authService.validateUser(loginDto.email, loginDto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const result = await this.authService.login(user);
      
      // For email/password login, we don't need to redirect to setup master password
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new HttpException({
          status: HttpStatus.UNAUTHORIZED,
          error: error.message,
        }, HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Login failed due to server error',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify-password')
  async verifyLoginPassword(@Request() req, @Body(ValidationPipe) verifyPasswordDto: VerifyPasswordDto) {
    try {
      return await this.authService.verifyLoginPassword(req.user.id, verifyPasswordDto.password);
    } catch (error) {
      throw new UnauthorizedException('Failed to verify password');
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // This endpoint initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Request() req, @Res() res) {
    try {
      const result = await this.authService.googleLogin(req);
      
      // Set JWT in HTTP-only cookie
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        path: '/',
        domain: undefined
      });

      // Redirect based on master password status
      if (result.hasMasterPassword) {
        res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
      } else {
        res.redirect(`${process.env.FRONTEND_URL}/setup-master-password`);
      }
    } catch (error) {
      this.logger.error(`Google auth redirect failed: ${error.message}`, error.stack);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
    }
  }

  @Post('setup-master-password')
  @UseGuards(JwtAuthGuard)
  async setupMasterPassword(@Request() req, @Body('password') password: string) {
    try {
      if (!password) {
        throw new BadRequestException('Password is required');
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      await this.prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword }
      });

      return { message: 'Master password set successfully' };
    } catch (error) {
      this.logger.error(`Master password setup failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('check-master-password')
  @UseGuards(JwtAuthGuard)
  async checkMasterPassword(@Request() req) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: req.user.id },
        select: { password: true }
      });

      return {
        hasMasterPassword: !!user?.password
      };
    } catch (error) {
      this.logger.error(`Error checking master password: ${error.message}`, error.stack);
      throw error;
    }
  }
} 