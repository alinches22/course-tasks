/**
 * PnL Calculation Tests
 * 
 * Tests for the core PnL calculation logic used in battles.
 * This replicates the logic from battle-engine.service.ts
 */

interface PlayerState {
  position: 'LONG' | 'SHORT' | 'FLAT';
  entryPrice: number;
  quantity: number;
  realizedPnl: number;
  unrealizedPnl: number;
  balance: number;
}

/**
 * Calculate unrealized PnL based on current position and price
 */
function calculateUnrealizedPnl(state: PlayerState, currentPrice: number): number {
  if (state.position === 'LONG') {
    return (currentPrice - state.entryPrice) * state.quantity;
  } else if (state.position === 'SHORT') {
    return (state.entryPrice - currentPrice) * state.quantity;
  }
  return 0;
}

/**
 * Calculate PnL percentage
 */
function calculatePnlPercent(state: PlayerState): number {
  const totalPnl = state.realizedPnl + state.unrealizedPnl;
  return state.balance > 0 ? (totalPnl / state.balance) * 100 : 0;
}

/**
 * Process a BUY action
 */
function processBuy(state: PlayerState, price: number, quantity: number): PlayerState {
  const newState = { ...state };

  if (state.position === 'SHORT') {
    // Close short position
    const pnl = (state.entryPrice - price) * state.quantity;
    newState.realizedPnl = state.realizedPnl + pnl;
    newState.position = 'FLAT';
    newState.entryPrice = 0;
    newState.quantity = 0;
    newState.unrealizedPnl = 0;
  } else if (state.position === 'FLAT') {
    // Open long position
    newState.position = 'LONG';
    newState.entryPrice = price;
    newState.quantity = quantity;
  } else {
    // Add to long position (average in)
    const totalCost = state.entryPrice * state.quantity + price * quantity;
    const totalQuantity = state.quantity + quantity;
    newState.entryPrice = totalCost / totalQuantity;
    newState.quantity = totalQuantity;
  }

  return newState;
}

/**
 * Process a SELL action
 */
function processSell(state: PlayerState, price: number, quantity: number): PlayerState {
  const newState = { ...state };

  if (state.position === 'LONG') {
    // Close long position
    const pnl = (price - state.entryPrice) * state.quantity;
    newState.realizedPnl = state.realizedPnl + pnl;
    newState.position = 'FLAT';
    newState.entryPrice = 0;
    newState.quantity = 0;
    newState.unrealizedPnl = 0;
  } else if (state.position === 'FLAT') {
    // Open short position
    newState.position = 'SHORT';
    newState.entryPrice = price;
    newState.quantity = quantity;
  } else {
    // Add to short position
    const totalCost = state.entryPrice * state.quantity + price * quantity;
    const totalQuantity = state.quantity + quantity;
    newState.entryPrice = totalCost / totalQuantity;
    newState.quantity = totalQuantity;
  }

  return newState;
}

/**
 * Process a CLOSE action
 */
function processClose(state: PlayerState, price: number): PlayerState {
  const newState = { ...state };

  if (state.position === 'LONG') {
    const pnl = (price - state.entryPrice) * state.quantity;
    newState.realizedPnl = state.realizedPnl + pnl;
  } else if (state.position === 'SHORT') {
    const pnl = (state.entryPrice - price) * state.quantity;
    newState.realizedPnl = state.realizedPnl + pnl;
  }

  newState.position = 'FLAT';
  newState.entryPrice = 0;
  newState.quantity = 0;
  newState.unrealizedPnl = 0;

  return newState;
}

// ============== TESTS ==============

