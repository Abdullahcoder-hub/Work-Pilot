/**
 * A deterministic, pattern-matched intent classifier — this is the whole
 * "understanding" layer of the assistant, and it never calls an external
 * AI API. It trades the flexibility of an LLM for predictability: the
 * same input always produces the same intent, and every pattern here is
 * inspectable and testable. English and Roman Urdu phrasing are matched
 * side by side rather than translated, since that's how people actually
 * type when code-switching.
 *
 * Order matters — this list is checked top to bottom and the first match
 * wins, so more specific intents (delete/complete/clock-out) are placed
 * ahead of the broader "create" patterns to avoid a stray word like
 * "task" tipping a delete request into a create.
 */

export type Intent =
  | 'clock_in'
  | 'clock_out'
  | 'complete_task'
  | 'delete_task'
  | 'schedule_meeting'
  | 'send_file'
  | 'send_message'
  | 'create_task'
  | 'show_tasks'
  | 'show_overdue'
  | 'show_leave_balance'
  | 'unknown';

interface IntentRule {
  intent: Intent;
  patterns: RegExp[];
}

const RULES: IntentRule[] = [
  {
    intent: 'clock_in',
    patterns: [
      /\bclock\s*(me\s*)?in\b/i,
      /\bmark\s*(my\s*)?attendance\b/i,
      /\blog\s*me\s*in\b/i,
      /\bi'?m\s*(here|in)\b/i,
      /\battendance\s*laga\s*(do|dena|dey)?\b/i,
      /\bhazri\s*laga\s*(do|dena)?\b/i,
      /\battendance\s*mark\s*kar(o|do)?\b/i,
    ],
  },
  {
    intent: 'clock_out',
    patterns: [
      /\bclock\s*(me\s*)?out\b/i,
      /\blog\s*me\s*out\b/i,
      /\bi'?m\s*leaving\b/i,
      /\bend\s*my\s*day\b/i,
      /\bclock\s*out\s*kar(o|do)?\b/i,
      /\b(duty|kaam)\s*khatam\b/i,
    ],
  },
  {
    intent: 'complete_task',
    patterns: [
      /\bmark\b.*\bas\s*(complete|completed|done|finished)\b/i,
      /\bcomplete\s*(the\s*)?task\b/i,
      /\bfinish(ed)?\s*(the\s*)?task\b/i,
      /\btask\b.*\b(is|as)\s*(complete|completed|done)\b/i,
      /\bclose\s*(the\s*)?task\b/i,
      /\btask\b.*\bcomplete\s*declare\s*kar\s*(do|den[ae])\b/i,
      /\btask\b.*\b(complete|mukammal|pura|done)\s*kar\s*(do|den[ae])\b/i,
      /\btask\b.*\bkhatam\s*kar\s*(do|den[ae])\b/i,
    ],
  },
  {
    intent: 'delete_task',
    patterns: [
      /\bdelete\s*(the\s*)?task\b/i,
      /\bremove\s*(the\s*)?task\b/i,
      /\bcancel\s*(the\s*)?task\b/i,
      /\btask\b.*\bdelete\s*kar\s*(do|den[ae])\b/i,
      /\btask\b.*\bhata\s*(do|den[ae])\b/i,
      /\btask\b.*\bmita\s*(do|den[ae])\b/i,
      /\btask\b.*\bremove\s*kar\s*(do|den[ae])\b/i,
    ],
  },
  {
    intent: 'schedule_meeting',
    patterns: [
      /\bschedule\s*(a\s*)?meeting\b/i,
      /\bbook\s*(a\s*)?meeting\b/i,
      /\bset\s*up\s*(a\s*)?meeting\b/i,
      /\barrange\s*(a\s*)?meeting\b/i,
      /\bmeeting\s*rakho\b/i,
      /\bmeeting\s*lagao\b/i,
      /\bmeeting\s*fix\s*kar(o|do)?\b/i,
      /\bmeeting\s*schedule\s*kar(o|do)?\b/i,
    ],
  },
  {
    intent: 'send_file',
    patterns: [
      /\bsend\s*(the\s*|this\s*)?file\b/i,
      /\bshare\s*(the\s*|this\s*)?file\b/i,
      /\battach\s*(the\s*|this\s*)?file\b/i,
      /\bfile\s*bhejo\b/i,
      /\bfile\s*send\s*kar(o|do)?\b/i,
      /\bfile\s*share\s*kar(o|do)?\b/i,
    ],
  },
  {
    intent: 'send_message',
    patterns: [
      /\bsend\s*(a\s*)?message\s*to\b/i,
      /\bmessage\s+[a-z][\w'-]*\s+(that|saying|to\s*say)\b/i,
      /\btell\s+[a-z][\w'-]*\s+(that|to)\b/i,
      /\bko\s*(message|bata|keh)\s*(do|den[ae])\b/i,
      /\bmessage\s*kar(o|do)?\b/i,
    ],
  },
  {
    intent: 'show_leave_balance',
    patterns: [/\bleave\s*balance\b/i, /\bhow\s*much\s*leave\b/i, /\bmeri\s*leave\b/i, /\bchutt?i(yan)?\s*kitni\b/i],
  },
  {
    intent: 'show_overdue',
    patterns: [/\boverdue\b/i, /\bwhat'?s\s*late\b/i, /\bpending\s*and\s*late\b/i],
  },
  {
    intent: 'show_tasks',
    patterns: [/\bmy\s*tasks\b/i, /\bwhat.*(task|work).*(today|pending|have)\b/i, /\bmere\s*tasks\b/i, /\bkya\s*kaam\s*hai\b/i],
  },
  {
    intent: 'create_task',
    patterns: [
      /\b(create|add|make)\s*(a\s*|an\s*|new\s*)*task\b/i,
      /\bremind\s*me\s*to\b/i,
      /\btask\s*banao\b/i,
      /\bnaya\s*task\b/i,
      /\btask\s*add\s*kar(o|do)?\b/i,
      /\btask\s*bana\s*(do|den[ae])\b/i,
    ],
  },
];

export function detectIntent(text: string): Intent {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.intent;
  }
  return 'unknown';
}
