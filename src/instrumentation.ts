import { validateEnvironment } from '@/lib/env';

export async function register(): Promise<void> {
  validateEnvironment();
}

