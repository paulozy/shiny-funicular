/**
 * Manual mock for `remark-gfm`, which is shipped as ESM. The real plugin is a
 * factory that returns a unified plugin; in tests we just need a no-op import
 * that satisfies the ReactMarkdown remarkPlugins prop without crashing.
 */
export default function remarkGfm() {
  return () => undefined
}
