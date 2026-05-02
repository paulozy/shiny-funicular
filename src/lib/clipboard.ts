// Tiny wrapper around the Clipboard API that returns a boolean instead of
// throwing on browsers without permission or HTTPS context.
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false
  }
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
