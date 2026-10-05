import {
  log,
  header,
  warn,
  todo,
  parse,
  Range,
  createBoolLiteral,
  createTemplateElement,
} from './helper';

import {
  Mutant,
  MutantType,
} from './tester';

import { green } from 'chalk';

import acorn from 'acorn';
import {
  AssignmentOperator,
  BinaryExpression,
  BinaryOperator,
  BlockStatement,
  ConditionalExpression,
  Expression,
  IfStatement,
  LogicalExpression,
  LogicalOperator,
  Node,
} from 'acorn';

import walk from 'acorn-walk';

import { generate } from 'astring';
import { boolean } from 'yargs';

/* Mutator
 *
 * (Problem #1) Mutation Operation (70 points)
 *
 * Please implement the missing parts (denoted by todo() functions).
 *
 * The goal of this project to generate mutants from a given JavaScript code
 * and to measure the mutation score of a test suite as its adequacy criterion.
 */
export class Mutator {
  code: string;
  mutants: Mutant[];
  ast: Node;
  beautified: string;
  detail: boolean;

  // Generate mutants from the code
  static from(code: string, detail: boolean = false): Mutant[] {
    const mutator = new Mutator(code, detail);
    return mutator.mutants;
  }

  // Constructor
  constructor(code: string, detail: boolean = false) {
    this.code = code;
    this.mutants = [];
    this.ast = parse(this.code);
    this.beautified = generate(this.ast);
    this.detail = detail;
    this.generateMutants();
  }

  // Generate mutants
  generateMutants = (): void => {
    const { ast, beautified: before, visitor, detail } = this;
    if (detail) header('Generating Mutants...');
    walk.recursive(ast, null, visitor);
    const after = generate(ast);
    if (before !== after) {
      warn('The AST is changed after generating mutants');
    }
  }

  // Add a mutant to the list with its type and the target node
  addMutant = (type: MutantType, node: Node): void => {
    const { mutants, code, ast, beautified, detail } = this;
    const id = mutants.length + 1;
    const mutated = generate(ast);
    const range = Range.fromNode(code, node);
    const after = generate(node);
    const mutant = new Mutant(id, type, mutated, code, range, after);
    mutants.push(mutant);
    if (beautified == mutated) {
      warn('The code is the same after generating a mutant');
      warn(mutant);
    } else if (detail) {
      log(mutant, green);
    }
  }

