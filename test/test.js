require('should');
var au = require('../index');

/*
 describe('Array', function() {
 describe('#indexOf()', function () {
 it('should return -1 when the value is not present', function () {
 [1,2,3].indexOf(5).should.be.equal(-1);
 [1,2,3].indexOf(0).should.be.equal(-1);

 });
 });
 });*/


describe('Types', function () {
    describe('string type', function () {
        it('should return correct true if type string', function () {
            var checkString = au.checkType.bind(null, 'string');
            checkString('mystring').should.have.property('correct');
            checkString('mystring')['correct'].should.be.equal(true);
            checkString(39)['correct'].should.be.equal(false);
            checkString('true')['correct'].should.be.equal(false);
        });
    });

    describe('integer type', function () {
        it('should return correct true if type integer', function () {
            var checkInteger = au.checkType.bind(null, 'integer');
            checkInteger(39).should.have.property('correct');
            checkInteger(39)['correct'].should.be.equal(true);
            checkInteger(39.83932825)['correct'].should.be.equal(false);
            checkInteger("39.83932825")['correct'].should.be.equal(false);
            checkInteger('33')['correct'].should.be.equal(true);
            checkInteger('33adsafa')['correct'].should.be.equal(false);
            checkInteger('adsafa')['correct'].should.be.equal(false);
        });
    });
    describe('float type', function () {
        it('should return correct true if type float', function () {
            var checkFloat = au.checkType.bind(null, 'float');
            checkFloat(39).should.have.property('correct');
            checkFloat(39.83932825)['correct'].should.be.equal(true);
            checkFloat("39.83932825")['correct'].should.be.equal(true);
            checkFloat(39)['correct'].should.be.equal(false);
            checkFloat('33')['correct'].should.be.equal(false);
            checkFloat('33adsafa')['correct'].should.be.equal(false);
            checkFloat('adsafa')['correct'].should.be.equal(false);
        });
    });

    describe('date type', function () {
        it('should return correct true if type date', function () {
            var checkDate = au.checkType.bind(null, 'date');
            checkDate('43').should.have.property('correct');
            checkDate(new Date().toString())['correct'].should.be.equal(true);
            checkDate(74)['correct'].should.be.equal(false);
            checkDate(new Date('33').toString())['correct'].should.be.equal(true);
            checkDate('33adsafa')['correct'].should.be.equal(false);
            checkDate('adsafa')['correct'].should.be.equal(false);
        });
    });
});
