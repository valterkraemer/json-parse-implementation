import {
  assertEquals,
  assertThrows,
} from "https://deno.land/std@0.65.0/testing/asserts.ts";
import jsonParse from "../src/json-parse-implementation.ts";

function jsonParseError(message: string): [typeof SyntaxError, string] {
  return [SyntaxError, `JSON Parse error: ${message}`];
}

const ERROR_UNEXPECTED_EOF = jsonParseError("Unexpected EOF");
const ERROR_EXPECTED_END_OF_INPUT = jsonParseError("Expected End of Input");
const ERROR_EXPECTING_JSON_KEY = jsonParseError("Expecting JSON Key");
const ERROR_UNEXPECTED_TOKEN = jsonParseError("Unexpected token");
const ERROR_EXPECTING_A_DIGIT = jsonParseError("Expecting a digit");
const ERROR_EXPECTING_ESCAPE_CHAR = jsonParseError(
  "Expecting an escape character"
);
const ERROR_EXPECTING_ESCAPE_UNICODE = jsonParseError(
  "Expecting an escape unicode"
);

Deno.test("All tests", () => {
  assertEquals(jsonParse("1"), 1);
  assertEquals(jsonParse("{}"), {});
  assertEquals(jsonParse('{"key": "value"}'), { key: "value" });
  assertEquals(jsonParse("null"), null);
  assertEquals(jsonParse('"mystring"'), "mystring");

  assertThrows(() => jsonParse('{"a"b}'), ...ERROR_UNEXPECTED_TOKEN);

  assertThrows(() => jsonParse("-"), ...ERROR_EXPECTING_A_DIGIT);
  assertThrows(() => jsonParse("-1."), ...ERROR_EXPECTING_A_DIGIT);
  assertThrows(() => jsonParse("1e"), ...ERROR_EXPECTING_A_DIGIT);
  assertThrows(() => jsonParse("-1e-2.2"), ...ERROR_EXPECTED_END_OF_INPUT);
  assertThrows(() => jsonParse("{"), ...ERROR_UNEXPECTED_EOF);
  assertThrows(() => jsonParse("{}{"), ...ERROR_EXPECTED_END_OF_INPUT);
  assertThrows(() => jsonParse('{"a"'), ...ERROR_UNEXPECTED_EOF);
  assertThrows(() => jsonParse('{"a": "b",'), ...ERROR_EXPECTING_JSON_KEY);
  assertThrows(() => jsonParse('{"a":"b""c"'), ...ERROR_UNEXPECTED_TOKEN);
  assertThrows(() => jsonParse('{"a":"foo\\}'), ...ERROR_EXPECTING_ESCAPE_CHAR);
  assertThrows(
    () => jsonParse('{"a":"foo\\u"}'),
    ...ERROR_EXPECTING_ESCAPE_UNICODE
  );
  assertThrows(() => jsonParse("["), ...ERROR_UNEXPECTED_EOF);
  assertThrows(() => jsonParse("[]["), ...ERROR_EXPECTED_END_OF_INPUT);
  assertThrows(() => jsonParse("[[]"), ...ERROR_UNEXPECTED_EOF);
  assertThrows(() => jsonParse('["]'), ...ERROR_UNEXPECTED_EOF);
});
