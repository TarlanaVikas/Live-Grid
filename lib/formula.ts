/**
 * Minimal formula parser supporting:
 * - =SUM(A1:A10) range syntax
 * - =SUM(A1,B2,C3) list syntax
 * - Basic arithmetic: =A1+B2, =A1-B2, =A1*B2, =A1/B2
 *
 * Justification: Beyond SUM and arithmetic, complexity grows (nested functions,
 * INDIRECT, etc.). This scope covers the spec while keeping the parser ~100 lines.
 */

export function isFormula(value: string): boolean {
  return typeof value === "string" && value.trim().startsWith("=");
}

export function parseCellRef(ref: string): { col: number; row: number } | null {
  const m = ref.match(/^([A-Z]+)(\d+)$/i);
  if (!m) return null;
  const col = m[1]
    .toUpperCase()
    .split("")
    .reduce((a, c) => a * 26 + (c.charCodeAt(0) - 64), 0) - 1;
  const row = parseInt(m[2], 10) - 1;
  return { col, row };
}

export function colToLetter(col: number): string {
  let s = "";
  col++;
  while (col > 0) {
    const r = (col - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    col = Math.floor((col - 1) / 26);
  }
  return s;
}

export function expandRange(range: string): string[] {
  const [start, end] = range.split(":").map((s) => s.trim());
  if (!start || !end) return [start].filter(Boolean);
  const s = parseCellRef(start);
  const e = parseCellRef(end);
  if (!s || !e) return [start, end];
  const refs: string[] = [];
  for (let r = s.row; r <= e.row; r++) {
    for (let c = s.col; c <= e.col; c++) {
      refs.push(`${colToLetter(c)}${r + 1}`);
    }
  }
  return refs;
}

export type CellGetter = (col: number, row: number) => string | undefined;

export function evaluateFormula(
  formula: string,
  getCell: CellGetter
): string {
  const expr = formula.trim().slice(1).trim();
  if (!expr) return "";

  function getCellValue(ref: string): number {
    const parsed = parseCellRef(ref);
    if (!parsed) return NaN;
    const raw = getCell(parsed.col, parsed.row);
    if (raw === "#CIRCULAR" || raw === undefined || raw === "") return 0;
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }

  const sumMatch = expr.match(/^SUM\s*\((.*)\)$/i);
  if (sumMatch) {
    const inner = sumMatch[1].trim();
    const parts = splitTopLevel(inner, ",");
    let total = 0;
    for (const p of parts) {
      const trimmed = p.trim();
      if (trimmed.includes(":")) {
        for (const ref of expandRange(trimmed)) {
          total += getCellValue(ref);
        }
      } else {
        total += getCellValue(trimmed);
      }
    }
    return String(total);
  }

  // Arithmetic: tokenize and evaluate
  const tokens = tokenizeArithmetic(expr);
  if (tokens.length === 0) return "";
  const result = evalArithmetic(tokens, getCellValue);
  return isNaN(result) ? "#ERROR" : String(result);
}

function splitTopLevel(str: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const c of str) {
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === sep && depth === 0) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

type Token = { type: "ref"; ref: string } | { type: "op"; op: string } | { type: "num"; num: number };

function tokenizeArithmetic(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const re = /([A-Z]+\d+|\d+\.?\d*|[+\-*/])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(expr)) !== null) {
    const s = m[1];
    if (/^[+\-*/]$/.test(s)) {
      tokens.push({ type: "op", op: s });
    } else if (/^\d/.test(s)) {
      tokens.push({ type: "num", num: parseFloat(s) });
    } else {
      tokens.push({ type: "ref", ref: s.toUpperCase() });
    }
  }
  return tokens;
}

function evalArithmetic(tokens: Token[], getCellValue: (ref: string) => number): number {
  const values: number[] = [];
  const ops: string[] = [];

  for (const t of tokens) {
    if (t.type === "num") values.push(t.num);
    else if (t.type === "ref") values.push(getCellValue(t.ref));
    else if (t.type === "op") {
      while (ops.length && precedence(ops[ops.length - 1]) >= precedence(t.op)) {
        const b = values.pop()!;
        const a = values.pop()!;
        values.push(apply(ops.pop()!, a, b));
      }
      ops.push(t.op);
    }
  }
  while (ops.length) {
    const b = values.pop()!;
    const a = values.pop()!;
    values.push(apply(ops.pop()!, a, b));
  }
  return values[0] ?? NaN;
}

function precedence(op: string): number {
  if (op === "+" || op === "-") return 1;
  if (op === "*" || op === "/") return 2;
  return 0;
}

function apply(op: string, a: number, b: number): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
    default: return NaN;
  }
}
