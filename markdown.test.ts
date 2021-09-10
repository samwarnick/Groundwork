import { Markdown } from "./markdown.ts";
import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";

const markdown = new Markdown();

Deno.test("Simple", () => {
  const input = `# Hello, World!

This is a test.`;
  const expected = `<h1>Hello, World!</h1>
<p>This is a test.</p>`;
  const result = markdown.toHtml(input);
  assertEquals(result, expected);
});
