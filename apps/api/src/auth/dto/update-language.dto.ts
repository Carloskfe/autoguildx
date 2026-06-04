import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLanguageDto {
  @ApiProperty({ enum: ['en', 'es'] })
  @IsIn(['en', 'es'], { message: 'uiLanguage must be en or es' })
  uiLanguage: 'en' | 'es';
}
