export interface TeamMember {
  _id: string;
  name: string;
}

/**
 * Finds the team member whose name best matches something mentioned in
 * the text. Tries, in order: a whole first-name word match, then a
 * substring match on the full name. Returns null (rather than guessing)
 * when nothing or more than one equally-good candidate matches — the
 * caller should ask the user to clarify rather than message/assign the
 * wrong person.
 */
export function findMentionedMember(text: string, members: TeamMember[]): TeamMember | null {
  const lower = text.toLowerCase();
  const words = lower.split(/[^a-z']+/).filter(Boolean);

  const firstNameMatches = members.filter((m) => {
    const firstName = m.name.trim().split(/\s+/)[0]?.toLowerCase();
    return firstName && words.includes(firstName);
  });
  if (firstNameMatches.length === 1) return firstNameMatches[0];

  const substringMatches = members.filter((m) => lower.includes(m.name.toLowerCase()));
  if (substringMatches.length === 1) return substringMatches[0];

  // Ambiguous (two Alis) or no match at all — either way, don't guess.
  if (firstNameMatches.length > 1) return null;
  return null;
}

const PRIORITY_HIGH = /\b(high\s*priority|urgent|asap|zaroori|ahem|important)\b/i;
const PRIORITY_LOW = /\b(low\s*priority|kam\s*zaroori|whenever|no\s*rush)\b/i;

export function extractPriority(text: string): 'High' | 'Medium' | 'Low' {
  if (PRIORITY_HIGH.test(text)) return 'High';
  if (PRIORITY_LOW.test(text)) return 'Low';
  return 'Medium';
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Returns a YYYY-MM-DD string, or null if no date reference was found. Relative terms resolve against `now`. */
export function extractDate(text: string, now: Date = new Date()): string | null {
  const lower = text.toLowerCase();

  const isoMatch = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) return isoMatch[0];

  if (/\btoday\b|\baaj\b/.test(lower)) return toDateStr(now);

  if (/\btomorrow\b|\bkal\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return toDateStr(d);
  }

  if (/\byesterday\b/.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() - 1);
    return toDateStr(d);
  }

  for (let i = 0; i < WEEKDAYS.length; i++) {
    if (new RegExp(`\\b${WEEKDAYS[i]}\\b`).test(lower)) {
      const d = new Date(now);
      const currentDay = d.getDay();
      let delta = i - currentDay;
      if (delta <= 0) delta += 7; // always the next occurrence, not today/past
      d.setDate(d.getDate() + delta);
      return toDateStr(d);
    }
  }

  return null;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Returns {hours, minutes} in 24h time, or null. Handles "3pm", "3:30 pm",
 * "15:00", and Roman Urdu "X baje" with time-of-day words to resolve
 * am/pm ("shaam 5 baje" = 5pm, "subah 8 baje" = 8am).
 */
export function extractTime(text: string): { hours: number; minutes: number } | null {
  const lower = text.toLowerCase();

  const explicit = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (explicit) {
    let hours = parseInt(explicit[1], 10) % 12;
    if (explicit[3] === 'pm') hours += 12;
    return { hours, minutes: explicit[2] ? parseInt(explicit[2], 10) : 0 };
  }

  const baje = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*baje\b/);
  if (baje) {
    let hours = parseInt(baje[1], 10) % 12;
    const isEvening = /\b(shaam|raat|dopher|dopahar)\b/.test(lower);
    const isMorning = /\bsubah\b/.test(lower);
    if (isEvening && hours < 12) hours += 12;
    if (!isMorning && !isEvening && hours < 8) hours += 12; // bare "5 baje" defaults to evening for a 1-4 range
    return { hours, minutes: baje[2] ? parseInt(baje[2], 10) : 0 };
  }

  const bare24 = lower.match(/\b(\d{1,2}):(\d{2})\b/);
  if (bare24) return { hours: parseInt(bare24[1], 10), minutes: parseInt(bare24[2], 10) };

  return null;
}

/**
 * Strips every recognized trigger phrase (English + Roman Urdu, for the
 * given intent's action) out of the text, leaving the "payload" behind —
 * e.g. for create_task, what's left after removing "create a task to" is
 * the title. Also strips any matched date/time/priority phrases so they
 * don't pollute the title.
 */
const TRIGGER_STRIP_PATTERNS: RegExp[] = [
  /\b(create|add|make)\s*(a\s*|an\s*|new\s*)*task\s*(to|for)?\b/gi,
  /\bremind\s*me\s*to\b/gi,
  /\btask\s*banao\b/gi,
  /\bnaya\s*task\b/gi,
  /\btask\s*add\s*kar(o|do)?\b/gi,
  /\btask\s*bana\s*(do|den[ae])\b/gi,
  /\bmark\b.*?\bas\s*(complete|completed|done|finished)\b/gi,
  /\bcomplete\s*(the\s*)?task\b/gi,
  /\bfinish(ed)?\s*(the\s*)?task\b/gi,
  /\bclose\s*(the\s*)?task\b/gi,
  /\btask\s*complete\s*declare\s*kar\s*(do|den[ae])\b/gi,
  /\b(complete|mukammal|pura|done|khatam)\s*kar\s*(do|den[ae])\b/gi,
  /\btask\b/gi,
  /\bdelete\s*(the\s*)?/gi,
  /\bremove\s*(the\s*)?/gi,
  /\bcancel\s*(the\s*)?/gi,
  /\bdelete\s*kar\s*(do|den[ae])\b/gi,
  /\bhata\s*(do|den[ae])\b/gi,
  /\bmita\s*(do|den[ae])\b/gi,
  /\bschedule\s*(a\s*)?meeting\s*(with|for)?\b/gi,
  /\bbook\s*(a\s*)?meeting\s*(with|for)?\b/gi,
  /\bset\s*up\s*(a\s*)?meeting\s*(with|for)?\b/gi,
  /\barrange\s*(a\s*)?meeting\s*(with|for)?\b/gi,
  /\bmeeting\s*(rakho|lagao)\b/gi,
  /\bmeeting\s*(fix|schedule)\s*kar(o|do)?\b/gi,
  /\bmeeting\b/gi,
  /\bhigh\s*priority|low\s*priority|urgent|asap|zaroori|ahem|important|kam\s*zaroori|whenever|no\s*rush\b/gi,
  /\btoday|tomorrow|yesterday|aaj|kal\b/gi,
  /\b\d{4}-\d{2}-\d{2}\b/gi,
  /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/gi,
  /\b\d{1,2}(:\d{2})?\s*baje\b/gi,
  /\b(shaam|raat|dopher|dopahar|subah)\b/gi,
  /\bat\b/gi,
];

export function extractPayloadText(text: string): string {
  let stripped = text;
  for (const pattern of TRIGGER_STRIP_PATTERNS) {
    stripped = stripped.replace(pattern, ' ');
  }
  return stripped.replace(/\s+/g, ' ').trim().replace(/^[,.\s-]+|[,.\s-]+$/g, '');
}

/**
 * For send_message/send_file: pulls the message text out after the
 * employee's name and a connector word ("that", "saying", "keh do",
 * "bata do"), falling back to whatever's left after stripping the
 * trigger phrase and the person's name.
 */
export function extractMessageText(text: string, memberName: string | null): string {
  const connectorMatch = text.match(/\b(?:that|saying|to\s*say|keh\s*do|keh\s*den[ae]|bata\s*do|bata\s*den[ae])\b[:\s]*([\s\S]+)/i);
  if (connectorMatch) return connectorMatch[1].trim().replace(/^["']|["']$/g, '');

  let remainder = text;
  remainder = remainder.replace(/\bsend\s*(a\s*)?message\s*to\b/gi, ' ');
  remainder = remainder.replace(/\bmessage\s*kar(o|do)?\b/gi, ' ');
  remainder = remainder.replace(/\bko\s*(message|bata|keh)\s*(do|den[ae])\b/gi, ' ');
  remainder = remainder.replace(/\btell\b/gi, ' ');
  if (memberName) remainder = remainder.replace(new RegExp(memberName.split(/\s+/)[0], 'gi'), ' ');
  return remainder.replace(/\s+/g, ' ').trim().replace(/^[,.\s-]+|[,.\s-]+$/g, '');
}
