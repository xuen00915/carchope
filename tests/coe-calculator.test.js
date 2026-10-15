const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  calculateFlatRateLoan,
  calculateRemainingCoeValue,
  calculateRenewal,
  loadGovernmentRates,
  parseLatestBiddingPremiums,
  parseLatestPqpRates,
} = require('../coe-calculator.js');

test('flat-rate loan subtracts the down payment before calculating interest', () => {
  assert.deepEqual(
    calculateFlatRateLoan({
      price: 100000,
      downPayment: 20000,
      annualInterestRate: 2.5,
      years: 5,
    }),
    {
      financedAmount: 80000,
      totalInterest: 10000,
      totalRepayment: 90000,
      monthlyInstalment: 1500,
    },
  );
});

test('flat-rate loan rejects a down payment greater than the price', () => {
  assert.throws(
    () => calculateFlatRateLoan({ price: 50000, downPayment: 60000, annualInterestRate: 2.5, years: 5 }),
    /down payment/i,
  );
});

test('five-year renewal uses half the PQP rounded up to the nearest dollar', () => {
  assert.deepEqual(
    calculateRenewal({ pqp: 128715, renewalYears: 5, downPayment: 10000, annualInterestRate: 3, loanYears: 5 }),
    {
      renewalCost: 64358,
      financedAmount: 54358,
      totalInterest: 8153.7,
      totalRepayment: 62511.7,
      monthlyInstalment: 1041.86,
    },
  );
});

test('ten-year renewal uses the full PQP', () => {
  const result = calculateRenewal({
    pqp: 128715,
    renewalYears: 10,
    downPayment: 28715,
    annualInterestRate: 2,
    loanYears: 5,
  });

  assert.equal(result.renewalCost, 128715);
  assert.equal(result.financedAmount, 100000);
});

test('remaining COE value is prorated by the exact unused portion of its validity', () => {
  assert.deepEqual(
    calculateRemainingCoeValue({
      coePaid: 100000,
      registrationDate: '2020-01-01',
      expiryDate: '2020-01-11',
      asOfDate: '2020-01-06',
    }),
    {
      totalDays: 10,
      remainingDays: 5,
      remainingPercentage: 50,
      remainingValue: 50000,
    },
  );
});

test('remaining COE value becomes zero after expiry', () => {
  const result = calculateRemainingCoeValue({
    coePaid: 100000,
    registrationDate: '2020-01-01',
    expiryDate: '2020-01-11',
    asOfDate: '2020-02-01',
  });

  assert.equal(result.remainingDays, 0);
  assert.equal(result.remainingValue, 0);
});

test('latest bidding premiums select the newest month and exercise for all categories', () => {
  const result = parseLatestBiddingPremiums([
    { month: '2026-09', bidding_no: '2', vehicle_class: 'Category A', premium: '131890' },
    { month: '2026-10', bidding_no: '1', vehicle_class: 'Category A', premium: '130001' },
    { month: '2026-10', bidding_no: '1', vehicle_class: 'Category B', premium: '130100' },
    { month: '2026-10', bidding_no: '1', vehicle_class: 'Category C', premium: '91889' },
    { month: '2026-10', bidding_no: '1', vehicle_class: 'Category D', premium: '11012' },
    { month: '2026-10', bidding_no: '1', vehicle_class: 'Category E', premium: '137000' },
  ]);

  assert.deepEqual(result, {
    period: '2026-10',
    biddingNo: 1,
    rates: { A: 130001, B: 130100, C: 91889, D: 11012, E: 137000 },
  });
});

test('latest PQP parser maps official series names to renewal categories A to D', () => {
  const result = parseLatestPqpRates(
    [
      { DataSeries: 'Cars Up To 1600cc And 97kW, Prevailing Quota Premium, 2nd Bidding', '2026Sep': '128715' },
      { DataSeries: 'Cars Above 1600cc Or 97kW, Prevailing Quota Premium, 2nd Bidding', '2026Sep': '131616' },
      { DataSeries: 'Goods Vehicles & Buses, Prevailing Quota Premium, 2nd Bidding', '2026Sep': '92614' },
      { DataSeries: 'Motorcycles, Prevailing Quota Premium, 2nd Bidding', '2026Sep': '11161' },
      { DataSeries: 'Open Category, Quota Premium, 2nd Bidding', '2026Sep': '137000' },
    ],
    [{ id: 'DataSeries' }, { id: '2026Sep' }, { id: '2026Aug' }],
  );

  assert.deepEqual(result, {
    period: '2026Sep',
    rates: { A: 128715, B: 131616, C: 92614, D: 11161 },
  });
});

test('government rate loader returns both latest bidding premiums and renewal PQP', async () => {
  const responses = [
    {
      success: true,
      result: {
        fields: [
          { type: 'text', id: 'month' },
          { type: 'text', id: 'bidding_no' },
          { type: 'text', id: 'vehicle_class' },
          { type: 'text', id: 'premium' },
        ],
        records: [
          { month: '2026-10', bidding_no: '1', vehicle_class: 'Category A', premium: '130001' },
          { month: '2026-10', bidding_no: '1', vehicle_class: 'Category B', premium: '130100' },
          { month: '2026-10', bidding_no: '1', vehicle_class: 'Category C', premium: '91889' },
          { month: '2026-10', bidding_no: '1', vehicle_class: 'Category D', premium: '11012' },
          { month: '2026-10', bidding_no: '1', vehicle_class: 'Category E', premium: '137000' },
        ],
      },
    },
    {
      success: true,
      result: {
        fields: [{ type: 'text', id: 'DataSeries' }, { type: 'numeric', id: '2026Sep' }],
        records: [
          { DataSeries: 'Cars Up To 1600cc And 97kW, Prevailing Quota Premium, 2nd Bidding', '2026Sep': '128715' },
          { DataSeries: 'Cars Above 1600cc Or 97kW, Prevailing Quota Premium, 2nd Bidding', '2026Sep': '131616' },
          { DataSeries: 'Goods Vehicles & Buses, Prevailing Quota Premium, 2nd Bidding', '2026Sep': '92614' },
          { DataSeries: 'Motorcycles, Prevailing Quota Premium, 2nd Bidding', '2026Sep': '11161' },
        ],
      },
    },
  ];
  const fakeFetch = async () => ({
    ok: true,
    json: async () => responses.shift(),
  });

  assert.deepEqual(await loadGovernmentRates(fakeFetch), {
    bidding: {
      period: '2026-10',
      biddingNo: 1,
      rates: { A: 130001, B: 130100, C: 91889, D: 11012, E: 137000 },
    },
    pqp: {
      period: '2026Sep',
      rates: { A: 128715, B: 131616, C: 92614, D: 11161 },
    },
  });
});
