import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min, validateSync } from 'class-validator';

enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt() @Min(1) @IsOptional()
  PORT: number = 3001;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  JWT_SECRET: string;

  @IsString() @IsOptional()
  JWT_EXPIRES_IN: string = '7d';

  // Firebase — optional at startup (FirebaseModule warns if missing)
  @IsString() @IsOptional() FIREBASE_PROJECT_ID: string;
  @IsString() @IsOptional() FIREBASE_CLIENT_EMAIL: string;
  @IsString() @IsOptional() FIREBASE_PRIVATE_KEY: string;

  // AWS S3 — optional (not used in MVP)
  @IsString() @IsOptional() AWS_REGION: string;
  @IsString() @IsOptional() AWS_ACCESS_KEY_ID: string;
  @IsString() @IsOptional() AWS_SECRET_ACCESS_KEY: string;
  @IsString() @IsOptional() AWS_S3_BUCKET: string;

  @IsInt() @Min(1) @IsOptional() THROTTLE_TTL: number = 60;
  @IsInt() @Min(1) @IsOptional() THROTTLE_LIMIT: number = 100;

  @IsString() @IsOptional() FRONTEND_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  return validated;
}
