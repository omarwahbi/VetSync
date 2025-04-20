import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, ValidateIf, MaxLength } from 'class-validator';

export class CreateOwnerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @ValidateIf((o) => o.email !== undefined && o.email !== '')
  @IsEmail({}, { message: 'If provided, email must be valid' })
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsBoolean()
  allowAutomatedReminders?: boolean;
}
