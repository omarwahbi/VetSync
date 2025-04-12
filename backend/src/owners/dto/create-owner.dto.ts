import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, ValidateIf } from 'class-validator';

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

  @IsOptional()
  @IsBoolean()
  allowAutomatedReminders?: boolean;
}
