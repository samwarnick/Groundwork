import { readLines } from "https://deno.land/std@0.106.0/io/mod.ts";
import * as path from "https://deno.land/std@0.106.0/path/mod.ts";

const SAM_EXTENDS = new RegExp(/\{\{\s*extends\s+(\S*)\s*\}\}/);
const SAM_INCLUDES = new RegExp(/\{\{\s*includes\s+(\S*)\s*\}\}/);
const SAM_CONTENT = new RegExp(/\{\{\s*content\s*\}\}/);

async function getTemplateContent(filename: string): Promise<string[]> {
  const fileReader = await Deno.open(filename);
  const content: string[] = [];
  const extended: string[] = [];
  for await (const line of readLines(fileReader)) {
    if (SAM_EXTENDS.test(line)) {
      const [_, extend] = line.match(SAM_EXTENDS) as RegExpMatchArray;
      const filename = path.join(
        Deno.cwd(),
        `templates/${extend.replace(".sam", "")}.sam`
      );
      extended.push(...(await getTemplateContent(filename)));
    } else if (SAM_INCLUDES.test(line)) {
      const [_, includes] = line.match(SAM_INCLUDES) as RegExpMatchArray;
      const filename = path.join(
        Deno.cwd(),
        `templates/includes/${includes.replace(".sam", "")}.sam`
      );
      content.push(...(await getTemplateContent(filename)));
    } else {
      content.push(line);
    }
  }
  if (extended.length > 0) {
    const contentIndex = extended.findIndex((line) => SAM_CONTENT.test(line));
    extended.splice(contentIndex, 1, ...content);
    return extended;
  }
  return content;
}

export async function renderTemplate(name: string): Promise<Response> {
  const filename = path.join(Deno.cwd(), `templates/${name}.sam`);

  const body = await getTemplateContent(filename);

  return new Response(body.join("\n"), {
    headers: { "content-type": "text/html; charset=UTF-8" },
  });
}
