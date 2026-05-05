import { IsString, IsIn } from 'class-validator';

export class SetRoleDto {
  @IsString()
  @IsIn(['admin', 'enthusiast', 'mechanic', 'manufacturer', 'collector'])
  role: string;
}
