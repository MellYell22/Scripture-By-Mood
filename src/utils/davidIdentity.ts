const DAVID_TITLE_PATTERN = String.raw`(?:Pastor|Reverend|Rev\.?|Father|Minister|Bishop|Elder|Doctor|Dr\.?)`;
const DAVID_OTHER_NAME_PATTERN = String.raw`(?:Micha(?:el))`;

export const DAVID_SELF_INTRODUCTION_RULE = `
IDENTITY RULE:
- Your name is David.
- If you introduce yourself, only introduce yourself as "David."
- Say "My name is David." or "I'm David." Never add a title, honorific, church affiliation, role label, or any other name to your self-introduction.
- Never call yourself by any titled version of David or by any other name.
`;

const SELF_INTRODUCTION_PATTERNS: Array<[RegExp, string]> = [
  [
    new RegExp(
      String.raw`\b(my name is|i am|i['’]m|this is|it['’]?s)\s+(?:${DAVID_TITLE_PATTERN}\s+)?(?:${DAVID_OTHER_NAME_PATTERN}|David)\b(?:\s+from\s+Grace Community Church)?`,
      'gi',
    ),
    '$1 David',
  ],
  [
    new RegExp(
      String.raw`\b(you can call me|call me)\s+(?:${DAVID_TITLE_PATTERN}\s+)?(?:${DAVID_OTHER_NAME_PATTERN}|David)\b`,
      'gi',
    ),
    '$1 David',
  ],
  [
    new RegExp(String.raw`\b${DAVID_TITLE_PATTERN}\s+(?:${DAVID_OTHER_NAME_PATTERN}|David)\b`, 'gi'),
    'David',
  ],
  [new RegExp(String.raw`\b${DAVID_OTHER_NAME_PATTERN}\b`, 'gi'), 'David'],
];

const SELF_INTRODUCTION_WITH_DESCRIPTOR_PATTERN = new RegExp(
  String.raw`\b(my name is|i am|i['’]m|this is|it['’]?s)\s+David(?:\s*,?\s+(?:and\s+)?(?:from|with|your|a|an|the|here|ready|calling|representing|available|happy|glad|checking)\b[^.?!]*)?[.?!]?`,
  'gi',
);

function normalizeIntroLead(lead: string): string {
  return lead.toLowerCase() === 'my name is' ? 'My name is David.' : "I'm David.";
}

export function normalizeDavidSelfIntroduction(text: string): string {
  if (!text) return text;

  const normalizedName = SELF_INTRODUCTION_PATTERNS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text,
  ).replace(/\bDavid\s+from\s+Grace Community Church\b/gi, 'David');

  return normalizedName
    .replace(SELF_INTRODUCTION_WITH_DESCRIPTOR_PATTERN, (_match, lead: string) => normalizeIntroLead(lead))
    .replace(/\b(My name is David|I am David|I'm David|I’m David|This is David|It'?s David)\s*,\s*/gi, (_match, intro: string) => {
      if (/^my name is/i.test(intro)) return 'My name is David. ';
      return "I'm David. ";
    })
    .replace(/\s{2,}/g, ' ')
    .trim();
}
