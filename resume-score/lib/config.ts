function readPositiveInt(value: string | undefined, fallback: number): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 1) {
    return fallback;
  }
  return Math.floor(numeric);
}

/** Max PDF resumes per screening. Override with NEXT_PUBLIC_MAX_RESUMES. */
export const MAX_RESUMES = readPositiveInt(
  process.env.NEXT_PUBLIC_MAX_RESUMES,
  10,
);
