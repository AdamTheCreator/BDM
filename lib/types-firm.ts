// Firm profile shape — see spec §4.12.
//
// IMPORTANT: time-sensitive fields (currentFundSize, recentDeals, hiringSignals,
// bdTeam) are intentionally optional. The seeded profiles only include stable
// facts; the refresh endpoint populates the rest with explicit caveats.

export type FirmStableProfile = {
  slug: string;
  name: string;
  website: string;
  hq: string;
  founded?: number;
  // Conservative, stable description — what the firm has historically been known for.
  // Avoid current-vintage fund sizes, current portfolio counts, or specific recent deals.
  overview: string;
  sectorFocus: string[];      // e.g. ["software", "vertical SaaS", "tech-enabled services"]
  // Well-known historical context: a few notable past deals or recognizable
  // milestones, not "recent". Use sparingly.
  notable: string[];
  // The kind of BD work this firm is known for, if any. Used for interview framing.
  bdNotes?: string;
};

// Layered on top via the refresh endpoint. Persisted to localStorage per slug.
export type FirmRefreshedData = {
  slug: string;
  refreshedAt: string;
  // Each field accompanied by a confidence string so users know what to verify.
  thesis?: { value: string; needsVerification: boolean };
  currentFundFamily?: { value: string; needsVerification: boolean };
  recentDealsNarrative?: { value: string; needsVerification: boolean };
  bdTeamGuidance?: { value: string; needsVerification: boolean };
  hiringSignals?: { value: string; needsVerification: boolean };
  interviewPrepNotes?: { value: string; needsVerification: boolean };
  // Free-form: things Claude flagged it can't confirm and the user should look up.
  needsVerification: string[];
};