  // Visitor for generating mutants
  visitor: walk.RecursiveVisitors<any> = {
    ArrayExpression: (node) => {
      const { visitor, addMutant } = this;
      const { elements } = node;

      if (elements.length > 0) {
        node.elements = new Array();
        addMutant(MutantType.ArrayDecl, node);
        node.elements = elements;
        for (const a of elements) {
          if (a)
            walk.recursive(a, null, visitor);
        }
      }

    },
    AssignmentExpression: (node) => {
      const { visitor, addMutant } = this;
      const { left, operator, right } = node;

      switch (operator) {
        case '+=':
          node.operator = '-=';
          addMutant(MutantType.AssignExpr, node);
          node.operator = operator;
          break;
        case '-=':
          node.operator = '+=';
          addMutant(MutantType.AssignExpr, node);
          node.operator = operator;
          break;
        case '*=':
          node.operator = '/=';
          addMutant(MutantType.AssignExpr, node);
          node.operator = operator;
          break;
        case '/=':
          node.operator = '*=';
          addMutant(MutantType.AssignExpr, node);
          node.operator = operator;
          break;
        case '%=':
          node.operator = '*=';
          addMutant(MutantType.AssignExpr, node);
          node.operator = operator;
          break;
        case '<<=':
          node.operator = '>>=';
          addMutant(MutantType.AssignExpr, node);
          node.operator = operator;
          break;
        case '>>=':
          node.operator = '<<=';
          addMutant(MutantType.AssignExpr, node);
          node.operator = operator;
          break;
        case '&=':
          node.operator = '|=';
          addMutant(MutantType.AssignExpr, node);
          node.operator = operator;
          break;
        case '|=':
          node.operator = '&=';
          addMutant(MutantType.AssignExpr, node);
          node.operator = operator;
          break;
        case '??=':
          node.operator = '&&=';
          addMutant(MutantType.AssignExpr, node);
          node.operator = operator;
          break;
      }
      walk.recursive(left, null, visitor);
      walk.recursive(right, null, visitor);
    },
    BinaryExpression: (node) => {
      const { visitor, addMutant } = this;
      const { left, operator, right } = node;

      switch (operator) {
        case '+':
          node.operator = '-';
          addMutant(MutantType.Arithmetic, node);
          node.operator = operator;
          break;
        case '-':
          node.operator = '+';
          addMutant(MutantType.Arithmetic, node);
          node.operator = operator;
          break;
        case '*':
          node.operator = '/';
          addMutant(MutantType.Arithmetic, node);
          node.operator = '%';
          addMutant(MutantType.Arithmetic, node);
          node.operator = operator;
          break;
        case '/':
          node.operator = '*';
          addMutant(MutantType.Arithmetic, node);
          node.operator = '%';
          addMutant(MutantType.Arithmetic, node);
          node.operator = operator;
          break;
        case '%':
          node.operator = '*';
          addMutant(MutantType.Arithmetic, node);
          node.operator = '/';
          addMutant(MutantType.Arithmetic, node);
          node.operator = operator;
          break;
        case '<':
          node.operator = '<=';
          addMutant(MutantType.EqualityOp, node);
          node.operator = '>=';
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
        case '<=':
          node.operator = '<';
          addMutant(MutantType.EqualityOp, node);
          node.operator = '>';
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
        case '>':
          node.operator = '>=';
          addMutant(MutantType.EqualityOp, node);
          node.operator = '<=';
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
        case '>=':
          node.operator = '>';
          addMutant(MutantType.EqualityOp, node);
          node.operator = '<';
          addMutant(MutantType.EqualityOp, node);
          node.operator = operator;
          break;
        case '===':
          node.operator = '!==';
          addMutant(MutantType.EqualityOp, node);
          if (!(left.type === 'Literal' && left.value === null || right.type === 'Literal' && right.value === null)) {
            node.operator = '==';
            addMutant(MutantType.EqualityOp, node);
          }
          node.operator = operator;
          break;
        case '!==':
          node.operator = '===';
          addMutant(MutantType.EqualityOp, node);
          if (!(left.type === 'Literal' && left.value === null || right.type === 'Literal' && right.value === null)) {
            node.operator = '!=';
            addMutant(MutantType.EqualityOp, node);
          }
          node.operator = operator;
          break;
        case '==':
          node.operator = '!=';
          addMutant(MutantType.EqualityOp, node);
          if (!(left.type === 'Literal' && left.value === null || right.type === 'Literal' && right.value === null)) {
            node.operator = '===';
            addMutant(MutantType.EqualityOp, node);
          }
          node.operator = operator;
          break;
        case '!=':
          node.operator = '==';
          addMutant(MutantType.EqualityOp, node);
          if (!(left.type === 'Literal' && left.value === null || right.type === 'Literal' && right.value === null)) {
            node.operator = '!==';
            addMutant(MutantType.EqualityOp, node);
          }
          node.operator = operator;
          break;
      }
      walk.recursive(left, null, visitor);
      walk.recursive(right, null, visitor);
    },
    BlockStatement: (node) => {
      const { visitor, addMutant } = this;
      const { body } = node;

      if (node.body.length > 0) {
        node.body = [];
        addMutant(MutantType.BlockStmt, node);
        node.body = body;
      }

      for (const p of body) {
        walk.recursive(p, null, visitor);
      }
    },
    ChainExpression: (node) => {
      const { visitor, addMutant } = this;
      const { expression } = node;

      const opts: any[] = [];
      let cur: any = expression;

      while (cur.type == 'MemberExpression' || cur.type === 'CallExpression') {
        if (cur.optional)
          opts.push(cur);
        cur = (cur.type === 'MemberExpression') ? cur.object : cur.callee;
      }

      for (const o of opts)
        o.optional = false;
      addMutant(MutantType.OptionalChain, node);
      for (const o of opts)
        o.optional = true;

      walk.recursive(expression, null, visitor);
    },
    ConditionalExpression: (node) => {
      const { visitor, addMutant } = this;
      const { test, consequent, alternate } = node;

      if (!(test.type === 'Literal' && test.value === true)) {
        node.test = createBoolLiteral(true);
        addMutant(MutantType.Cond, node);
      }
      if (!(test.type === 'Literal' && test.value === false)) {
        node.test = createBoolLiteral(false);
        addMutant(MutantType.Cond, node);
      }
      node.test = test;

      walk.recursive(test, null, visitor);
      walk.recursive(consequent, null, visitor);
      if (alternate)
        walk.recursive(alternate, null, visitor);
    },
    DoWhileStatement: (node) => {
      const { visitor, addMutant } = this;
      const { body, test } = node;

      walk.recursive(body, null, visitor);

      if (!(test && test.type === 'Literal' && test.value === false)) {
        node.test = createBoolLiteral(false);
        addMutant(MutantType.Cond, node);
        node.test = test;
      }
      walk.recursive(test, null, visitor);
    },
    ForStatement: (node) => {
      const { visitor, addMutant } = this;
      const { init, test, update, body } = node;

      if (test && !(test.type === 'Literal' && test.value === false)) {
        node.test = createBoolLiteral(false);
        addMutant(MutantType.Cond, node);
        node.test = test;
      }
      if (init)
        walk.recursive(init, null, visitor);
      if (test)
        walk.recursive(test, null, visitor);
      if (update)
        walk.recursive(update, null, visitor);
      if (body)
        walk.recursive(body, null, visitor);
    },
    IfStatement: (node) => {
      const { visitor, addMutant } = this;
      const { test, consequent, alternate } = node;

      if (!(test.type === 'Literal' && test.value === true)) {
        node.test = createBoolLiteral(true);
        addMutant(MutantType.Cond, node);
      }
      if (!(test.type === 'Literal' && test.value === false)) {
        node.test = createBoolLiteral(false);
        addMutant(MutantType.Cond, node);
      }
      node.test = test;

      walk.recursive(test, null, visitor);
      walk.recursive(consequent, null, visitor);
      if (alternate)
        walk.recursive(alternate, null, visitor);
    },
    Literal: (node) => {
      const { visitor, addMutant } = this;
      const { value, raw } = node;

      if (typeof value === 'boolean') {
        node.value = !value;
        node.raw = (!value).toString();
        addMutant(MutantType.BooleanLiteral, node);
        node.value = value;
        node.raw = raw;
      }
      if (typeof value === 'string') {
        if (value === '') {
          node.value = '__PLRG__';
          node.raw = '"__PLRG__"';
        }
        else {
          node.value = '';
          node.raw = '""';
        }
        addMutant(MutantType.StringLiteral, node);
        node.value = value;
        node.raw = raw;
      }
      // if (value === false)
      // {
      //   value = createBoolLiteral(false);
      //   addMutant(MutantType.BooleanLiteral, node);
      // }
      // if (value === true)
      // {
      //   value = createBoolLiteral(true);
      //   addMutant(MutantType.BooleanLiteral, node);
      // }
    },
    LogicalExpression: (node) => {
      const { visitor, addMutant } = this;
      const { left, operator, right } = node;

      switch (operator) {
        case '&&':
          node.operator = '||';
          addMutant(MutantType.LogicalOp, node);
          node.operator = '??';
          addMutant(MutantType.LogicalOp, node);
          node.operator = operator;
          break;
        case '||':
          node.operator = '&&';
          addMutant(MutantType.LogicalOp, node);
          node.operator = '??';
          addMutant(MutantType.LogicalOp, node);
          node.operator = operator;
          break;
        case '??':
          node.operator = '||';
          addMutant(MutantType.LogicalOp, node);
          node.operator = '&&';
          addMutant(MutantType.LogicalOp, node);
          node.operator = operator;
          break;
      }
      walk.recursive(left, null, visitor);
      walk.recursive(right, null, visitor);
    },
    NewExpression: (node) => {
      const { visitor, addMutant } = this;
      const { callee, arguments: args } = node;

      if (callee.type == 'Identifier' && callee.name == 'Array' && args.length > 0) {
        node.arguments = [];
        addMutant(MutantType.ArrayDecl, node);
        node.arguments = args;
      }

      walk.recursive(callee, null, visitor);
      for (const p of args)
        walk.recursive(p, null, visitor);
    },
    ObjectExpression: (node) => {
      const { visitor, addMutant } = this;
      const { properties } = node;

      if (properties.length > 0) {
        node.properties = [];
        addMutant(MutantType.ObjectLiteral, node);
        node.properties = properties;
      }

      for (const p of properties)
        walk.recursive(p, null, visitor);
    },
    TemplateLiteral: (node) => {
      const { visitor, addMutant } = this;
      const { quasis, expressions } = node;

      const isEmpty = expressions.length == 0 && quasis[0].value.raw === '';

      node.quasis = [createTemplateElement(isEmpty ? '__PLRG' : '')];
      node.expressions = [];
      addMutant(MutantType.StringLiteral, node);
      node.quasis = quasis;
      node.expressions = expressions;

      for (const e of expressions)
        walk.recursive(e, null, visitor);
    },
    UnaryExpression: (node) => {
      const { visitor, addMutant } = this;
      const { argument, operator } = node;
      switch (operator) {
        case '+':
          node.operator = '-';
          addMutant(MutantType.UnaryOp, node);
          node.operator = operator;
          break;
        case '-':
          node.operator = '+';
          addMutant(MutantType.UnaryOp, node);
          node.operator = operator;
          break;
      }
      walk.recursive(argument, null, visitor);
    },
    UpdateExpression: (node) => {
      const { visitor, addMutant } = this;
      const { argument, operator, prefix } = node;

      node.prefix = !prefix;
      addMutant(MutantType.Update, node);
      node.prefix = prefix;

      if (operator == '++')
        node.operator = '--';
      else
        node.operator = '++';
      addMutant(MutantType.Update, node);
      node.operator = operator;

      walk.recursive(argument, null, visitor);
    },
    WhileStatement: (node) => {
      const { visitor, addMutant } = this;
      const { body, test } = node;

      if (!(test && test.type === 'Literal' && test.value === false)) {
        node.test = createBoolLiteral(false);
        addMutant(MutantType.Cond, node);
        node.test = test;
      }
      walk.recursive(body, null, visitor);
      walk.recursive(test, null, visitor);
    },
    // XXX: for assertion
    // DO not modify the code inside the function
    CallExpression: (node) => {
      const { visitor, addMutant } = this;
      const { callee, arguments: args } = node;
      // Not to mutate the assertion function
      if (callee.type === 'Identifier' && callee.name === '__assert__') {
        return;
      }
      // Recursively mutate the arguments if it is not the assertion function
      walk.recursive(callee, null, visitor);
      for (const arg of args) walk.recursive(arg, null, visitor);
    }
  }
}

