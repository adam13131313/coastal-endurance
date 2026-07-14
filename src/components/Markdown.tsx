import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Brand-styled markdown renderer, shared by the admin reference pages (product-idea
// briefs, competitor profiles). GFM tables supported.
const components = {
  h1: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h1 className="font-typewriter text-xl uppercase tracking-wider mt-2 mb-3" {...p} />,
  h2: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className="font-typewriter text-sm uppercase tracking-widest mt-6 mb-2" {...p} />,
  h3: (p: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className="font-typewriter text-xs uppercase tracking-widest text-muted-foreground mt-4 mb-2" {...p} />,
  p: (p: React.HTMLAttributes<HTMLParagraphElement>) => <p className="font-body text-sm text-muted-foreground leading-relaxed mb-3" {...p} />,
  ul: (p: React.HTMLAttributes<HTMLUListElement>) => <ul className="list-disc pl-5 space-y-1.5 mb-3 font-body text-sm text-muted-foreground" {...p} />,
  ol: (p: React.HTMLAttributes<HTMLOListElement>) => <ol className="list-decimal pl-5 space-y-1.5 mb-3 font-body text-sm text-muted-foreground" {...p} />,
  strong: (p: React.HTMLAttributes<HTMLElement>) => <strong className="text-foreground font-medium" {...p} />,
  em: (p: React.HTMLAttributes<HTMLElement>) => <em className="italic" {...p} />,
  hr: () => <hr className="border-border my-5" />,
  a: (p: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a className="text-foreground underline underline-offset-4 hover:text-primary" target="_blank" rel="noopener noreferrer" {...p} />,
  table: (p: React.TableHTMLAttributes<HTMLTableElement>) => <div className="overflow-x-auto mb-4"><table className="w-full text-sm border border-border" {...p} /></div>,
  th: (p: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className="text-left font-typewriter text-[11px] uppercase tracking-widest text-muted-foreground border border-border px-2.5 py-1.5" {...p} />,
  td: (p: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className="font-body text-muted-foreground border border-border px-2.5 py-1.5 align-top" {...p} />,
};

const Markdown = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{children}</ReactMarkdown>
);

export default Markdown;
