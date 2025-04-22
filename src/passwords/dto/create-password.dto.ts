import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class CreatePasswordDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['device', 'application'])
  category: string;

  @IsString()
  @IsNotEmpty()
  name: string;

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