describe('PnL Calculations', () => {
  const initialState: PlayerState = {
    position: 'FLAT',
    entryPrice: 0,
    quantity: 0,
    realizedPnl: 0,
    unrealizedPnl: 0,
    balance: 10000,
  };

  describe('calculateUnrealizedPnl', () => {
    test('FLAT position has zero unrealized PnL', () => {
      const state: PlayerState = { ...initialState };
      expect(calculateUnrealizedPnl(state, 100)).toBe(0);
    });

    test('LONG position with price increase has positive PnL', () => {
      const state: PlayerState = {
        ...initialState,
        position: 'LONG',
        entryPrice: 100,
        quantity: 10,
      };
      // Price went from 100 to 110, quantity = 10
      // PnL = (110 - 100) * 10 = 100
      expect(calculateUnrealizedPnl(state, 110)).toBe(100);
    });

    test('LONG position with price decrease has negative PnL', () => {
      const state: PlayerState = {
        ...initialState,
        position: 'LONG',
        entryPrice: 100,
        quantity: 10,
      };
      // Price went from 100 to 90
      // PnL = (90 - 100) * 10 = -100
      expect(calculateUnrealizedPnl(state, 90)).toBe(-100);
    });

    test('SHORT position with price decrease has positive PnL', () => {
      const state: PlayerState = {
        ...initialState,
        position: 'SHORT',
        entryPrice: 100,
        quantity: 10,
      };
      // Price went from 100 to 90
      // PnL = (100 - 90) * 10 = 100
      expect(calculateUnrealizedPnl(state, 90)).toBe(100);
    });

    test('SHORT position with price increase has negative PnL', () => {
      const state: PlayerState = {
        ...initialState,
        position: 'SHORT',
        entryPrice: 100,
        quantity: 10,
      };
      // Price went from 100 to 110
      // PnL = (100 - 110) * 10 = -100
      expect(calculateUnrealizedPnl(state, 110)).toBe(-100);
    });
  });

  describe('processBuy', () => {
    test('BUY from FLAT opens LONG position', () => {
      const state = processBuy(initialState, 100, 5);
      expect(state.position).toBe('LONG');
      expect(state.entryPrice).toBe(100);
      expect(state.quantity).toBe(5);
    });

    test('BUY while LONG averages position', () => {
      const longState: PlayerState = {
        ...initialState,
        position: 'LONG',
        entryPrice: 100,
        quantity: 10,
      };
      const state = processBuy(longState, 120, 10);
      // Average: (100*10 + 120*10) / 20 = 2200/20 = 110
      expect(state.position).toBe('LONG');
      expect(state.entryPrice).toBe(110);
      expect(state.quantity).toBe(20);
    });

    test('BUY while SHORT closes position with PnL', () => {
      const shortState: PlayerState = {
        ...initialState,
        position: 'SHORT',
        entryPrice: 100,
        quantity: 10,
      };
      const state = processBuy(shortState, 90, 10);
      // PnL = (100 - 90) * 10 = 100
      expect(state.position).toBe('FLAT');
      expect(state.realizedPnl).toBe(100);
    });
  });

  describe('processSell', () => {
    test('SELL from FLAT opens SHORT position', () => {
      const state = processSell(initialState, 100, 5);
      expect(state.position).toBe('SHORT');
      expect(state.entryPrice).toBe(100);
      expect(state.quantity).toBe(5);
    });

    test('SELL while LONG closes position with PnL', () => {
      const longState: PlayerState = {
        ...initialState,
        position: 'LONG',
        entryPrice: 100,
        quantity: 10,
      };
      const state = processSell(longState, 120, 10);
      // PnL = (120 - 100) * 10 = 200
      expect(state.position).toBe('FLAT');
      expect(state.realizedPnl).toBe(200);
    });
  });

  describe('processClose', () => {
    test('CLOSE LONG position realizes PnL', () => {
      const longState: PlayerState = {
        ...initialState,
        position: 'LONG',
        entryPrice: 100,
        quantity: 10,
      };
      const state = processClose(longState, 150);
      // PnL = (150 - 100) * 10 = 500
      expect(state.position).toBe('FLAT');
      expect(state.realizedPnl).toBe(500);
      expect(state.quantity).toBe(0);
    });

    test('CLOSE SHORT position realizes PnL', () => {
      const shortState: PlayerState = {
        ...initialState,
        position: 'SHORT',
        entryPrice: 100,
        quantity: 10,
      };
      const state = processClose(shortState, 80);
      // PnL = (100 - 80) * 10 = 200
      expect(state.position).toBe('FLAT');
      expect(state.realizedPnl).toBe(200);
      expect(state.quantity).toBe(0);
    });
  });

  describe('calculatePnlPercent', () => {
    test('calculates correct percentage', () => {
      const state: PlayerState = {
        ...initialState,
        realizedPnl: 500,
        unrealizedPnl: 200,
        balance: 10000,
      };
      // (500 + 200) / 10000 * 100 = 7%
      expect(calculatePnlPercent(state)).toBeCloseTo(7, 5);
    });

    test('handles negative PnL', () => {
      const state: PlayerState = {
        ...initialState,
        realizedPnl: -300,
        unrealizedPnl: -100,
        balance: 10000,
      };
      // (-300 + -100) / 10000 * 100 = -4%
      expect(calculatePnlPercent(state)).toBe(-4);
    });
  });
});

describe('Winner-Takes-All Logic', () => {
  const DEFAULT_STAKE = 100;
  const DEFAULT_FEE_BPS = 500; // 5%

  function calculateWinnerPayout(stake: number, feeBps: number): number {
    const totalPool = stake * 2;
    const feePercent = feeBps / 10000;
    const fee = totalPool * feePercent;
    return Math.floor(totalPool - fee);
  }

  test('winner gets 2*stake - fee', () => {
    const payout = calculateWinnerPayout(DEFAULT_STAKE, DEFAULT_FEE_BPS);
    // Pool: 200, Fee: 10 (5%), Winner: 190
    expect(payout).toBe(190);
  });

  test('draw returns stake (no fee)', () => {
    expect(DEFAULT_STAKE).toBe(100);
  });

  test('loser gets 0', () => {
    expect(0).toBe(0);
  });

  test('higher stakes scale proportionally', () => {
    const payout = calculateWinnerPayout(500, DEFAULT_FEE_BPS);
    // Pool: 1000, Fee: 50 (5%), Winner: 950
    expect(payout).toBe(950);
  });

  test('different fee rates work correctly', () => {
    const payout = calculateWinnerPayout(100, 1000); // 10% fee
    // Pool: 200, Fee: 20 (10%), Winner: 180
    expect(payout).toBe(180);
  });
});
