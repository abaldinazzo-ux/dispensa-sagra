// Genera un codice EAN-13 con prefisso 200 (range riservato uso interno GS1)
export function generaEAN13() {
  const prefix = [2, 0, 0]
  const random = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const digits = [...prefix, ...random]
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0)
  const checkDigit = (10 - (sum % 10)) % 10
  return [...digits, checkDigit].join('')
}
