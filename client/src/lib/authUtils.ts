// © 2025 Quartermasters FZC. All rights reserved.

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}