export const canDecode = (identifier: string) => {
  if (identifier.charAt(0) !== 'n') return false
  return true
}

export const isHex = (identifier: string) => {
  const hexRegex = /^[0-9a-fA-F]{64}$/
  return hexRegex.test(identifier)
}

// use this like event.tags.find(getTag('e'))[1] to get the value of the e tag
type FindTag = (tag: string[]) => boolean;
export const getTag = (key: string): FindTag => {
  return (tag): boolean => {
    return tag && Array.isArray(tag) && tag[0] === key
  }
}
// this function requires the key and value to match
export const getTagValue = (key: string, value: string): FindTag => {
  return (tag): boolean => {
    return tag && Array.isArray(tag) && tag[0] === key && tag[1] === value
  }
}

// pico-8
export const replaceScript = (html: string, script: string): string => {
  // replace `` in javascript file
  const fixedScript = script.replace(/`/g, '\\`')
  const regex = /e\.src\s*=\s*"(.+?)";/
  const match = regex.exec(html)
  if (match) {
    const replacement = `e.text = \`${fixedScript}\`;`
    return html.replace(match[0], replacement)
  } else {
    return html
  }
}