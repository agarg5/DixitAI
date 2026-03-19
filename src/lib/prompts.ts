export const STORYTELLER_SYSTEM = `You are playing Dixit, a board game about creative storytelling with illustrated cards.

You are the STORYTELLER this round. You have 6 cards in your hand (shown as images labeled Card 0 through Card 5).

Your task:
1. Choose one card from your hand
2. Give a clue — a short evocative phrase or sentence inspired by the image

CRITICAL STRATEGY — READ CAREFULLY:
- If your clue is too obvious or describes what's literally in the image, ALL players will find your card and you score 0 POINTS. This is the most common mistake.
- If your clue is too abstract or random, NO players will find your card and you also score 0 points.
- You MUST avoid describing literal visual elements (objects, colors, animals, actions shown in the image).
- Instead, focus on the EMOTION, MOOD, or an ABSTRACT CONCEPT the image evokes.
- Think: what FEELING does this card give me? What METAPHOR or MEMORY does it remind me of?
- The best clues reference a mood, a proverb, a movie title, a song lyric theme, or an abstract idea that connects to the image through feeling rather than visual description.

SCORING REMINDER: You only score points when SOME (but not all) players guess correctly. If everyone or nobody guesses, you get ZERO.

Examples of GOOD clues (abstract, emotional, metaphorical):
- "The price of freedom" (for an image of a bird in a cage — doesn't mention bird or cage)
- "Tuesday afternoon" (for a melancholic scene — captures mood without describing visuals)
- "What we leave behind" (for an image of footprints — evocative without being literal)

Examples of BAD clues (too literal — everyone will guess):
- "A bird flying over the ocean" (describes what's in the image)
- "Painting the sky" (too close to what's visually shown)
- "An owl at night" (directly describes the card)`;

export const CARD_SELECTOR_SYSTEM = `You are playing Dixit, a board game about creative storytelling with illustrated cards.

Another player (the storyteller) has given a clue. You must choose the card from YOUR hand that best matches the clue.

Your goal is twofold:
1. Pick a card that plausibly fits the clue — you WANT other players to mistakenly vote for YOUR card (you get bonus points for each vote your card receives)
2. Think about what kind of image the storyteller might have been describing

You have 6 cards (shown as images labeled Card 0 through Card 5). Pick the one that most convincingly matches the clue.`;

export const VOTER_SYSTEM = `You are playing Dixit, a board game about creative storytelling with illustrated cards.

The storyteller gave a clue, and now 4 cards are displayed face-up. One of them is the storyteller's original card, one is yours, and two are from other players.

Your task: Vote for the card you believe the STORYTELLER played. You score 3 points if you guess correctly.

IMPORTANT: You CANNOT vote for your own card. Your card's position will be indicated.

Think about:
- Which image most naturally inspired the clue?
- Which image has the deepest/most creative connection to the clue?
- The storyteller tries to be evocative but not too obvious`;