/* Inputs for mutation testing of `example/vector.js`
 *
 * (Problem #2) Killing All Mutants (30 points)
 *
 * Please construct inputs generating a test suite for the `example/vector.js`
 * JavaScript file that kills all the generated mutants.
 *
 * The current inputs kills only 7 out of 221 mutants.
 */
export const vectorInputs: [string][] = [
  ["$V([])"],
  ["$V([1, 2, 3]).dup()"],
  ["[0,1,2,3,4].map(i => $V([5, 6, 7]).e(i))"],
  ["$V([1, 2, 3]).dimensions()"],
  ["$V([3, 4]).modulus()"],
  ["$V([1, 2, 3]).eql([0, 2, 3])"],
  ["$V([1, 2, 3]).multiply(3)"],
  ["$V([1, 2]).isParallelTo($V([2, 4]))"],
  ["$V([1, 0]).isAntiparallelTo([-1, 0])"],
  ["$V([1, 2]).isPerpendicularTo($V([-2, 1]))"],
  ["$V([1, 2, 3]).cross($V([4, 7, 5]))"],
  ["$V([3, 7, 5]).max()"],
  ["$V([1, 2, 3, 2]).indexOf(2)"],
  ["$V([1, 2, 3]).distanceFrom({ anchor: 1, distanceFrom: v => v.elements })"],
  ["$V([1, 2, 3]).inspection()"],
  ["$V([1, 2]).eql([1, 2, 3])"],
  ["$V([1, 2]).isParallelTo([1, 2, 3])"],
  ["$V([1, 2]).isAntiparallelTo([1, 2, 3])"],
  ["$V([1, 2]).isPerpendicularTo([1, 2, 3])"],
  ["$V([1, 2]).add([1, 2, 3])"],
  ["$V([1, 2]).subtract([1, 2, 3])"],
  ["$V([1, 2]).cross([1, 2, 3])"],
  ["$V([1, 2]).distanceFrom([1, 2, 3])"],
  ["$V([1, 2, 3]).eql(null)"],
  ["$V([1, 2]).angleFrom(null)"],
  ["$V([1, 2]).add(null)"],
  ["$V([1, 2]).subtract(null)"],
  ["$V([1, 2]).dot(null)"],
  ["$V([1, 2, 3]).cross(null)"],
  ["$V([1, 2, 3]).eql({ elements: '', length: 3, 0: 1, 1: 2, 2: 3 })"],
  ["$V([1, 2]).angleFrom({ elements: '', length: 2, 0: 1, 1: 2 })"],
  ["$V([1, 2]).add({ elements: '', length: 2, 0: 1, 1: 2 })"],
  ["$V([1, 2]).subtract({ elements: '', length: 2, 0: 1, 1: 2 })"],
  ["$V([1, 2]).dot({ elements: '', length: 2, 0: 1, 1: 2 })"],
  ["$V([1, 2, 3]).cross({ elements: '', length: 3, 0: 1, 1: 2, 2: 4 })"],
  ["$V([1, 2]).distanceFrom({ elements: '', length: 2, 0: 4, 1: 6 })"],
  ["$V({ elements: { slice: () => 0 }, slice: () => [9] })"],
  ["$V([1, 2, 3]).eql({ length: '3', 0: 1, 1: 2, 2: 3 })"],
  ["$V([1, 2, 3]).eql(['1', '2', '3'])"],
  ["$V([1, 2]).angleFrom({ length: '2', 0: 1, 1: 2 })"],
  ["$V([1, 2]).add({ length: '2', 0: 1, 1: 2 })"],
  ["$V([1, 2]).subtract({ length: '2', 0: 1, 1: 2 })"],
  ["$V([1, 2]).dot({ length: '2', 0: 1, 1: 2 })"],
  ["$V([1, 2, 3]).cross({ length: '3', 0: 1, 1: 2, 2: 4 })"],
  ["$V({ slice: () => ({ length: '3', 0: 1, 1: 2, 2: 3 }) }).cross([1, 2, 4])"],
  ["$V([1, 2]).distanceFrom({ length: '2', 0: 4, 1: 6 })"],
  ["$V([1, 2, 3]).indexOf('2')"],
  
  ["(() => { var v = $V([1, 2]); v.angleFrom = () => '0'; return v.isParallelTo([1, 2]); })()"],
  ["(() => { var v = $V([1, 2]); v.angleFrom = () => String(Math.PI); return v.isAntiparallelTo([1, 2]); })()"],
  ["(() => { var v = $V([1, 2]); v.dot = () => '0'; return v.isPerpendicularTo([1, 2]); })()"],
  ["$V([-0]).max()"],
]
