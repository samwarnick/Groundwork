type Tag = "h1" | "h2" | "h3" | "h4" | "p";
type InlineTag = "a" | "img" | "strong" | "em";
interface Block {
  tag: Tag;
  content: string;
}

interface InlineBlock {
  tag: InlineTag;
  content: string;
}

export class Markdown {
  toHtml(markdown: string): string {
    const blocks = this._createTree(markdown);
    return this._render(blocks);
  }

  private _createTree(markdown: string): Block[] {
    return markdown
      .split("\n")
      .filter((md) => !!md)
      .map((md) => {
        return this._createBlock(md);
      });
  }

  private _createBlock(markdown: string): Block {
    if (markdown.startsWith("# ")) {
      return {
        tag: "h1",
        content: markdown.replace("# ", ""),
      };
    } else if (markdown.startsWith("## ")) {
      return {
        tag: "h2",
        content: markdown.replace("# ", ""),
      };
    } else if (markdown.startsWith("### ")) {
      return {
        tag: "h3",
        content: markdown.replace("### ", ""),
      };
    } else if (markdown.startsWith("#### ")) {
      return {
        tag: "h4",
        content: markdown.replace("#### ", ""),
      };
    } else {
      return {
        tag: "p",
        content: markdown,
      };
    }
  }

  private _render(blocks: Block[]): string {
    return blocks
      .map((block) => {
        return `<${block.tag}>${block.content}</${block.tag}>`;
      })
      .join("\n");
  }
}
