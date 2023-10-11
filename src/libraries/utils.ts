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
  /**
   * TODO: remove byte order mark if it exists
   * https://stackoverflow.com/questions/24356713/node-js-remove-bom-from-string
   * GitHub Copilot: The characters `ï»¿` at the beginning of an HTML file are known as the byte order mark (BOM). The BOM is a special marker that is sometimes added to the beginning of a text file to indicate the byte order and encoding of the file.

    In some cases, the BOM can cause issues with the interpretation of the file, especially if the file is being processed by software that does not expect or handle the BOM correctly. This can result in the `ï»¿` characters being displayed at the beginning of the file.

    It's possible that the base64-encoded HTML file you decoded included the BOM at the beginning of the file, which caused the `ï»¿` characters to be displayed when you viewed the decoded file. To remove the BOM from the file, you can try opening the file in a text editor that supports BOM detection and removal, or you can manually remove the BOM using a hex editor or other tool.1
   */
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