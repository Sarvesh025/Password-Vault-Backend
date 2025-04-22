import { Controller, Get, Post, Put, Body, HttpException, HttpStatus, UseGuards, Request, Param, Delete } from '@nestjs/common';
import { PasswordsService } from './passwords.service';
import { CreatePasswordDto } from './dto/create-password.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MasterPasswordGuard } from '../auth/guards/master-password.guard';

@Controller('passwords')
@UseGuards(JwtAuthGuard, MasterPasswordGuard)
export class PasswordsController {
    constructor(private readonly passwordsService: PasswordsService) {}

    @Post()
    async createPassword(@Request() req, @Body() createPasswordDto: CreatePasswordDto) {
        try {
            return await this.passwordsService.createPassword(req.user.id, createPasswordDto);
        } catch (error) {
            throw new HttpException(
                'Failed to create password',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get()
    async getPasswords(@Request() req) {
        try {
            return await this.passwordsService.getPasswords(req.user.id);
        } catch (error) {
            throw new HttpException(
                'Failed to fetch passwords',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put(':id')
    async updatePassword(
        @Request() req,
        @Param('id') passwordId: string,
        @Body() updatePasswordDto: UpdatePasswordDto
    ) {
        try {
            return await this.passwordsService.updatePassword(
                req.user.id,
                req.user.tenantId,
                parseInt(passwordId),
                updatePasswordDto
            );
        } catch (error) {
            throw new HttpException(
                'Failed to update password',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':id/history')
    async getPasswordHistory(@Request() req, @Param('id') passwordId: string) {
        try {
            return await this.passwordsService.getPasswordHistory(
                parseInt(passwordId),
                req.user.id,
                req.user.tenantId
            );
        } catch (error) {
            throw new HttpException(
                'Failed to fetch password history',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post(':id/verify')
    async verifyPassword(
        @Request() req,
        @Param('id') passwordId: string,
        @Body() verifyPasswordDto: VerifyPasswordDto
    ) {
        try {
            return await this.passwordsService.verifyPassword(
                parseInt(passwordId),
                req.user.id,
                req.user.tenantId,
                verifyPasswordDto.password
            );
        } catch (error) {
            throw new HttpException(
                'Failed to verify password',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Delete(':id')
    async deletePassword(@Request() req, @Param('id') passwordId: string) {
        try {
            return await this.passwordsService.deletePassword(
                parseInt(passwordId),
                req.user.id,
                req.user.tenantId
            );
        } catch (error) {
            throw new HttpException(
                'Failed to delete password',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
