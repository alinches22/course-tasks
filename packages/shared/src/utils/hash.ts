/**
 * Verify commit hash (client-side verification)
 * @param scenarioId - The revealed scenario ID
 * @param salt - The revealed salt
 * @param commitHash - The original commit hash
 * @returns boolean indicating if the hash matches
 */
export async function verifyCommitHash(
  scenarioId: string,
  salt: string,
  commitHash: string
): Promise<boolean> {
  const data = `${scenarioId}:${salt}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Use SubtleCrypto for SHA-256 (available in browser and Node.js)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return computedHash === commitHash;
}

/**
 * Generate commit hash (server-side)
 * @param scenarioId - The scenario ID
 * @param salt - Random salt
 * @returns The commit hash
 */
export async function generateCommitHash(scenarioId: string, salt: string): Promise<string> {
  const data = `${scenarioId}:${salt}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate random salt
 * @param length - Length of salt in bytes
 * @returns Hex string salt
 */
export function generateSalt(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
