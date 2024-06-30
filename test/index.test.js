var app = require('../index.js');
var expect = require('expect.js');

it('should return yyyy-mm-dd for date format', function() {
    expect(app._test.formatDate(new Date('2023-03-14'))).to.equal('2023-03-14');
});

it('should get start of week date', function() {
    expect(app._test.getStartWeekDate(new Date('2024-06-28'))).to.equal('2024-06-24');
});

it('should get end of week date', function() {
    expect(app._test.getEndWeekDate(new Date('2024-06-28'))).to.equal('2024-06-30');
});

it('calculate fee for natural user according to available free charge limit, if limit is smaller then amount', function() {
    expect(app._test.calculateFeeNaturalUser(1000, 3000)).to.equal(6);
});

it('calculate fee for natural user according to available free charge limit, if limit is larger then amount', function() {
    expect(app._test.calculateFeeNaturalUser(1000, 500)).to.equal(0);
});

it('calculate fee for cash in operations when potential fee is smaller than 5 EUR', function() {
    expect(app._test.calculateCashInFee(2000)).to.equal(0.6);
});

it('calculate fee for cash in operations when potential fee is larger than 5 EUR', function() {
    expect(app._test.calculateCashInFee(2000000000)).to.equal(5);
});

it('should round decimals to Eurocents according to test task requirements', function() {
    expect(app._test.roundFeeValue(14.3423434)).to.equal('14.35');
});

