import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      this.logger.log(`Starting registration for email: ${registerDto.email}`);
      
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      if (existingUser) {
        throw new UnauthorizedException('Email already registered');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Create the user with a new tenant
      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
          tenant: {
            create: {
              name: `${registerDto.email}'s Tenant`
            }
          }
        },
      });

      // Generate JWT token
      const payload = { email: user.email, sub: user.id };
      const access_token = this.jwtService.sign(payload);

      // Remove password from response
      const { password, ...result } = user;
      
      return {
        user: result,
        access_token
      };
    } catch (error) {
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async validateUser(email: string, password: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async login(user: any) {
    try {
      const payload = { email: user.email, sub: user.id };
      const access_token = this.jwtService.sign(payload);

      // For email/password login, the password is already set as master password
      return {
        user,
        access_token,
        hasMasterPassword: true // Always true for email/password login
      };
    } catch (error) {
      this.logger.error(`Login failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verifyLoginPassword(userId: number, password: string) {
    try {
      this.logger.log(`Verifying login password for user ${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { password: true }
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const isMatch = await bcrypt.compare(password, user.password);
      
      this.logger.log(`Login password verification result: ${isMatch}`);
      
      return {
        isMatch,
        message: isMatch ? 'Password matches' : 'Password does not match'
      };
    } catch (error) {
      this.logger.error(`Error verifying login password: ${error.message}`, error.stack);
      throw error;
    }
  }

  async googleLogin(req) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    try {
      // Check if user exists
      let user = await this.prisma.user.findUnique({
        where: { email: req.user.email },
      });

      if (!user) {
        // Create new user with Google data
        user = await this.prisma.user.create({
          data: {
            email: req.user.email,
            name: `${req.user.firstName} ${req.user.lastName}`,
            password: '', // No password for Google users initially
            tenant: {
              create: {
                name: `${req.user.email}'s Tenant`
              }
            }
          },
        });
      }

      // Check if master password exists
      const hasMasterPassword = !!user.password;

      // Generate JWT token
      const payload = { email: user.email, sub: user.id };
      const access_token = this.jwtService.sign(payload);

      // Remove password from response
      const { password, ...result } = user;
      
      return {
        user: result,
        access_token,
        hasMasterPassword
      };
    } catch (error) {
      this.logger.error(`Google login failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}