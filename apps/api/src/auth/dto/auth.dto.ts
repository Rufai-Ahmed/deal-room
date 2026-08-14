import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'ada@meridian.example' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'correct-horse-battery' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ maxLength: 120, example: 'Ada Whitfield' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'founder@dealroom.demo' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'deal-room-demo' })
  @IsString()
  @MinLength(1)
  password!: string;
}
