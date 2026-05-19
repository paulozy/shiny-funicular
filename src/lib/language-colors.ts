// Static color palette for programming languages. Hex codes copied verbatim
// from the official `github-linguist/linguist` languages.yml so the stacked
// bar feels familiar to anyone who reads a GitHub repo. Keeping this inline
// (a few KB) avoids the dependency on the upstream packages.
//
// Source: https://github.com/github-linguist/linguist/blob/main/lib/linguist/languages.yml

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Go: '#00ADD8',
  Python: '#3572A5',
  Rust: '#dea584',
  Ruby: '#701516',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Scala: '#c22d40',
  Clojure: '#db5855',
  Elixir: '#6e4a7e',
  Erlang: '#B83998',
  Haskell: '#5e5086',
  OCaml: '#3be133',
  'C++': '#f34b7d',
  'C#': '#178600',
  C: '#555555',
  'Objective-C': '#438eff',
  PHP: '#4F5D95',
  Lua: '#000080',
  Perl: '#0298c3',
  R: '#198CE7',
  Julia: '#a270ba',
  Dart: '#00B4AB',
  Shell: '#89e051',
  Bash: '#89e051',
  PowerShell: '#012456',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Sass: '#a53b70',
  Less: '#1d365d',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Astro: '#ff5a03',
  Solidity: '#AA6746',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  YAML: '#cb171e',
  TOML: '#9c4221',
  JSON: '#292929',
  Markdown: '#083fa1',
  HCL: '#844FBA',
  Terraform: '#844FBA',
  SQL: '#e38c00',
  GraphQL: '#e10098',
  TeX: '#3D6117',
  Zig: '#ec915c',
  Nim: '#ffc200',
  Crystal: '#000100',
  Vala: '#a56de2',
  'F#': '#b845fc',
  'Visual Basic': '#945db7',
}

const FALLBACK_PALETTE = [
  '#6e7681',
  '#7d8590',
  '#8b949e',
  '#a1a6ab',
  '#9aa0a6',
  '#b3b8bd',
  '#5c6370',
  '#828a93',
]

// Deterministic fallback for languages absent from the table above. djb2-style
// hash so the same language name always resolves to the same color across
// reloads — important so the legend doesn't shift colors on every render.
export function colorForLanguage(name: string): string {
  if (LANGUAGE_COLORS[name]) return LANGUAGE_COLORS[name]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return FALLBACK_PALETTE[hash % FALLBACK_PALETTE.length]
}
