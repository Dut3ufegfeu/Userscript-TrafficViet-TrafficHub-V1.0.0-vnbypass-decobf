/* Stage-2 deob: fold uy([...],key) XOR strings, fold pure numeric/bitwise const exprs,
 * normalize \x escapes (via babel regen), dot-notation members. No code is executed. */
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
const beautify = require('js-beautify').js;

const input = process.argv[2];
const outFile = process.argv[3];
const src = fs.readFileSync(input, 'utf8');
const ast = parser.parse(src, { sourceType: 'script', allowReturnOutsideFunction: true });

/* XOR string decoders: any function whose body XORs char codes with fromCharCode
 * (e.g. uy(uW, xw) { ... uW[Mm] ^ xw ... String.fromCharCode }). */
const xorFns = new Set();
traverse(ast, {
  FunctionDeclaration(p) {
    const txt = src.slice(p.node.start, p.node.end)
      .replace(/\\x([0-9a-fA-F]{2})/g, (m, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/['"\s+]/g, '');
    if (/fromCharCode/i.test(txt) && /\^/.test(txt) && p.node.params.length === 2) {
      xorFns.add(p.node.id.name);
      console.log('[*] xor-decoder fn:', p.node.id.name);
    }
  },
});

function safeNumericExpr(node) {
  switch (node.type) {
    case 'NumericLiteral': return true;
    case 'UnaryExpression':
      return ['-', '+', '~', '!'].includes(node.operator) && safeNumericExpr(node.argument);
    case 'BinaryExpression':
      return ['+', '-', '*', '/', '%', '^', '&', '|', '<<', '>>', '>>>'].includes(node.operator)
        && safeNumericExpr(node.left) && safeNumericExpr(node.right);
    case 'ParenthesizedExpression': return safeNumericExpr(node.expression);
    default: return false;
  }
}
function evalNumeric(node) {
  const code = generate(node).code;
  if (!/^[0-9a-fxX^&|<>~+*/%().\s-]+$/.test(code)) throw new Error('unsafe chars');
  // eslint-disable-next-line no-new-func
  return Function('"use strict";return (' + code + ')')();
}

let stats = { xor: 0, num: 0, dot: 0, ternary: 0 };
for (let round = 0; round < 8; round++) {
  let changed = false;
  traverse(ast, {
    CallExpression(p) {
      const c = p.node.callee;
      if (t.isIdentifier(c) && xorFns.has(c.name) && p.node.arguments.length === 2
        && t.isArrayExpression(p.node.arguments[0]) && t.isNumericLiteral(p.node.arguments[1])) {
        const key = p.node.arguments[1].value;
        let ok = true, dec = '';
        for (const el of p.node.arguments[0].elements) {
          if (!t.isNumericLiteral(el)) { ok = false; break; }
          dec += String.fromCharCode((el.value ^ key) & 0xffff);
        }
        if (ok) { p.replaceWith(t.stringLiteral(dec)); stats.xor++; changed = true; }
      }
    },
    Expression(p) {
      if (p.isBinaryExpression() || (p.isUnaryExpression() && p.node.operator !== 'typeof')) {
        if (safeNumericExpr(p.node)) {
          try {
            const v = evalNumeric(p.node);
            if (typeof v === 'number' && Number.isFinite(v)) {
              p.replaceWith(t.numericLiteral(v));
              stats.num++; changed = true;
            }
          } catch (e) { /* leave */ }
        }
      }
    },
    MemberExpression(p) {
      const n = p.node;
      if (n.computed && t.isStringLiteral(n.property) && /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(n.property.value)) {
        n.property = t.identifier(n.property.value);
        n.computed = false;
        stats.dot++; changed = true;
      }
    },
    ConditionalExpression(p) {
      const n = p.node;
      if (t.isBooleanLiteral(n.test) || (t.isNumericLiteral(n.test) && (n.test.value === 0 || n.test.value === 1))) {
        const truthy = t.isBooleanLiteral(n.test) ? n.test.value : n.test.value !== 0;
        p.replaceWith(truthy ? n.consequent : n.alternate);
        stats.ternary++; changed = true;
      }
    },
  });
  if (!changed) break;
}
console.log('[*] stats', JSON.stringify(stats));

const gen = generate(ast, { compact: false, jsescOption: { minimal: false } });
fs.writeFileSync(outFile, beautify(gen.code, { indent_size: 2, wrap_line_length: 120 }));
console.log('[*] wrote', outFile);
