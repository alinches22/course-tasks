import { createHash, randomBytes } from 'crypto';

/**
 * Generate a random nonce for wallet signature
 */
export function generateNonce(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate a random salt for commit-reveal
 */
export function generateSalt(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate commit hash for provably fair scenario selection
 * @param scenarioId - The selected scenario ID
 * @param salt - Random salt
 * @returns SHA256 hash of scenarioId:salt
 */
export function generateCommitHash(scenarioId: string, salt: string): string {
  const data = `${scenarioId}:${salt}`;
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Verify commit hash
 * @param scenarioId - The revealed scenario ID
 * @param salt - The revealed salt
 * @param commitHash - The original commit hash
 * @returns boolean indicating if the hash matches
 */
export function verifyCommitHash(scenarioId: string, salt: string, commitHash: string): boolean {
  const computed = generateCommitHash(scenarioId, salt);
  return computed === commitHash;
}
