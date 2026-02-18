/**
 * IR L1 Ranking Logic — Quick Verification Tests
 *
 * Tests the Indian Railway procurement method:
 * 1. Technical score >= 70 to qualify
 * 2. L1 = lowest price among qualified
 * 3. Tie-break: higher technical score
 *
 * Since RfqService is a WatermelonDB-coupled singleton, we test
 * the pure ranking algorithm directly (same logic as rankQuotes).
 */

interface MockQuote {
  id: string;
  quotedPrice: number;
  technicalScore: number | null;
  rank: number | null;
  status: string;
}

/**
 * Pure ranking function — mirrors RfqService.rankQuotes() logic exactly
 */
function rankQuotesIRL1(quotes: MockQuote[]): MockQuote[] {
  const QUALIFICATION_THRESHOLD = 70;

  // Separate qualified (tech >= 70) and disqualified
  const qualified = quotes.filter((q) => (q.technicalScore || 0) >= QUALIFICATION_THRESHOLD);
  const disqualified = quotes.filter((q) => (q.technicalScore || 0) < QUALIFICATION_THRESHOLD);

  // Sort qualified by price ASC, then tech score DESC for tie-break
  const sorted = [...qualified].sort((a, b) => {
    if (a.quotedPrice !== b.quotedPrice) return a.quotedPrice - b.quotedPrice;
    return (b.technicalScore || 0) - (a.technicalScore || 0);
  });

  // Assign ranks
  sorted.forEach((q, i) => {
    q.rank = i + 1;
    if (i === 0) q.status = 'shortlisted';
  });

  // Disqualified: no rank
  disqualified.forEach((q) => {
    q.rank = null;
  });

  return quotes;
}

/**
 * Pure evaluation function — mirrors RfqService.evaluateQuote() logic
 */
function evaluateQuoteIRL1(technicalScore: number, commercialScore: number) {
  return {
    technicalScore,
    commercialScore,
    overallScore: technicalScore, // IR method: overallScore = technicalScore
  };
}

describe('IR L1 Ranking Logic', () => {
  const makeQuote = (id: string, price: number, techScore: number | null): MockQuote => ({
    id,
    quotedPrice: price,
    technicalScore: techScore,
    rank: null,
    status: 'under_review',
  });

  describe('evaluateQuote', () => {
    it('overallScore = technicalScore (not weighted composite)', () => {
      const result = evaluateQuoteIRL1(85, 50);

      expect(result.technicalScore).toBe(85);
      expect(result.commercialScore).toBe(50);
      // Old method would give: (85*60 + 50*40)/100 = 71
      // New IR method: overallScore = technicalScore
      expect(result.overallScore).toBe(85);
      expect(result.overallScore).not.toBe(71);
    });

    it('overallScore never uses commercial score', () => {
      const r1 = evaluateQuoteIRL1(90, 10);
      const r2 = evaluateQuoteIRL1(90, 100);
      expect(r1.overallScore).toBe(r2.overallScore);
    });
  });

  describe('rankQuotes', () => {
    it('L1 = lowest price among qualified vendors', () => {
      const q1 = makeQuote('siemens', 8500000, 95);  // Highest tech, highest price
      const q2 = makeQuote('schneider', 7900000, 82); // Lowest price
      const q3 = makeQuote('abb', 8200000, 88);       // Mid price

      rankQuotesIRL1([q1, q2, q3]);

      // Schneider (cheapest) should be L1
      expect(q2.rank).toBe(1);
      expect(q2.status).toBe('shortlisted');
      // ABB (mid) should be L2
      expect(q3.rank).toBe(2);
      // Siemens (most expensive) should be L3 despite highest tech score
      expect(q1.rank).toBe(3);
    });

    it('disqualified vendor (tech < 70) gets no rank even if cheapest', () => {
      const qualified = makeQuote('vendor-a', 9000000, 85);
      const disqualified = makeQuote('vendor-b', 5000000, 60); // Much cheaper but tech < 70

      rankQuotesIRL1([qualified, disqualified]);

      expect(qualified.rank).toBe(1);
      expect(qualified.status).toBe('shortlisted');
      expect(disqualified.rank).toBe(null);
      expect(disqualified.status).toBe('under_review'); // Not changed
    });

    it('tie-break: same price, higher tech score wins', () => {
      const q1 = makeQuote('vendor-a', 8000000, 90);
      const q2 = makeQuote('vendor-b', 8000000, 75);

      rankQuotesIRL1([q1, q2]);

      expect(q1.rank).toBe(1); // Higher tech wins tie
      expect(q2.rank).toBe(2);
    });

    it('all vendors disqualified: no ranks', () => {
      const q1 = makeQuote('vendor-a', 5000000, 50);
      const q2 = makeQuote('vendor-b', 6000000, 65);

      rankQuotesIRL1([q1, q2]);

      expect(q1.rank).toBe(null);
      expect(q2.rank).toBe(null);
    });

    it('boundary: techScore = 70 qualifies, 69 does not', () => {
      const passes = makeQuote('vendor-a', 7000000, 70);
      const fails = makeQuote('vendor-b', 6000000, 69);

      rankQuotesIRL1([passes, fails]);

      expect(passes.rank).toBe(1);
      expect(fails.rank).toBe(null);
    });

    it('mixed: some qualified, some not — only qualified get ranks', () => {
      const q1 = makeQuote('v1', 10000000, 92); // Qualified, expensive
      const q2 = makeQuote('v2', 7000000, 55);  // Disqualified
      const q3 = makeQuote('v3', 8000000, 78);  // Qualified, cheapest qualified
      const q4 = makeQuote('v4', 5000000, 40);  // Disqualified, cheapest overall

      rankQuotesIRL1([q1, q2, q3, q4]);

      // q3 is cheapest among qualified => L1
      expect(q3.rank).toBe(1);
      expect(q3.status).toBe('shortlisted');
      // q1 is next qualified => L2
      expect(q1.rank).toBe(2);
      // Disqualified get no rank
      expect(q2.rank).toBe(null);
      expect(q4.rank).toBe(null);
    });

    it('single qualified vendor gets L1', () => {
      const q1 = makeQuote('v1', 10000000, 75);

      rankQuotesIRL1([q1]);

      expect(q1.rank).toBe(1);
      expect(q1.status).toBe('shortlisted');
    });

    it('real-world IR scenario: expensive high-tech vs cheap adequate', () => {
      // In old system: Siemens would win (highest weighted score)
      // In IR system: Schneider wins (lowest price, technically qualified)
      const siemens = makeQuote('siemens', 8500000, 95);
      const abb = makeQuote('abb', 8200000, 88);
      const schneider = makeQuote('schneider', 7900000, 82);

      rankQuotesIRL1([siemens, abb, schneider]);

      // Old system: L1 = Siemens (91.0 = 95*0.6 + 85*0.4)
      // IR system: L1 = Schneider (lowest price, tech >= 70)
      expect(schneider.rank).toBe(1);
      expect(abb.rank).toBe(2);
      expect(siemens.rank).toBe(3);
    });
  });
});
