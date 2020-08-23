type Maybe<T> = T | undefined;
type UnknownObject = Record<string, unknown>;

export default function (str: string): unknown {
  let i = 0;

  const value = parseValue();

  expectEndOfInput();
  return value;

  // PARSE

  function parseValue(): unknown {
    skipWhitespace();

    const value =
      parseString() ??
      parseNumber() ??
      parseObject() ??
      parseArray() ??
      parseKeyword("true", true) ??
      parseKeyword("false", false) ??
      parseKeyword("null", null);

    skipWhitespace();

    return value;
  }

  function parseString(): Maybe<string> {
    if (str[i] !== '"') {
      return;
    }

    i++;

    let result = "";

    while (i < str.length && str[i] !== '"') {
      if (str[i] === "\\") {
        const char = str[i + 1];
        if (
          char === '"' ||
          char === "\\" ||
          char === "/" ||
          char === "b" ||
          char === "f" ||
          char === "n" ||
          char === "r" ||
          char === "t"
        ) {
          result += char;
          i++;
        } else if (char === "u") {
          if (
            isHexadecimal(str[i + 2]) &&
            isHexadecimal(str[i + 3]) &&
            isHexadecimal(str[i + 4]) &&
            isHexadecimal(str[i + 5])
          ) {
            result += String.fromCharCode(
              parseInt(str.slice(i + 2, i + 6), 16)
            );
            i += 5;
          } else {
            i += 2;
            expectEscapeUnicode();
          }
        } else {
          expectEscapeCharacter();
        }
      } else {
        result += str[i];
      }

      i++;
    }

    expectNotEndOfInput();
    i++;

    return result;
  }

  function parseNumber(): Maybe<number> {
    let start = i;

    if (str[i] === "-") {
      i++;
      expectDigit();
    }

    if (str[i] === "0") {
      i++;
    } else if (str[i] >= "1" && str[i] <= "9") {
      i++;

      while (str[i] >= "0" && str[i] <= "9") {
        i++;
      }
    }

    if (str[i] === ".") {
      i++;
      expectDigit();

      while (str[i] >= "0" && str[i] <= "9") {
        i++;
      }
    }

    if (str[i] === "e" || str[i] === "E") {
      i++;

      if (str[i] === "-" || str[i] === "+") {
        i++;
      }

      expectDigit();

      while (str[i] >= "0" && str[i] <= "9") {
        i++;
      }
    }

    if (i > start) {
      return Number(str.slice(start, i));
    }
  }

  function parseObject(): Maybe<UnknownObject> {
    if (str[i] !== "{") {
      return;
    }

    i++;

    skipWhitespace();

    const result: UnknownObject = {};

    let initial = true;
    // if not '}',
    // then string -> ':' -> value -> ...
    while (i < str.length && str[i] !== "}") {
      if (!initial) {
        eatComma();
        skipWhitespace();
      }

      const key = parseString();

      if (key === undefined) {
        expectObjectKey();
        return;
      }

      skipWhitespace();
      eatColon();

      result[key] = parseValue();
      initial = false;
    }

    expectNotEndOfInput();
    // skip '}'
    i++;

    return result;
  }

  function parseArray(): Maybe<unknown[]> {
    if (str[i] !== "[") {
      return;
    }

    i++;
    skipWhitespace();

    const result = [];
    let initial = true;

    while (i < str.length && str[i] !== "]") {
      if (!initial) {
        eatComma();
      }
      const value = parseValue();
      result.push(value);
      initial = false;
    }

    expectNotEndOfInput();
    i++; // skip ']'

    return result;
  }

  function parseKeyword<_, T>(name: string, value: T): Maybe<T> {
    if (str.slice(i, i + name.length) === name) {
      i += name.length;
      return value;
    }
  }

  // SKIP

  function skipWhitespace(): void {
    while ([" ", "\n", "\t", "\r"].includes(str[i])) {
      i++;
    }
  }

  // EAT

  function eatComma(): void {
    expectCharacter(",");
    i++;
  }

  function eatColon(): void {
    expectCharacter(":");
    i++;
  }

  // IS

  function isHexadecimal(char: string): boolean {
    return (
      (char >= "0" && char <= "9") ||
      (char.toLowerCase() >= "a" && char.toLowerCase() <= "f")
    );
  }

  // EXPECT

  function expectNotEndOfInput(): void {
    if (i === str.length) {
      throw new SyntaxError("JSON Parse error: Unexpected EOF");
    }
  }

  function expectEndOfInput(): void {
    if (i < str.length) {
      throw new SyntaxError("JSON Parse error: Expected End of Input");
    }
  }

  function expectObjectKey(): void {
    throw new SyntaxError("JSON Parse error: Expecting JSON Key");
  }

  function expectCharacter(expected: string): void {
    expectNotEndOfInput();

    if (str[i] !== expected) {
      throw new SyntaxError("JSON Parse error: Unexpected token");
    }
  }

  function expectDigit(): void {
    if (!(str[i] >= "0" && str[i] <= "9")) {
      throw new SyntaxError("JSON Parse error: Expecting a digit");
    }
  }

  function expectEscapeCharacter(): void {
    throw new SyntaxError("JSON Parse error: Expecting an escape character");
  }

  function expectEscapeUnicode(): void {
    throw new SyntaxError("JSON Parse error: Expecting an escape unicode");
  }
}
