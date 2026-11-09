/**
 * The equations of a model as sfcr writes them (Macalós, 2020, after Godley and Lavoie): `Y ~ C + G`, a lag as
 * `Bh[-1]`, a change as `d(Hh)`, `^` a power, `exp`, `log`, `abs`, `sqrt`, `min`, `max`, and the switch
 * `if (ER > 1) {1} else {0}`. `translate` turns the right-hand side into JavaScript over two arrays, `s` the period's
 * state and `l` the period before's, through `ref(name, lagged)`, which gives the source of a variable.
 */

/** The tokens, tried in this order: a number, a name, a symbol. */
const TOKENS = /** @type {Array<[string, RegExp]>} */ ([
  ["number", /\s*(\d*\.?\d+(?:e[+-]?\d+)?)/y],
  ["name", /\s*([A-Za-z_]\w*)/y],
  ["symbol", /\s*(\[-1\]|[<>=!]=|&&|\|\||[-+*/^(){}<>,!])/y],
]);
const FUNCTIONS = Object.freeze({ exp: "Math.exp", log: "Math.log", abs: "Math.abs", sqrt: "Math.sqrt", min: "Math.min", max: "Math.max" });
/** The binary operators, loosest first, and how JavaScript writes them. */
const LEVELS = [["||"], ["&&"], ["<", ">", "<=", ">=", "==", "!="], ["+", "-"], ["*", "/"]];
const SPELLED = Object.freeze({ "==": "===", "!=": "!==" });

/** The tokens of `text`, each `{ kind, text }`. */
export function tokenize(text) {
  const tokens = [];
  let at = 0;
  while (text.slice(at).trim() !== "") {
    const [kind, pattern] = TOKENS.find(([, candidate]) => {
      candidate.lastIndex = at;
      return candidate.test(text);
    }) ?? [];
    if (!kind) throw new Error(`equations: cannot read "${text.slice(at).trim()}" in "${text}"`);
    pattern.lastIndex = at;
    tokens.push({ kind, text: pattern.exec(text)[1] });
    at = pattern.lastIndex;
  }
  return tokens;
}

/** A reader of `tokens`: where it is, and the checks of what comes next. */
function cursor(tokens, text) {
  let at = 0;
  const peek = () => tokens[at];
  const is = (symbol) => peek()?.kind === "symbol" && peek().text === symbol;
  const next = () => {
    if (at >= tokens.length) throw new Error(`equations: "${text}" ends too soon`);
    at += 1;
    return tokens[at - 1];
  };
  const expect = (symbol) => {
    const token = next();
    if (token.text !== symbol) throw new Error(`equations: "${symbol}" expected, "${token.text}" found in "${text}"`);
  };
  return { peek, is, next, expect, done: () => at >= tokens.length };
}

/*
 * The parser of one right-hand side, a function a level of precedence, each taking `p`, `{ read, ref }`, and giving
 * the JavaScript source of what it read.
 */

const expression = (p) => binary(p, 0);

function binary(p, level) {
  if (level === LEVELS.length) return unary(p);
  let left = binary(p, level + 1);
  while (p.read.peek()?.kind === "symbol" && LEVELS[level].includes(p.read.peek().text)) {
    const operator = p.read.next().text;
    left = `(${left} ${SPELLED[operator] ?? operator} ${binary(p, level + 1)})`;
  }
  return left;
}

/** R's power binds tighter than its minus (-2^2 is -4) and takes a signed exponent (2^-1). */
function unary(p) {
  return ["-", "+", "!"].some(p.read.is) ? `(${p.read.next().text}${unary(p)})` : power(p);
}

function power(p) {
  const base = primary(p);
  if (!p.read.is("^")) return base;
  p.read.next();
  return `Math.pow(${base}, ${unary(p)})`;
}

function primary(p) {
  const token = p.read.next();
  if (token.kind === "number") return token.text;
  if (token.text === "(") return closed(p, ")");
  if (token.kind !== "name") throw new Error(`equations: unexpected "${token.text}"`);
  if (token.text === "if") return choice(p);
  if (p.read.is("(")) return call(p, token.text);
  if (!p.read.is("[-1]")) return p.ref(token.text, false);
  p.read.next();
  return p.ref(token.text, true);
}

/** An expression, then `end`, in parentheses. */
function closed(p, end) {
  const source = expression(p);
  p.read.expect(end);
  return `(${source})`;
}

/** `if (condition) {yes} else {no}`, the `if` read. */
function choice(p) {
  p.read.expect("(");
  const condition = closed(p, ")");
  p.read.expect("{");
  const yes = closed(p, "}");
  p.read.expect("else");
  p.read.expect("{");
  return `(${condition} ? ${yes} : ${closed(p, "}")})`;
}

/** A function's call, its name read: `d(X)`, X's change, or one of FUNCTIONS. */
function call(p, name) {
  p.read.expect("(");
  if (name === "d") {
    const variable = p.read.next().text;
    p.read.expect(")");
    return `(${p.ref(variable, false)} - ${p.ref(variable, true)})`;
  }
  if (!FUNCTIONS[name]) throw new Error(`equations: unknown function ${name}`);
  const args = [expression(p)];
  while (p.read.is(",")) {
    p.read.next();
    args.push(expression(p));
  }
  p.read.expect(")");
  return `${FUNCTIONS[name]}(${args.join(", ")})`;
}

/**
 * The JavaScript source of `text`, a right-hand side, each variable written by `ref(name, lagged)`.
 *
 * @param {string} text
 * @param {(name: string, lagged: boolean) => string} ref
 * @returns {string}
 */
export function translate(text, ref) {
  const read = cursor(tokenize(text), text);
  const source = expression({ read, ref });
  if (!read.done()) throw new Error(`equations: "${read.peek().text}" left over in "${text}"`);
  return source;
}

/**
 * The equations of `text`, one a line, `name ~ expression` (or `=`); `#` starts a comment, a comma may end a line.
 *
 * @param {string} text
 * @returns {Array<{ name: string, expression: string }>}
 */
export function parseEquations(text) {
  return text.split("\n")
    .map((line) => line.replace(/#.*/, "").trim().replace(/,$/, ""))
    .filter((line) => line !== "")
    .map((line) => {
      const sign = line.search(/[~=]/);
      const name = line.slice(0, Math.max(sign, 0)).trim();
      if (sign < 0 || !/^[A-Za-z_]\w*$/.test(name)) throw new Error(`equations: "${line}" is not "name ~ expression"`);
      return { name, expression: line.slice(sign + 1).trim() };
    });
}

/**
 * A function of `args` whose body is `body`: the models' equations and matrices, compiled once from the module's own
 * text (never from what a user types), so that a period runs at the speed of written code.
 *
 * @param {string[]} args
 * @param {string} body
 * @returns {Function}
 */
export function compile(args, body) {
  // eslint-disable-next-line sonarjs/code-eval -- the source is the models' own equations, see above.
  return new Function(...args, body);
}
