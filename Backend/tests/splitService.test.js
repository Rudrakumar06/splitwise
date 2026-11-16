const { money, calculateShares } = require('../services/splitService');
const { fail } = require('../utils/api');

describe('money()', () => {
  it('rounds to 2 decimal places', () => {
    expect(money(1.004)).toBe(1);
    expect(money(12.345)).toBe(12.35);
    expect(money(0.1)).toBe(0.1);
    expect(money(12.344)).toBe(12.34);
  });

  it('handles string and integer inputs', () => {
    expect(money('10.5')).toBe(10.5);
    expect(money(10)).toBe(10);
  });
});

describe('calculateShares() - EQUAL split', () => {
  const users = ['u1', 'u2', 'u3'];

  it('distributes evenly and covers the total', () => {
    const shares = calculateShares(10, users, 'EQUAL');
    const total = shares.reduce((s, x) => money(s + x.shareAmount), 0);
    expect(total).toBe(10);
    expect(shares.length).toBe(3);
  });

  it('distributes the remainder cent-by-cent', () => {
    const shares = calculateShares(1, users, 'EQUAL');
    // 100 cents / 3 = 33 base, 1 remainder -> first person gets 34
    expect(shares[0].shareAmount).toBe(0.34);
    expect(shares[1].shareAmount).toBe(0.33);
    expect(shares[2].shareAmount).toBe(0.33);
  });

  it('rejects custom amounts with an EQUAL split', () => {
    expect(() => calculateShares(10, users, 'EQUAL', [{ user: 'u1', amount: 5 }])).toThrow();
  });
});

describe('calculateShares() - CUSTOM split', () => {
  const users = ['u1', 'u2', 'u3'];

  it('uses custom amounts and distributes the remainder equally', () => {
    const shares = calculateShares(
      10,
      users,
      'CUSTOM',
      [{ user: 'u1', amount: 5 }],
    );
    const u1 = shares.find(s => s.user === 'u1');
    // remaining 5 split between u2 and u3 -> 2.50 each
    const others = shares.filter(s => s.user !== 'u1');
    expect(u1.shareAmount).toBe(5);
    expect(others[0].shareAmount).toBe(2.5);
    expect(others[1].shareAmount).toBe(2.5);
    expect(u1.isCustomAmount).toBe(true);
  });

  it('rejects custom amounts exceeding the total', () => {
    expect(() => calculateShares(10, users, 'CUSTOM', [{ user: 'u1', amount: 15 }])).toThrow();
  });

  it('rejects duplicate custom users', () => {
    expect(() => calculateShares(
      10, users, 'CUSTOM',
      [{ user: 'u1', amount: 5 }, { user: 'u1', amount: 2 }],
    )).toThrow();
  });

  it('rejects custom users not in the participant list', () => {
    expect(() => calculateShares(10, users, 'CUSTOM', [{ user: 'ghost', amount: 5 }])).toThrow();
  });
});

describe('calculateShares() - validation', () => {
  it('rejects zero or negative totals', () => {
    expect(() => calculateShares(0, ['u1'], 'EQUAL')).toThrow();
    expect(() => calculateShares(-5, ['u1'], 'EQUAL')).toThrow();
  });

  it('rejects empty participant lists', () => {
    expect(() => calculateShares(10, [], 'EQUAL')).toThrow();
  });

  it('rejects an invalid split type', () => {
    expect(() => calculateShares(10, ['u1'], 'WEIRD')).toThrow();
  });
});