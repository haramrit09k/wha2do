// Picks an icon and accent colour for a list from its name, so "Gym" gets a
// dumbbell and "Groceries" a cart. Falls back to a generic checklist.
const RULES = [
  [/groc|shop|buy|store|market/i, 'cart-outline'],
  [/gym|fit|workout|run|exercise|sport/i, 'dumbbell'],
  [/home|house|chore|clean|family/i, 'home-outline'],
  [/work|office|job|sprint|meeting|project/i, 'briefcase-outline'],
  [/book|study|read|school|class|learn/i, 'book-open-variant'],
  [/trip|travel|flight|vacation|holiday/i, 'airplane'],
];

const ACCENTS = [
  '#4154FE',
  '#1FA971',
  '#F2994A',
  '#B04CF2',
  '#E5484D',
  '#0EA5C6',
];

export const iconForList = name => {
  const hit = RULES.find(([re]) => re.test(name));
  return hit ? hit[1] : 'format-list-checks';
};

export const accentForList = name => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % ACCENTS.length;
  }
  return ACCENTS[hash];
};
