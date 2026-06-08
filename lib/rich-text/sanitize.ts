const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del',
  'ul', 'ol', 'li', 'pre', 'code', 'img', 'div', 'span', 'blockquote',
])

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  img: new Set(['src', 'alt', 'class']),
  a: new Set(['href', 'target', 'rel']),
  '*': new Set(['style', 'class']),
}

function isAllowedAttr(tag: string, attr: string) {
  return ALLOWED_ATTRS[tag]?.has(attr) || ALLOWED_ATTRS['*']?.has(attr)
}

function sanitizeStyle(style: string): string {
  const allowed = ['text-align']
  return style
    .split(';')
    .map(part => part.trim())
    .filter(part => {
      const [prop] = part.split(':').map(s => s.trim().toLowerCase())
      return allowed.includes(prop)
    })
    .join('; ')
}

export function stripHtml(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent ?? div.innerText ?? '').trim()
}

export function isRichTextEmpty(html: string): boolean {
  return stripHtml(html).length === 0 && !html.includes('<img')
}

export function sanitizeRichText(html: string): string {
  if (!html.trim()) return ''

  if (typeof DOMParser === 'undefined') {
    return html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '')
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')

  function walk(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.cloneNode(false)
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return null

    const el = node as Element
    const tag = el.tagName.toLowerCase()

    if (tag === 'script' || tag === 'style' || tag === 'iframe') return null

    if (!ALLOWED_TAGS.has(tag)) {
      const fragment = document.createDocumentFragment()
      for (const child of Array.from(el.childNodes)) {
        const cleaned = walk(child)
        if (cleaned) fragment.appendChild(cleaned)
      }
      return fragment
    }

    const clean = document.createElement(tag)
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase()
      if (!isAllowedAttr(tag, name)) continue
      if (name === 'style') {
        const safeStyle = sanitizeStyle(attr.value)
        if (safeStyle) clean.setAttribute('style', safeStyle)
        continue
      }
      if (name === 'src' && tag === 'img') {
        if (/^https?:\/\//i.test(attr.value) || attr.value.startsWith('/')) {
          clean.setAttribute('src', attr.value)
        }
        continue
      }
      clean.setAttribute(name, attr.value)
    }

    for (const child of Array.from(el.childNodes)) {
      const cleaned = walk(child)
      if (!cleaned) continue
      if (cleaned.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        clean.appendChild(cleaned)
      } else {
        clean.appendChild(cleaned)
      }
    }

    return clean
  }

  const body = doc.body
  const wrapper = document.createElement('div')
  for (const child of Array.from(body.childNodes)) {
    const cleaned = walk(child)
    if (cleaned) wrapper.appendChild(cleaned)
  }

  return wrapper.innerHTML.trim()
}
