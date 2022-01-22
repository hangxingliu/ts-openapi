import { deepStrictEqual } from "assert";
import { iterateObject } from "./base";

let called = false;
let iterator = (key, value) => { called = true };
class A { constructor(readonly b = 1) { } }

iterateObject(null, iterator);
iterateObject(undefined, iterator);
//@ts-ignore
iterateObject(false, iterator);
//@ts-ignore
iterateObject(0, iterator);
iterateObject({}, iterator);
iterateObject(A, iterator);
deepStrictEqual(called, false);


iterator = (key, value) => {
  called = true;
  deepStrictEqual(key, 'b');
  deepStrictEqual(value, 1);
};
called = false;
iterateObject({ b: 1 }, iterator);
deepStrictEqual(called, true);

called = false;
iterateObject(new A(), iterator);
deepStrictEqual(called, true);


iterator = (key, value) => {
  called = true;
  deepStrictEqual(key, '2');
  deepStrictEqual(value, 1);
};
called = false;
iterateObject({ 2: 1 }, iterator);
deepStrictEqual(called, true);

