export type Numeric = Fraction | Atom;
export interface Comparable {
  equals(n: Numeric): boolean;
}
export interface Operators {
  add(n: Numeric): Numeric;
  sub(n: Numeric): Numeric;
  lsub(n: Numeric): Numeric;
  mult(n: Numeric): Numeric;
  div(n: Numeric): Numeric;
  ldiv(n: Numeric): Numeric;
}
export type Operator = keyof Operators;
export interface Expression {
  a: Expression | number;
  operator: Operator;
  b: Expression | number;
}
const gcd = (a: number, b: number) => {
  let r: number;
  while ((r = a % b)) {
    a = b;
    b = r;
  }
  return b;
};
const isAtom = (n: unknown): n is Atom => n instanceof Atom;
const isFraction = (n: unknown): n is Fraction => n instanceof Fraction;
const die = (msg: string) => {
  throw new Error(msg);
};
class Atom implements Operators, Comparable {
  constructor(public readonly value: number) {}
  equals(n: Numeric): boolean {
    if (isAtom(n)) {
      return n.value === this.value;
    }
    return n.equals(this);
  }
  add(n: Numeric): Numeric {
    if (isAtom(n)) {
      return new Atom(this.value + n.value);
    }
    return n.add(this);
  }
  sub(n: Numeric): Numeric {
    if (isAtom(n)) {
      return new Atom(this.value - n.value);
    }
    return n.lsub(this);
  }
  lsub(n: Numeric): Numeric {
    if (isAtom(n)) {
      return new Atom(n.value - this.value);
    }
    return n.sub(this);
  }
  mult(n: Numeric): Numeric {
    if (isAtom(n)) {
      return new Atom(this.value * n.value);
    }
    return n.mult(this);
  }
  div(n: Numeric): Numeric {
    if (isAtom(n)) {
      return Fraction.create(this.value, n.value);
    }
    return n.ldiv(this);
  }
  ldiv(n: Numeric): Numeric {
    if (isAtom(n)) {
      return Fraction.create(n.value, this.value);
    }
    return n.div(this);
  }
}
class Fraction implements Operators, Comparable {
  static create(dividend: number, divisor: number) {
    const m = gcd(dividend, divisor);
    dividend /= m;
    divisor /= m;
    if (divisor !== 1) {
      return new Fraction(dividend, divisor);
    }
    return new Atom(dividend);
  }
  private constructor(
    public readonly dividend: number,
    public readonly divisor: number
  ) {}

  equals(n: Numeric): boolean {
    const { dividend, divisor } = this;
    if (isAtom(n)) {
      return dividend / divisor === n.value;
    }
    if (isFraction(n)) {
      const { dividend: a, divisor: b } = n;
      return a * divisor === b * dividend;
    }
    return die(`Unsupported "Numeric" type.`);
  }

