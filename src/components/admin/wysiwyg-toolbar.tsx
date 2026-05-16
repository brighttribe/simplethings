'use client'

/**
 * Lightweight WYSIWYG toolbar for contenteditable divs.
 * Uses document.execCommand for formatting.
 *
 * Props:
 *   onCodeView / codeView — wire to the parent's toggleCodeView function and state.
 *                           The parent must render the dark textarea and hide the
 *                           contenteditable when codeView is true.
 *   right                 — extra buttons pinned to the right (e.g. Insert Link).
 */
export function WysiwygToolbar({
  right,
  onCodeView,
  codeView,
}: {
  right?: React.ReactNode
  onCodeView?: () => void
  codeView?: boolean
} = {}) {
  function normalizeBoldSpans() {
    const focused = document.activeElement as HTMLElement
    if (focused?.contentEditable !== 'true') return

    // Convert <b> → <strong>
    focused.querySelectorAll('b').forEach((b) => {
      const strong = document.createElement('strong')
      while (b.firstChild) strong.appendChild(b.firstChild)
      b.parentNode?.replaceChild(strong, b)
    })

    // Convert span[font-weight:bold] → <strong>, unwrap span[font-weight:normal]
    focused.querySelectorAll('span[style]').forEach((span) => {
      const el = span as HTMLElement
      const fw = el.style.fontWeight
      if (fw === 'bold' || fw === '700' || fw === '600') {
        const strong = document.createElement('strong')
        el.style.fontWeight = ''
        const remaining = el.getAttribute('style')?.trim()
        if (remaining) strong.setAttribute('style', remaining)
        while (el.firstChild) strong.appendChild(el.firstChild)
        el.parentNode?.replaceChild(strong, el)
      } else if (fw === 'normal' || fw === '400') {
        const parent = el.parentNode
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el)
          parent.removeChild(el)
        }
      }
    })
  }

  function exec(cmd: string, value?: string) {
    document.execCommand(cmd, false, value || '')
    if (cmd === 'bold') normalizeBoldSpans()
  }

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-100 bg-gray-50 flex-wrap">
      {/* Paragraph */}
      <button type="button" title="Paragraph (remove heading)" onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'p') }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors text-[11px] font-bold">
        P
      </button>

      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Bold */}
      <button type="button" title="Bold" onMouseDown={(e) => { e.preventDefault(); exec('bold') }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors font-bold">
        B
      </button>

      {/* Italic */}
      <button type="button" title="Italic" onMouseDown={(e) => { e.preventDefault(); exec('italic') }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="4" x2="10" y2="4" /><line x1="14" y1="20" x2="5" y2="20" /><line x1="15" y1="4" x2="9" y2="20" />
        </svg>
      </button>

      {/* Clear formatting */}
      <button type="button" title="Clear formatting" onMouseDown={(e) => { e.preventDefault(); exec('removeFormat') }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors text-[10px] font-bold">
        Tx
      </button>

      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* H2 */}
      <button type="button" title="Heading 2" onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'h2') }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors text-[10px] font-bold">
        H2
      </button>

      {/* H3 */}
      <button type="button" title="Heading 3" onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'h3') }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors text-[10px] font-bold">
        H3
      </button>

      {/* H4 */}
      <button type="button" title="Heading 4" onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', 'h4') }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors text-[10px] font-bold">
        H4
      </button>

      <div className="w-px h-4 bg-gray-200 mx-0.5" />

      {/* Bullet List */}
      <button type="button" title="Bullet List" onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList') }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="4" cy="6" r="2" /><circle cx="4" cy="12" r="2" /><circle cx="4" cy="18" r="2" />
          <rect x="9" y="5" width="12" height="2" rx="1" /><rect x="9" y="11" width="12" height="2" rx="1" /><rect x="9" y="17" width="12" height="2" rx="1" />
        </svg>
      </button>

      {/* Numbered List */}
      <button type="button" title="Numbered List" onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList') }}
        className="w-7 h-7 flex items-center justify-center rounded text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" style={{ fontSize: '10px' }}>
          <text x="1" y="8" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">1</text>
          <text x="1" y="14.5" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">2</text>
          <text x="1" y="21" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">3</text>
          <rect x="10" y="5" width="12" height="2" rx="1" /><rect x="10" y="11" width="12" height="2" rx="1" /><rect x="10" y="17" width="12" height="2" rx="1" />
        </svg>
      </button>

      {/* Right-side extras (Insert Link, etc.) */}
      {right && (
        <>
          <div className="flex-1" />
          {right}
        </>
      )}

      {/* Code view -- always on the far right when onCodeView is provided */}
      {onCodeView && (
        <>
          {!right && <div className="flex-1" />}
          <div className="w-px h-4 bg-gray-200 mx-0.5" />
          <button
            type="button"
            title="Toggle code view"
            onMouseDown={(e) => { e.preventDefault(); onCodeView() }}
            className={`px-2 py-1 text-xs font-mono font-medium rounded-lg transition-colors ${
              codeView
                ? 'text-green-400 bg-gray-900'
                : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {'</>'}
          </button>
        </>
      )}
    </div>
  )
}
