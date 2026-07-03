import React, { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cx } from "../../constants/ui";

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="text-[16px] font-semibold text-[#faf7fd] mt-4 mb-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[14px] font-semibold text-[#faf7fd] mt-4 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-[13px] font-medium text-[#ddd6fe] mt-3 mb-1.5 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="text-[12px] text-[#d9d9d9] leading-relaxed mb-2 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-2 space-y-1 text-[12px] text-[#d9d9d9]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-2 space-y-1 text-[12px] text-[#d9d9d9]">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-[#faf7fd]">{children}</strong>,
  em: ({ children }) => <em className="italic text-[#ddd6fe]">{children}</em>,
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className="block font-mono text-[11px] text-[#ddd6fe] whitespace-pre-wrap">{children}</code>
      );
    }
    return (
      <code className="rounded bg-[#251937] px-1 py-0.5 font-mono text-[11px] text-violet-300">{children}</code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-md border border-[rgba(60,40,80,0.5)] bg-[#110e1f] p-3">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-2 border-l-4 border-violet-500/50 bg-[rgba(168,96,240,0.08)] px-3 py-2 text-[12px] text-[#b8aecc]">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-violet-300 underline hover:text-[#ddd6fe]"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-[rgba(60,40,80,0.5)]" />,
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-[11px]">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#19102b]">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-[rgba(60,40,80,0.5)] px-2 py-1.5 text-left font-medium text-[#faf7fd]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[rgba(60,40,80,0.5)] px-2 py-1.5 text-[#d9d9d9]">{children}</td>
  ),
};

export const ReleaseNoteMarkdown = memo(function ReleaseNoteMarkdown({ content }) {
  const remarkPlugins = useMemo(() => [remarkGfm], []);

  if (!content?.trim()) {
    return <p className="text-[12px] text-[#8c8c8c]">No description.</p>;
  }

  return (
    <div className={cx("release-notes-md min-w-0")}>
      <ReactMarkdown remarkPlugins={remarkPlugins} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
