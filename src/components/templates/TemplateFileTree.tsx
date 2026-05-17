'use client'

import { CSSProperties, useMemo, useState } from 'react'
import { T } from '@/lib/tokens'
import { GeneratedFile } from '@/lib/types/template'
import { MFIcon } from '@/components/icons/MFIcon'

interface TemplateFileTreeProps {
  files: GeneratedFile[]
  activePath?: string
  onSelect: (file: GeneratedFile) => void
}

interface TreeNode {
  name: string
  fullPath: string
  isDir: boolean
  children: TreeNode[]
  file?: GeneratedFile
}

function buildTree(files: GeneratedFile[]): TreeNode {
  const root: TreeNode = { name: '', fullPath: '', isDir: true, children: [] }
  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean)
    let cursor = root
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const isLast = i === parts.length - 1
      let child = cursor.children.find((c) => c.name === name && c.isDir !== isLast)
      if (!child) {
        child = {
          name,
          fullPath: parts.slice(0, i + 1).join('/'),
          isDir: !isLast,
          children: [],
          file: isLast ? file : undefined,
        }
        cursor.children.push(child)
      }
      cursor = child
    }
  }
  // Sort: directories first, then files, alphabetically
  const sort = (node: TreeNode): void => {
    node.children.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    node.children.forEach(sort)
  }
  sort(root)
  return root
}

function TreeRow({
  node,
  depth,
  expanded,
  toggleExpanded,
  activePath,
  onSelect,
}: {
  node: TreeNode
  depth: number
  expanded: Set<string>
  toggleExpanded: (path: string) => void
  activePath?: string
  onSelect: (file: GeneratedFile) => void
}) {
  const isOpen = expanded.has(node.fullPath)
  const isActive = !node.isDir && node.file?.path === activePath

  const rowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 8px',
    paddingLeft: 8 + depth * 12,
    cursor: 'pointer',
    background: isActive ? T.surfaceHover : 'transparent',
    color: isActive ? T.ink : T.ink2,
    fontFamily: T.mono,
    fontSize: 12,
    borderRadius: 4,
  }

  const handleClick = () => {
    if (node.isDir) {
      toggleExpanded(node.fullPath)
    } else if (node.file) {
      onSelect(node.file)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        style={{
          ...rowStyle,
          appearance: 'none',
          border: 'none',
          width: '100%',
          textAlign: 'left',
        }}
        aria-expanded={node.isDir ? isOpen : undefined}
      >
        {node.isDir ? (
          <>
            <MFIcon name={isOpen ? 'chevron-down' : 'chevron-right'} size={10} color={T.faint} />
            <MFIcon name="folder" size={11} color={T.ink3} />
          </>
        ) : (
          <>
            <span style={{ width: 10 }} />
            <MFIcon name="doc" size={11} color={T.faint} />
          </>
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name}
        </span>
      </button>
      {node.isDir && isOpen &&
        node.children.map((child) => (
          <TreeRow
            key={child.fullPath}
            node={child}
            depth={depth + 1}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            activePath={activePath}
            onSelect={onSelect}
          />
        ))}
    </>
  )
}

export function TemplateFileTree({ files, activePath, onSelect }: TemplateFileTreeProps) {
  const tree = useMemo(() => buildTree(files), [files])
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Expand top-level dirs by default for discoverability.
    const initial = new Set<string>()
    tree.children.forEach((child) => {
      if (child.isDir) initial.add(child.fullPath)
    })
    return initial
  })

  const toggleExpanded = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  const containerStyle: CSSProperties = {
    padding: 8,
    borderRight: `1px solid ${T.border}`,
    background: T.surface,
    overflow: 'auto',
    minWidth: 220,
    maxWidth: 320,
  }

  return (
    <nav aria-label="Arquivos do template" style={containerStyle}>
      {tree.children.map((node) => (
        <TreeRow
          key={node.fullPath}
          node={node}
          depth={0}
          expanded={expanded}
          toggleExpanded={toggleExpanded}
          activePath={activePath}
          onSelect={onSelect}
        />
      ))}
    </nav>
  )
}
