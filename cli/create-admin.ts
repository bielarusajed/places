import { randomBytes, scrypt } from 'node:crypto';
import readline from 'node:readline';

import { createId } from '@paralleldrive/cuid2';

import db, { account, user } from '@/db';

export type Options = {
  name: string;
  email: string;
  password?: string;
};

const SCRYPT_CONFIG = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

// https://github.com/better-auth/better-auth/blob/canary/packages/better-auth/src/crypto/password.ts
function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  // Normalize password as better-auth does
  const normalizedPassword = password.normalize('NFKC');

  return new Promise((resolve, reject) => {
    scrypt(
      normalizedPassword,
      salt,
      SCRYPT_CONFIG.dkLen,
      {
        N: SCRYPT_CONFIG.N,
        r: SCRYPT_CONFIG.r,
        p: SCRYPT_CONFIG.p,
        maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2,
      },
      (err, derivedKey) => {
        if (err) reject(err);
        else resolve(`${salt}:${derivedKey.toString('hex')}`);
      },
    );
  });
}

function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    if (process.stdin.isTTY) process.stdin.setRawMode?.(true); // Disable echo
    process.stderr.write(prompt);

    let password = '';
    const onData = (char: Buffer) => {
      const c = char.toString();
      if (c === '\n' || c === '\r') {
        process.stdin.removeListener('data', onData);
        if (process.stdin.isTTY) process.stdin.setRawMode?.(false);
        process.stderr.write('\n');
        rl.close();
        return resolve(password);
      }
      if (c === '\u0003') return process.exit(1); // Ctrl+C
      if (c === '\u007F' || c === '\b') return (password = password.slice(0, -1)); // Backspace
      password += c;
    };

    process.stdin.on('data', onData);
    process.stdin.resume();
  });
}

export async function createAdmin(options: Options): Promise<void> {
  const password = await (async () => {
    if (options.password) return options.password;
    const password = await promptPassword('Enter password: ');
    if (!password) throw new Error('Password is required');
    const confirmPassword = await promptPassword('Confirm password: ');
    if (password !== confirmPassword) throw new Error('Passwords do not match');
    return password;
  })();

  const existing = await db.query.user.findFirst({ where: { email: options.email } });
  if (existing) throw new Error(`User with email ${options.email} already exists`);

  const userId = createId();
  const hashedPassword = await hashPassword(password);

  await db.insert(user).values({
    id: userId,
    email: options.email,
    name: options.name || 'Admin',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const accountId = createId();
  await db.insert(account).values({
    id: accountId,
    userId,
    accountId: options.email,
    providerId: 'credential',
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  process.stdout.write(`Admin user created: ${options.email}\n`);
}
