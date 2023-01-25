import { appendChild } from "hyplate/core";
import { For, Show } from "hyplate/directive";
import { jsxRef, mount } from "hyplate/jsx-runtime";
import { source, enableBuiltinStore, query } from "hyplate/store";
import type { FC, Later, Query } from "hyplate/types";
import { type Expression, type Operator, solve } from "./calculate";

enableBuiltinStore();
declare module "hyplate/types" {
  export interface Subscribable<T> extends Query<T> {}
}
const render = (e: Expression | number): JSX.Element => {
  if (typeof e === "number") {
    return renderNumber(e);
  }
  return (
    <mrow>
      {e.operator.startsWith("l")
        ? renderAB(e.b, e.a, e.operator)
        : renderAB(e.a, e.b, e.operator)}
    </mrow>
  );
};

const renderNumber = (n: number): JSX.Element => {
  if (n < 0) {
    return (
      <>
        <mo fence>(</mo>
        <mn>{n}</mn>
        <mo fence>)</mo>
      </>
    );
  }
  return <mn>{n}</mn>;
};

const wrappedRender = (
  e: Expression | number,
  parentOp: Operator
): JSX.Element => {
  if (typeof e === "number") {
    return renderNumber(e);
  }
  const op = e.operator;
  if ((op === "add" || op === "sub" || op === "lsub") && parentOp === "mult") {
    return (
      <>
        <mo fence>(</mo>
        {render(e)}
        <mo fence>)</mo>
      </>
    );
  }
  return render(e);
};
const renderAB = (
  a: Expression | number,
  b: Expression | number,
  op: Operator
) => {
  if (op === "div" || op === "ldiv") {
    return (
      <mfrac>
        {wrappedRender(a, op)}
        {wrappedRender(b, op)}
      </mfrac>
    );
  }
  return (
    <>
      {wrappedRender(a, op)}
      <mo>{OperatorNames[op]}</mo>
      {wrappedRender(b, op)}
    </>
  );
};
const OperatorNames: Record<Operator, string> = {
  add: "+",
  div: "/",
  ldiv: "/",
  lsub: "-",
  mult: "×",
  sub: "-",
};
const App: FC = () => {
  const list = source<{ ref: Later<HTMLInputElement> }[]>(
    Array.from({ length: 4 }, () => ({ ref: jsxRef() }))
  );
  const expected = source(24);
  const pointsText = query(() => {
    const count = expected.val;
    return `${count} ${count > 1 ? "points" : "point"}`;
  });
  const res = source<JSX.Element | null>(null);
  const calculate = () => {
    const atoms = list.val.map((p) => +p.ref.current!.value);
    try {
      const expr = solve(
        atoms,
        ["add", "sub", "lsub", "mult", "div", "ldiv"],
        +expected.val
      );
      res.set(
        <math display="block">
          {render(expr)}
          <mo>=</mo>
          <mn>{expected.val}</mn>
        </math>
      );
    } catch (error) {
      res.set(
        <math display="block">
          <ms>No solution.</ms>
        </math>
      );
    }
  };
  return (
    <div class="app mx-3 my-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          calculate();
        }}
      >
        <div class="mb-3">
          <label for="count" class="form-label">
            number count:
          </label>
          <input
            id="count"
            class="form-control"
            name="count"
            type="number"
            required
            min="1"
            max="10"
            value={list.val.length}
            onChange={function () {
              const count = +this.value;
              const oldList = list.val;
              if (count !== oldList.length) {
                const newList =
                  oldList.length > count
                    ? oldList.slice(0, count)
                    : oldList.concat(
                        Array.from({ length: count - oldList.length }, () => ({
                          ref: jsxRef<HTMLInputElement>(),
                        }))
                      );
                list.set(newList);
              }
            }}
          ></input>
        </div>
        <div class="mb-3">
          <label for="sum" class="form-label">
            expected result:
          </label>
          <input
            onChange={function () {
              const val = +this.value;
              if (!isNaN(val)) {
                expected.set(val);
              }
            }}
            class="form-control"
            id="sum"
            name="sum"
            value="24"
            required
            type="number"
          ></input>
        </div>
        <div class="mb-3 row g-3">
          <For of={list}>
            {(p) => {
              return (
                <div class="col">
                  <label class="form-label">
                    input #{1 + list.val.indexOf(p)}
                    <input class="form-control" required ref={p.ref}></input>
                  </label>
                </div>
              );
            }}
          </For>
        </div>
        <button class="btn btn-primary" type="submit">
          solve {pointsText}
        </button>
        <div>
          <Show when={res}>{(attach, expr) => mount(expr, attach)}</Show>
        </div>
      </form>
    </div>
  );
};

mount(<App></App>, appendChild(document.body));
