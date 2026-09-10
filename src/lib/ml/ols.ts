/** Tiny OLS solver (Gaussian elimination). No sklearn at request time. */

export function fitOls(X: number[][], y: number[]): number[] {
  const n = X.length;
  const k = X[0]!.length;
  const xtx: number[][] = Array.from({ length: k }, () => Array(k).fill(0));
  const xty: number[] = Array(k).fill(0);

  for (let i = 0; i < n; i++) {
    const row = X[i]!;
    const yi = y[i]!;
    for (let a = 0; a < k; a++) {
      xty[a]! += row[a]! * yi;
      for (let b = 0; b < k; b++) xtx[a]![b]! += row[a]! * row[b]!;
    }
  }

  // Ridge for stability
  for (let a = 0; a < k; a++) xtx[a]![a]! += 1e-3;

  return solve(xtx, xty);
}

function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r]![i]!) > Math.abs(M[max]![i]!)) max = r;
    [M[i], M[max]] = [M[max]!, M[i]!];
    const pivot = M[i]![i]!;
    if (Math.abs(pivot) < 1e-12) continue;
    for (let c = i; c <= n; c++) M[i]![c]! /= pivot;
    for (let r = 0; r < n; r++) {
      if (r === i) continue;
      const f = M[r]![i]!;
      for (let c = i; c <= n; c++) M[r]![c]! -= f * M[i]![c]!;
    }
  }
  return M.map((row) => row[n]!);
}

export function predictRow(beta: number[], x: number[]) {
  return beta.reduce((s, b, i) => s + b * (x[i] ?? 0), 0);
}

export function residualStd(X: number[][], y: number[], beta: number[]) {
  const n = y.length;
  let ss = 0;
  for (let i = 0; i < n; i++) {
    const e = y[i]! - predictRow(beta, X[i]!);
    ss += e * e;
  }
  return Math.sqrt(ss / Math.max(1, n - beta.length));
}
