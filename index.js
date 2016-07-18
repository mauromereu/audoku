"use strict";
var debug = require('debug')('audoku');


var au = {
    doku: function (config) {

        return function(config, req, res, next) {


            debug('audoku');
            debug(req);

            var params = req.params || {};
            debug(params);
            var getReport = false;

            var getHelp = false;

            var headers = req['headers'] || {};

            var fields = req.query || {};
            var bodyFields = {};

            try {
                for (var i in req.body)
                    bodyFields[i] = req.body[i];
            }
            catch (e) {
                throw Error("Body error");
            }

            var cHeaders = config['headers'] || {};
            var cFields = config['fields'] || {};
            var cParams = config['params'] || {};
            var cBodyFields = config['bodyFields'] || {};
            var description = config['description'] || '';
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
            cBodyFields[label] = pAudoku;
            /*
             cHeaders[label]['alternatives'] = ['fields.' + label, 'params.' + label];
             cFields[label]['alternatives'] = ['headers.' + label, 'params.' + label];
             cParams[label]['alternatives'] = ['headers.' + label, 'fields.' + label];

             */

            config.method = req.method;
            config.url = req.baseUrl + req._parsedUrl.pathname;

            if (!config.hasOwnProperty('options')) {
                config['options'] = {
                    raiseOnError: false
                }
            }

            for (var el in req.params) {
                config.url = config.url.replace(req.params[el], ":" + el);
            }

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
                },
                'bodyFields': {
                    'conf': cBodyFields,
                    'inputs': bodyFields
                }
            };

            debug(inputs);

            for (var el in inputs) {
                debug(el);
                var conf = inputs[el].conf;
                var elputs = inputs[el].inputs;

                debug('-------------------------------------------');
                debug(elputs);
                if (elputs && elputs.hasOwnProperty(label)) {
                    if (elputs && elputs.hasOwnProperty(label) && elputs[label] === 'help') {
                        getHelp = true;
                    }
                    else if (elputs[label] === 'report') {
                        getReport = true;
                    }
                    else if (!(config && config.hasOwnProperty('options') && config.options.hasOwnProperty('raiseOnError') && config.options['raiseOnError'])) {
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

            if (!getReport) {
                return next();
            }

            //else go for validation
            debug('report');

            var report = {
                'fullurl': req.protocol + '://' + req.get('host') + req.originalUrl
                , 'url': req.originalUrl
                , 'method': req.method
                , 'description' : description
                , 'report': {
                    inputs: {
                        'headers': {}, 'fields': {}, 'params': {}, 'bodyFields': {}
                    }
                }
            };

            debug(report.report)


            for (var el in inputs) {
                var conf = inputs[el].conf;
                var elputs = inputs[el].inputs;
                var clabel = el;
                var elreport = report.report.inputs[clabel];


                for (var i in conf) {
                    if (elputs && elputs.hasOwnProperty(i)) {
                        elreport[i] = au.checkValidity(conf[i], elputs[i]);  // keep results for  validity report
                        if (!elreport[i].correct) {
                            if (!errors.hasOwnProperty(el))
                                errors[el] = {};
                            errors[el][i] = elreport[i];
                            errors[el][i].message = "Wrong type"
                            totErrors++;
                            delete elreport[i];
                        }

                        delete elputs[i];
                    }
                    else if (conf[i].required) {
                        if (!errors.hasOwnProperty(el))
                            errors[el] = {};

                        errors[el][i] = {
                            'message': 'Required ' + el.substr(0, el.length - 1) + " '" + i + "' not found",
                            'expectedType': conf[i].type
                        }
                        totErrors++

                        //TODO check for alternatives

                    }
                }

                for (var i in elputs) {
                    if (!warnings.hasOwnProperty(el))
                        warnings[el] = {};
                    debug(el + " " + i);
                    debug(warnings);
                    warnings[el][i] = {
                        'message': 'Found undocumented ' + el.substr(0, el.length - 1) + ' \'' + i + '\'',
                        'value': elputs[i]
                    };

                    totWarnings++;
                }


                report.report.inputs[clabel] = elreport;
                debug("Exporting   ----------- report.report.inputs[" + clabel + "]")
                debug(report.report.inputs[clabel]);

                if (myisEmpty(report.report.inputs[clabel])) {
                    debug(true);
                    delete report.report.inputs[clabel];
                }
            }


            report.report.totErrors = totErrors;
            report.report.totWarnings = totWarnings;
            if (totErrors > 0) report.report.errors = errors;
            if (totWarnings > 0) report.report.warnings = warnings;

            debug(config)
            if (config && config.hasOwnProperty('option') && config.options.hasOwnProperty('raiseOnError') && config.options['raiseOnError'] && totErrors > 0) {

                return res.status(400).send(errors);
            }

            return res.send(report);

        }.bind(null, config);

    },
    checkValidity: function (rule, item) {
        var report = {};

        var r = this.checkType(rule.type, item);
        for (var attrname in r) {
            report[attrname] = r[attrname];
        }

        report['value'] = item;
        return report;

    },
    checkType: function (ruleType, item) {

        debug("checkType(" + ruleType + "," + item + ")");
        var itemType = typeof item;

        if (itemType === 'string' || itemType === 'number') {
            var a = new Date(item);
            var b = new Date('Invalid Date');

            if (a.toString() !== b.toString()) {
                itemType = 'date';
                debug('date ok');
            }

            try {
                var test = parseFloat(item, 10);

                if (test.toString() === item.toString()) {
                    itemType = 'float';
                    debug('float ok');
                }

            } catch (e) {
                debug('catch of float');
            }
            try {
                var test = parseInt(item);
                debug("int " + test);
                if (test.toString() === item.toString()) {
                    itemType = 'integer';
                    debug('integer ok');
                }
            } catch (e) {
                debug('catch of integer');
            }

            if (item === 'false' || item === 'true') {
                itemType = 'boolean';
                debug('boolean ok')
            }

        }

        var type = {'type': itemType, 'expectedType': ruleType};
        if (itemType === ruleType) {

            type['correct'] = true;
        } else {
            // type['message'] = 'Wrong type';
            type['correct'] = false;
        }
        debug("type detected: " + itemType);
        return type;
    }


};


String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1, this.length - 1);
};

var myisEmpty = function (dict) {
    for (var prop in dict) if (dict.hasOwnProperty(prop)) return false;
    return true;
};

module.exports = au;