  add(n: Numeric): Numeric {
    let { dividend, divisor } = this;
    if (isAtom(n)) {
      dividend += n.value * this.divisor;
    } else if (isFraction(n)) {
      const { dividend: a, divisor: b } = this;
      const { divisor: c, dividend: d } = n;
      divisor = b * d;
      dividend = a * d + b * c;
    } else {
      return die(`Unsupported "Numeric" type.`);
    }
    return Fraction.create(dividend, divisor);
  }
  sub(n: Numeric): Numeric {
    let { dividend, divisor } = this;
    if (isAtom(n)) {
      dividend -= n.value * divisor;
    } else if (isFraction(n)) {
      const { dividend: a, divisor: b } = this;
      const { divisor: c, dividend: d } = n;
      divisor = b * d;
      dividend = a * d - b * c;
    } else {
      return die(`Unsupported "Numeric" type.`);
    }
    return Fraction.create(dividend, divisor);
  }
  lsub(n: Numeric): Numeric {
    let { dividend, divisor } = this;
    if (isAtom(n)) {
      dividend = n.value * divisor - dividend;
    } else if (isFraction(n)) {
      const { dividend: a, divisor: b } = this;
      const { divisor: c, dividend: d } = n;
      divisor = b * d;
      dividend = b * c - a * d;
    } else {
      return die(`Unsupported "Numeric" type.`);
    }
    return Fraction.create(dividend, divisor);
  }
  mult(n: Numeric): Numeric {
    let { dividend, divisor } = this;
    if (isAtom(n)) {
      dividend *= n.value;
    } else if (isFraction(n)) {
      divisor *= n.divisor;
      dividend *= n.dividend;
    } else {
      return die(`Unsupported "Numeric" type.`);
    }
    return Fraction.create(dividend, divisor);
  }
  div(n: Numeric): Numeric {
    let { dividend, divisor } = this;
    if (isAtom(n)) {
      divisor *= n.value;
    } else if (isFraction(n)) {
      divisor *= n.dividend;
      dividend *= n.divisor;
    } else {
      return die(`Unsupported "Numeric" type.`);
    }
    return Fraction.create(dividend, divisor);
  }
  ldiv(n: Numeric): Numeric {
    let { dividend, divisor } = this;
    if (isAtom(n)) {
      [divisor, dividend] = [dividend, n.value * divisor];
    } else if (isFraction(n)) {
      [divisor, dividend] = [n.divisor * dividend, n.dividend * divisor];
    } else {
      return die(`Unsupported "Numeric" type.`);
    }
    return Fraction.create(dividend, divisor);
  }
}

interface ListNode<T> {
  value: T;
  next: ListNode<T> | undefined;
  prev: ListNode<T> | undefined;
}

const insert = <T extends unknown>(
  instance: DoubleLinkedList<T>,
  prop: "front" | "back",
  value: T
) => {
  const link = prop === "back" ? "next" : "prev";
  const { [prop]: node } = instance;
  const newNode: ListNode<T> = { value, prev: undefined, next: undefined };
  if (!node) {
    instance.front = instance.back = newNode;
  } else {
    instance[prop] = node[link] = newNode;
  }
};

const remove = <T extends unknown>(
  instance: DoubleLinkedList<T>,
  prop: "front" | "back"
) => {
  const link = prop === "back" ? "prev" : "next";
  const unlink = prop === "back" ? "next" : "prev";
  const { [prop]: node } = instance;
  if (node) {
    const connection = node[link];
    if (connection) {
      connection[unlink] = undefined;
      instance[prop] = connection;
    } else {
      instance.front = instance.back = undefined;
    }
  }
};

class DoubleLinkedList<T> {
  front: ListNode<T> | undefined;
  back: ListNode<T> | undefined;
  push(value: T) {
    insert(this, "back", value);
  }
  pop() {
    remove(this, "back");
  }
  enqueue(value: T) {
    insert(this, "front", value);
  }
  dequeue() {
    remove(this, "front");
  }
}

export const solve = (
  atoms: number[],
  operators: Operator[],
  target: number
) => {
  const compare = new Atom(target);
  const opLength = operators.length;
  const atomLength = atoms.length;
  const find = (start: number) => {
    const usedIndex = new Set<number>();
    usedIndex.add(start);
    const atom = atoms[start];
    let numeric: Numeric = new Atom(atom);
    let expr: Expression | number = atom;
    const invoke = () => {
      if (usedIndex.size === atomLength) {
        if (numeric.equals(compare)) {
          throw expr;
        }
      }
      for (let i = 0; i < atomLength; i++) {
        if (usedIndex.has(i)) {
          continue;
        }
        usedIndex.add(i);
        const atom = atoms[i]!;
        const operand = new Atom(atom);
        for (let j = 0; j < opLength; j++) {
          const op = operators[j]!;
          const lastNumeric = numeric;
          const lastExpr = expr;
          numeric = numeric[op](operand);
          expr = {
            a: expr,
            operator: op,
            b: atom,
          };
          invoke();
          expr = lastExpr;
          numeric = lastNumeric;
        }
        usedIndex.delete(i);
      }
    };
    invoke();
  };
  try {
    for (let i = 0; i < atomLength; i++) {
      find(i);
    }
  } catch (error) {
    return error as Expression;
  }
  throw new Error("No solution.");
};
