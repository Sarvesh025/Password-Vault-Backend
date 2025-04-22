import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsNotEmpty()
  password: string;
} 