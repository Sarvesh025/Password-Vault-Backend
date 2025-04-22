import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePasswordDto } from './dto/create-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';

@Injectable()
export class PasswordsService {
  private readonly logger = new Logger(PasswordsService.name);

  constructor(private prisma: PrismaService) {}

  async getPasswords(userId: number) {
    try {
      this.logger.log(`Fetching passwords for user ${userId}`);
      const passwords = await this.prisma.password.findMany({
        where: {
          userId: userId
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });
      this.logger.log(`Found ${passwords.length} passwords for user ${userId}`);
      return passwords;
    } catch (error) {
      this.logger.error(`Error fetching passwords: ${error.message}`, error.stack);
      throw error;
    }
  }

  async createPassword(userId: number, createPasswordDto: CreatePasswordDto) {
    try {
      this.logger.log(`Creating/updating password for user ${userId}`);
      
      // Get user to get tenantId
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true }
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!user.tenantId) {
        this.logger.error(`User ${userId} has no tenantId assigned`);
        throw new BadRequestException('User has no tenant assigned');
      }

      // Check if password with same details exists
      const existingPassword = await this.prisma.password.findFirst({
        where: {
          userId,
          tenantId: user.tenantId,
          category: createPasswordDto.category,
          name: createPasswordDto.name,
          url: createPasswordDto.url,
          accountName: createPasswordDto.accountName,
        },
      });

      if (existingPassword) {
        // Update existing password and save history
        return await this.prisma.$transaction(async (prisma) => {
          // Save old password to history
          await prisma.passwordHistory.create({
            data: {
              value: existingPassword.password,
              passwordId: existingPassword.id,
            },
          });

          // Update the password
          const updatedPassword = await prisma.password.update({
            where: { id: existingPassword.id },
            data: {
              password: createPasswordDto.password,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                },
              },
            },
          });

          this.logger.log(`Password updated successfully with ID: ${updatedPassword.id}`);
          return updatedPassword;
        });
      }

      // Create new password if no existing one found
      const password = await this.prisma.password.create({
        data: {
          ...createPasswordDto,
          userId,
          tenantId: user.tenantId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      });

      this.logger.log(`New password created successfully with ID: ${password.id}`);
      return password;
    } catch (error) {
      this.logger.error(`Error creating/updating password: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updatePassword(
    userId: number,
    tenantId: number,
    passwordId: number,
    updatePasswordDto: UpdatePasswordDto
  ) {
    try {
      this.logger.log(`Updating password ${passwordId} for user ${userId}`);

      // Get the current password
      const currentPassword = await this.prisma.password.findFirst({
        where: {
          id: passwordId,
          userId,
          tenantId,
        },
      });

      if (!currentPassword) {
        throw new BadRequestException('Password not found');
      }

      // Start a transaction to update password and create history
      const result = await this.prisma.$transaction(async (prisma) => {
        // Create history entry for the old password
        await prisma.passwordHistory.create({
          data: {
            value: currentPassword.password,
            passwordId: currentPassword.id,
          },
        });

        // Update the password
        const updatedPassword = await prisma.password.update({
          where: { id: passwordId },
          data: {
            ...updatePasswordDto,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });

        return updatedPassword;
      });

      this.logger.log(`Password ${passwordId} updated successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Error updating password: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPasswordHistory(passwordId: number, userId: number, tenantId: number) {
    try {
      this.logger.log(`Fetching history for password ${passwordId}`);

      // Verify password belongs to user and tenant
      const password = await this.prisma.password.findFirst({
        where: {
          id: passwordId,
          userId,
          tenantId,
        },
      });

      if (!password) {
        throw new BadRequestException('Password not found');
      }

      // Get password history
      const history = await this.prisma.passwordHistory.findMany({
        where: {
          passwordId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.log(`Found ${history.length} history entries`);
      return history;
    } catch (error) {
      this.logger.error(`Error fetching password history: ${error.message}`, error.stack);
      throw error;
    }
  }

  async verifyPassword(passwordId: number, userId: number, tenantId: number, loginPassword: string) {
    try {
      this.logger.log(`Verifying password ${passwordId} for user ${userId}`);

      // Get the password entry
      const passwordEntry = await this.prisma.password.findFirst({
        where: {
          id: passwordId,
          userId,
          tenantId,
        },
      });

      if (!passwordEntry) {
        throw new BadRequestException('Password not found');
      }

      // Compare the passwords
      const isMatch = loginPassword === passwordEntry.password;
      
      this.logger.log(`Password verification result: ${isMatch}`);
      
      return {
        isMatch,
        message: isMatch ? 'Password matches' : 'Password does not match'
      };
    } catch (error) {
      this.logger.error(`Error verifying password: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deletePassword(passwordId: number, userId: number, tenantId: number) {
    try {
      this.logger.log(`Deleting password ${passwordId} for user ${userId}`);

      // Verify password belongs to user and tenant
      const password = await this.prisma.password.findFirst({
        where: {
          id: passwordId,
          userId,
          tenantId,
        },
      });

      if (!password) {
        throw new BadRequestException('Password not found');
      }

      // Delete password and its history in a transaction
      await this.prisma.$transaction(async (prisma) => {
        // First delete the history
        await prisma.passwordHistory.deleteMany({
          where: { passwordId },
        });

        // Then delete the password
        await prisma.password.delete({
          where: { id: passwordId },
        });
      });

      this.logger.log(`Password ${passwordId} and its history deleted successfully`);
      return { message: 'Password and its history deleted successfully' };
    } catch (error) {
      this.logger.error(`Error deleting password: ${error.message}`, error.stack);
      throw error;
    }
  }
} 