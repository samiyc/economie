/**
 * Newton's method on a cyclic block, for the models whose cycles Gauss-Seidel does not settle (OPEN FLEX, Godley and
 * Lavoie's ch. 12: sfcr solves it by Broyden, its vignette saying the written order does not converge). The block's
 * equations are read as `x = e(x)`, `e` their right-hand sides evaluated together from the period's state; Newton
 * solves `F(x) = e(x) − x = 0`, the Jacobian by forward differences, the linear system by Gaussian elimination with
 * partial pivoting. It stops when no equation's two sides differ by more than `tolerance` relative to 1 + the value,
 * as Gauss-Seidel does. Its buffers are made once: a step allocates nothing.
 */

/** The relative step of a forward difference: about the square root of the double's precision. */
const STEP = 1e-7;

/**
 * A solver of the block `members` (indices in the state), `evaluate(s, l, out)` writing their right-hand sides into
 * `out` from the state `s` and the period before `l`. Returns `(s, l) => settled`, the block solved in `s`.
 *
 * @param {{ members: number[], evaluate: (s: Float64Array, l: Float64Array, out: Float64Array) => void, tolerance: number, iterations: number }} block
 */
export function createNewton({ members, evaluate, tolerance, iterations }) {
  const n = members.length;
  const f = new Float64Array(n);
  const g = new Float64Array(n);
  const jacobian = new Float64Array(n * n);
  const delta = new Float64Array(n);
  /** F at `s` into `out`, and its largest relative size. */
  const residual = (s, l, out) => {
    evaluate(s, l, out);
    let worst = 0;
    for (let i = 0; i < n; i += 1) {
      out[i] -= s[members[i]];
      worst = Math.max(worst, Math.abs(out[i]) / (1 + Math.abs(s[members[i]])));
    }
    return worst;
  };
  const differentiate = (s, l) => {
    for (let j = 0; j < n; j += 1) {
      const x = s[members[j]];
      const h = STEP * (1 + Math.abs(x));
      s[members[j]] = x + h;
      residual(s, l, g);
      s[members[j]] = x;
      for (let i = 0; i < n; i += 1) jacobian[i * n + j] = (g[i] - f[i]) / h;
    }
  };
  return (s, l) => {
    for (let k = 0; k < iterations; k += 1) {
      if (residual(s, l, f) <= tolerance) return true;
      differentiate(s, l);
      for (let i = 0; i < n; i += 1) delta[i] = -f[i];
      eliminate(jacobian, delta, n);
      for (let i = 0; i < n; i += 1) s[members[i]] += delta[i];
    }
    return false;
  };
}

/** Solves `a · x = b` in place (`a` row-major, n × n, overwritten; `b` becomes `x`), with partial pivoting. */
export function eliminate(a, b, n) {
  for (let c = 0; c < n; c += 1) {
    pivot(a, b, n, c);
    clearBelow(a, b, n, c);
  }
  for (let r = n - 1; r >= 0; r -= 1) {
    let sum = b[r];
    for (let k = r + 1; k < n; k += 1) sum -= a[r * n + k] * b[k];
    b[r] = sum / a[r * n + r];
  }
}

/** Brings up to row `c` the row, from `c` down, of the largest entry in column `c`. */
function pivot(a, b, n, c) {
  let p = c;
  for (let r = c + 1; r < n; r += 1) if (Math.abs(a[r * n + c]) > Math.abs(a[p * n + c])) p = r;
  if (p === c) return;
  for (let k = 0; k < n; k += 1) {
    const t = a[c * n + k];
    a[c * n + k] = a[p * n + k];
    a[p * n + k] = t;
  }
  const t = b[c];
  b[c] = b[p];
  b[p] = t;
}

/** Subtracts row `c` from the rows below it, so that column `c` is zero under the diagonal. */
function clearBelow(a, b, n, c) {
  const d = a[c * n + c];
  for (let r = c + 1; r < n; r += 1) {
    const factor = a[r * n + c] / d;
    if (factor === 0) continue;
    for (let k = c; k < n; k += 1) a[r * n + k] -= factor * a[c * n + k];
    b[r] -= factor * b[c];
  }
}
