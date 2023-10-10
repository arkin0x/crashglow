export const canDecode = (identifier: string) => {
  if (identifier.charAt(0) !== 'n') return false
  return true
}

export const isHex = (identifier: string) => {
  const hexRegex = /^[0-9a-fA-F]{64}$/
  return hexRegex.test(identifier)
}
