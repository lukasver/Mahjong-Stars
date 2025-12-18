import { registerOTel } from '@vercel/otel';
import pkg from './package.json';

export function register() {
  registerOTel({ serviceName: pkg.name });
}
