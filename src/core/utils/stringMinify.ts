/**
 * generate substring if term too long
 */
export default (term: string, length: number) =>
  term && term.length > length ? term.slice(0, length) + '...' : term
