import "reflect-metadata";

const symbol = Symbol("TestSymbol");

@Decorator("value")
class A {

  @Decorator("string")
  b: string;

}

console.log(Reflect.getMetadataKeys(A));
console.log(Reflect.getMetadataKeys(A.prototype));
console.log(Reflect.hasMetadata(symbol, A));
console.log(Reflect.hasMetadata(symbol, A.prototype));


function Decorator(value: unknown) {
  const decorator: MethodDecorator = (instance, propKey) => {
    Reflect.defineMetadata(symbol, { propKey, value }, instance);
  };
  return decorator as any;
}
