(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.CoeCalculator = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;
  var BIDDING_DATASET = 'd_69b3380ad7e51aff3a7dcc84eba52b8a';
  var PQP_DATASET = 'd_22094bf608253d36c0c63b52d852dd6e';

  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function positiveNumber(value, label, allowZero) {
    var number = Number(value);
    if (!Number.isFinite(number) || (allowZero ? number < 0 : number <= 0)) {
      throw new RangeError(label + ' must be ' + (allowZero ? 'zero or greater' : 'greater than zero'));
    }
    return number;
  }

  function calculateFlatRateLoan(options) {
    var price = positiveNumber(options.price, 'Price');
    var downPayment = positiveNumber(options.downPayment || 0, 'Down payment', true);
    var annualInterestRate = positiveNumber(options.annualInterestRate || 0, 'Interest rate', true);
    var years = positiveNumber(options.years, 'Loan tenure');

    if (downPayment > price) throw new RangeError('Down payment cannot be greater than the price');

    var financedAmount = price - downPayment;
    var totalInterest = financedAmount * (annualInterestRate / 100) * years;
    var totalRepayment = financedAmount + totalInterest;

    return {
      financedAmount: roundMoney(financedAmount),
      totalInterest: roundMoney(totalInterest),
      totalRepayment: roundMoney(totalRepayment),
      monthlyInstalment: roundMoney(totalRepayment / (years * 12)),
    };
  }

  function calculateRenewal(options) {
    var pqp = positiveNumber(options.pqp, 'PQP');
    var renewalYears = Number(options.renewalYears);
    if (renewalYears !== 5 && renewalYears !== 10) {
      throw new RangeError('Renewal tenure must be 5 or 10 years');
    }

    var renewalCost = renewalYears === 5 ? Math.ceil(pqp / 2) : pqp;
    var loan = calculateFlatRateLoan({
      price: renewalCost,
      downPayment: options.downPayment,
      annualInterestRate: options.annualInterestRate,
      years: options.loanYears,
    });

    return Object.assign({ renewalCost: renewalCost }, loan);
  }

  function parseDate(value, label) {
    var timestamp = Date.parse(value + 'T00:00:00Z');
    if (!Number.isFinite(timestamp)) throw new RangeError(label + ' must be a valid date');
    return timestamp;
  }

  function calculateRemainingCoeValue(options) {
    var coePaid = positiveNumber(options.coePaid, 'COE paid');
    var registration = parseDate(options.registrationDate, 'Registration date');
    var expiry = parseDate(options.expiryDate, 'Expiry date');
    var asOf = parseDate(options.asOfDate, 'As-of date');
    if (expiry <= registration) throw new RangeError('Expiry date must be after the registration date');

    var totalDays = Math.round((expiry - registration) / DAY_MS);
    var remainingDays = Math.max(0, Math.min(totalDays, Math.round((expiry - asOf) / DAY_MS)));
    var remainingPercentage = (remainingDays / totalDays) * 100;

    return {
      totalDays: totalDays,
      remainingDays: remainingDays,
      remainingPercentage: roundMoney(remainingPercentage),
      remainingValue: roundMoney(coePaid * remainingDays / totalDays),
    };
  }

  function categoryLetter(vehicleClass) {
    var match = String(vehicleClass || '').match(/Category\s+([A-E])/i);
    return match ? match[1].toUpperCase() : null;
  }

  function parseLatestBiddingPremiums(records) {
    if (!Array.isArray(records) || !records.length) throw new Error('No bidding premium records were returned');

    var latestKey = records.reduce(function (latest, record) {
      var key = String(record.month || '') + '-' + String(record.bidding_no || '').padStart(2, '0');
      return key > latest ? key : latest;
    }, '');
    var parts = latestKey.match(/^(\d{4}-\d{2})-(\d+)$/);
    var rates = {};

    records.forEach(function (record) {
      var key = String(record.month || '') + '-' + String(record.bidding_no || '').padStart(2, '0');
      var category = categoryLetter(record.vehicle_class);
      if (key === latestKey && category) rates[category] = positiveNumber(record.premium, 'Premium');
    });

    if (!parts || Object.keys(rates).length < 5) throw new Error('Latest bidding premium data is incomplete');
    return { period: parts[1], biddingNo: Number(parts[2]), rates: rates };
  }

  function pqpCategory(seriesName) {
    var name = String(seriesName || '');
    if (!/Prevailing Quota Premium/i.test(name)) return null;
    if (/Cars Up To 1600cc/i.test(name)) return 'A';
    if (/Cars Above 1600cc/i.test(name)) return 'B';
    if (/Goods Vehicles & Buses/i.test(name)) return 'C';
    if (/Motorcycles/i.test(name)) return 'D';
    return null;
  }

  function parseLatestPqpRates(records, fields) {
    if (!Array.isArray(records) || !Array.isArray(fields)) throw new Error('PQP data is unavailable');
    var periodField = fields.map(function (field) { return field.id; }).find(function (id) {
      return /^\d{4}[A-Z][a-z]{2}$/.test(id);
    });
    if (!periodField) throw new Error('PQP period is unavailable');

    var rates = {};
    records.forEach(function (record) {
      var category = pqpCategory(record.DataSeries);
      if (category && record[periodField] !== null && record[periodField] !== '') {
        rates[category] = positiveNumber(record[periodField], 'PQP');
      }
    });

    if (Object.keys(rates).length < 4) throw new Error('Latest PQP data is incomplete');
    return { period: periodField, rates: rates };
  }

  async function fetchDataset(fetcher, url) {
    var response = await fetcher(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Government data service returned HTTP ' + response.status);
    var payload = await response.json();
    if (!payload.success || !payload.result) throw new Error('Government data service returned an invalid response');
    return payload.result;
  }

  async function loadGovernmentRates(fetcher) {
    var request = fetcher || fetch;
    var base = 'https://data.gov.sg/api/action/datastore_search?resource_id=';
    var results = await Promise.all([
      fetchDataset(request, base + BIDDING_DATASET + '&limit=10&sort=month%20desc%2Cbidding_no%20desc'),
      fetchDataset(request, base + PQP_DATASET + '&limit=500'),
    ]);

    return {
      bidding: parseLatestBiddingPremiums(results[0].records),
      pqp: parseLatestPqpRates(results[1].records, results[1].fields),
    };
  }

  function formatCurrency(value) {
    return 'S$' + Number(value).toLocaleString('en-SG', {
      minimumFractionDigits: Number(value) % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }

  function formatPqpPeriod(value) {
    var match = String(value).match(/^(\d{4})([A-Z][a-z]{2})$/);
    if (!match) return value;
    var month = new Date(match[1] + '-' + match[2] + '-01');
    return Number.isNaN(month.getTime()) ? value : month.toLocaleDateString('en-SG', { month: 'long', year: 'numeric' });
  }

  function localIsoDate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function setResult(container, name, value) {
    var target = container.querySelector('[data-result="' + name + '"]');
    if (target) target.textContent = value;
  }

  function setError(id, error) {
    var target = document.getElementById(id);
    if (target) target.textContent = error ? error.message : '';
  }

  function initializeTabs() {
    var tabs = Array.from(document.querySelectorAll('[data-calculator-tab]'));
    var panels = Array.from(document.querySelectorAll('[data-calculator-panel]'));
    if (!tabs.length) return;

    function activate(tab, moveFocus) {
      tabs.forEach(function (candidate) {
        var active = candidate === tab;
        candidate.setAttribute('aria-selected', active ? 'true' : 'false');
        candidate.tabIndex = active ? 0 : -1;
      });
      panels.forEach(function (panel) {
        panel.hidden = panel.dataset.calculatorPanel !== tab.dataset.calculatorTab;
      });
      if (moveFocus) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { activate(tab, false); });
      tab.addEventListener('keydown', function (event) {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        var nextIndex = index;
        if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        activate(tabs[nextIndex], true);
      });
    });
  }

  function initializeForms(rateState) {
    var renewalForm = document.getElementById('renewal-form');
    var remainingForm = document.getElementById('remaining-form');
    var affordabilityForm = document.getElementById('affordability-form');
    if (!renewalForm || !remainingForm || !affordabilityForm) return;

    var renewalCategory = document.getElementById('renewal-category');
    var renewalPqp = document.getElementById('renewal-pqp');
    var affordabilityCategory = document.getElementById('affordability-category');
    var affordabilityCoe = document.getElementById('affordability-coe');

    rateState.apply = function () {
      if (rateState.pqp) renewalPqp.value = rateState.pqp.rates[renewalCategory.value] || '';
      if (rateState.bidding) affordabilityCoe.value = rateState.bidding.rates[affordabilityCategory.value] || '';
    };
    renewalCategory.addEventListener('change', rateState.apply);
    affordabilityCategory.addEventListener('change', rateState.apply);

    renewalForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setError('renewal-error');
      try {
        var result = calculateRenewal({
          pqp: renewalPqp.value,
          renewalYears: renewalForm.elements['renewal-years'].value,
          downPayment: document.getElementById('renewal-down').value,
          annualInterestRate: document.getElementById('renewal-interest').value,
          loanYears: document.getElementById('renewal-loan-years').value,
        });
        var results = document.getElementById('renewal-results');
        setResult(results, 'monthly', formatCurrency(result.monthlyInstalment));
        setResult(results, 'cost', formatCurrency(result.renewalCost));
        setResult(results, 'financed', formatCurrency(result.financedAmount));
        setResult(results, 'interest', formatCurrency(result.totalInterest));
        setResult(results, 'repayment', formatCurrency(result.totalRepayment));
      } catch (error) {
        setError('renewal-error', error);
      }
    });

    var today = new Date();
    var registered = new Date(today.getFullYear() - 9, today.getMonth(), today.getDate());
    var expiry = new Date(registered.getFullYear() + 10, registered.getMonth(), registered.getDate());
    document.getElementById('remaining-registration').value = localIsoDate(registered);
    document.getElementById('remaining-expiry').value = localIsoDate(expiry);
    document.getElementById('remaining-as-of').value = localIsoDate(today);

    remainingForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setError('remaining-error');
      try {
        var result = calculateRemainingCoeValue({
          coePaid: document.getElementById('remaining-paid').value,
          registrationDate: document.getElementById('remaining-registration').value,
          expiryDate: document.getElementById('remaining-expiry').value,
          asOfDate: document.getElementById('remaining-as-of').value,
        });
        var results = document.getElementById('remaining-results');
        setResult(results, 'value', formatCurrency(result.remainingValue));
        setResult(results, 'percentage', result.remainingPercentage.toLocaleString('en-SG', { maximumFractionDigits: 2 }) + '%');
        setResult(results, 'days', result.remainingDays.toLocaleString('en-SG'));
        setResult(results, 'total-days', result.totalDays.toLocaleString('en-SG') + ' days');
      } catch (error) {
        setError('remaining-error', error);
      }
    });

    affordabilityForm.addEventListener('submit', function (event) {
      event.preventDefault();
      setError('affordability-error');
      try {
        var totalPrice = positiveNumber(document.getElementById('affordability-price').value, 'Vehicle price')
          + positiveNumber(affordabilityCoe.value, 'COE premium');
        var result = calculateFlatRateLoan({
          price: totalPrice,
          downPayment: document.getElementById('affordability-down').value,
          annualInterestRate: document.getElementById('affordability-interest').value,
          years: document.getElementById('affordability-years').value,
        });
        var results = document.getElementById('affordability-results');
        setResult(results, 'monthly', formatCurrency(result.monthlyInstalment));
        setResult(results, 'total-price', formatCurrency(totalPrice));
        setResult(results, 'financed', formatCurrency(result.financedAmount));
        setResult(results, 'interest', formatCurrency(result.totalInterest));
        setResult(results, 'repayment', formatCurrency(result.totalRepayment));
      } catch (error) {
        setError('affordability-error', error);
      }
    });
  }

  async function initializePage() {
    if (!document.querySelector('.calculator-page')) return;
    initializeTabs();
    var rateState = { bidding: null, pqp: null, apply: function () {} };
    initializeForms(rateState);
    var status = document.getElementById('rate-status');

    try {
      var rates = await loadGovernmentRates();
      rateState.bidding = rates.bidding;
      rateState.pqp = rates.pqp;
      rateState.apply();
      Object.keys(rates.bidding.rates).forEach(function (category) {
        var target = document.querySelector('[data-rate="' + category + '"]');
        if (target) target.textContent = formatCurrency(rates.bidding.rates[category]);
      });
      document.getElementById('bidding-period').textContent = rates.bidding.period + ' / bidding exercise ' + rates.bidding.biddingNo;
      document.getElementById('pqp-period').textContent = 'Official PQP period: ' + formatPqpPeriod(rates.pqp.period);
      status.textContent = 'Official rates updated from data.gov.sg';
    } catch (error) {
      status.textContent = 'Live rates unavailable — enter the COE or PQP manually';
      document.getElementById('bidding-period').textContent = 'Manual rate entry available below';
      document.getElementById('pqp-period').textContent = 'Official PQP unavailable. Enter the current PQP manually.';
      document.getElementById('renewal-pqp').placeholder = 'Enter current PQP';
      document.getElementById('affordability-coe').placeholder = 'Enter current COE premium';
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializePage);
    else initializePage();
  }

  return {
    calculateFlatRateLoan: calculateFlatRateLoan,
    calculateRemainingCoeValue: calculateRemainingCoeValue,
    calculateRenewal: calculateRenewal,
    initializePage: initializePage,
    loadGovernmentRates: loadGovernmentRates,
    parseLatestBiddingPremiums: parseLatestBiddingPremiums,
    parseLatestPqpRates: parseLatestPqpRates,
  };
});
