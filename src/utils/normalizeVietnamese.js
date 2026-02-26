export const normalize = (str) =>
  (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const includes = (haystack, needle) =>
  normalize(haystack).includes(normalize(needle));
