"use strict";
var debug = require('debug')('audoku');


var au = {
    doku: function (config, req, res, next) {

        function audoku(config, req, res, next) {

            var params = req.params || {};
            var getReport = false;

            var getHelp = false;

            var headers = req['headers'] || {};

            var fields = req.query || {};

            var cHeaders = config['headers'] || {};
            var cFields = config['fields'] || {};
            var cParams = config['params'] || {};

            var label = 'audoku';

            var totErrors = 0, totWarnings = 0;
            var errors = {}, warnings = {};

            var pAudoku = {
                description: 'Set the audoku mode as help or report',
                type: 'string',
                required: false
            };

            cHeaders[label] = pAudoku;
            cFields[label] = pAudoku;
            cParams[label] = pAudoku;

            /*
             cHeaders[label]['alternatives'] = ['fields.' + label, 'params.' + label];
             cFields[label]['alternatives'] = ['headers.' + label, 'params.' + label];
             cParams[label]['alternatives'] = ['headers.' + label, 'fields.' + label];

             */

            var inputs = {
                'headers': {
                    'conf': cHeaders,
                    'inputs': headers
                },
                'params': {
                    'conf': cParams,
                    'inputs': params
                },
                'fields': {
                    'conf': cFields,
                    'inputs': fields
                }
            };


            for (var el in inputs) {
                debug(el)
                var conf = inputs[el].conf;
                var elputs = inputs[el].inputs;

                debug('-------------------------------------------');
                debug(elputs);
                if (elputs && elputs.hasOwnProperty(label)){
                    if (elputs && elputs.hasOwnProperty(label) && elputs[label] === 'help')
                        getHelp = true;
                    else if (elputs[label] === 'report')
                        getReport = true;
                    else if ( !(config && config.hasOwnProperty('options') &&  config.options.hasOwnProperty('raiseOnError') && config.options['raiseOnError'])){
                        next();
                        return;
                    }
                }


            }

            if (getHelp) {
                var help = config;
                delete help['options'];
                return res.send(help);
            }



            //else go for validation
            debug('report');

            var report = {
                'fullurl': req.protocol + '://' + req.get('host') + req.originalUrl
                , 'url': req.originalUrl
                , 'report':{
                  inputs : {'headers': {}, 'fields': {}, 'params': {}}
                }
            };

            debug(report.report)


            for (var el in inputs) {
                var conf = inputs[el].conf;
                var elputs = inputs[el].inputs;
                var clabel = el;
                var elreport = report.report.inputs[clabel];
                warnings[el] = {};
                errors[el] = {};
                debug(warnings);

                for (var i in conf) {
                    if (elputs && elputs.hasOwnProperty(i)) {
                        elreport[i] = au.checkValidity(conf[i], elputs[i]);  // keep results for  validity report
                        if (!elreport[i].type.correct  ){
                            errors[el][i] = elreport[i];
                            errors[el][i].message = "Wrong type"
                            totErrors++;
                            delete elreport[i];
                        }

                        delete elputs[i];
                    }
                    else if (conf[i].required) {
                        errors[el][i] = {'message': el.capitalizeFirstLetter() + ' not found'}
                        totErrors++

                        //TODO check for alternatives

                    }
                }

                for (var i in elputs) {
                    debug(el + " " + i);
                    debug(warnings);
                    warnings[el][i] = {
                        'message': 'Found undocumented ' + el.substr(0, el.length - 1),
                        'value': elputs[i]
                    };


                    totWarnings++;
                }

                report.report.inputs[clabel] = elreport;
            }


            report.report.totErrors = totErrors;
            report.report.totWarnings = totWarnings;
            if(totErrors>0) report.report.errors = errors;
            if(totWarnings>0) report.report.warnings = warnings;

            debug(config)
            if (config && config.hasOwnProperty('option') && config.options.hasOwnProperty('raiseOnError') && config.options['raiseOnError'] && totErrors > 0) {

                return res.status(400).send(errors);
            }

            return res.send(report);

        }

        return audoku.bind(null, config);
    },
    checkValidity: function (rule, item) {
        var report = {};


        report['type'] = au.checkType(rule.type, item);
        report['value'] = item;
        return report;

    },
    checkType: function (ruleType, item) {
        var itemType = typeof item;

        if (itemType == 'string') {
            //try for int
            var a = new Date(item);
            var b = new Date('Invalid Date');
            //   console.dir(a.toString());
            //   console.dir(b.toString());
            if (a.toString() !== b.toString())
                itemType = 'date';
            try {
                var test = parseFloat(item);

                if (test.toString() == item )
                    itemType = 'float';
            } catch (e) {
            }
            try {
                var test = parseInt(item);
                console.log(test);
                console.log(test.toString());
                console.log(item);
                if (test.toString() == item)
                    itemType = 'integer';
            } catch (e) {
            }

            if (item == 'false' || item == 'true')
                itemType = 'boolean';

        }

        var type = {'type': itemType, 'expectedType': ruleType}
        if (itemType == ruleType) {
          //  type['message'] = 'ok';
            type['correct'] = true;
        } else {
           // type['message'] = 'Wrong type';
            type['correct'] = false;
        }
        return type;
    }


}


String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1, this.length - 1);
}

module.exports = au;