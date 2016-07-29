"use strict";
var debug = require('debug')('audoku');
var express = require('express');
var path = require('path');
var request = require('request');
var async = require('async');

var _ = require('underscore')._;

var au = {
    doku: function (config) {

        return function (config, req, res, next) {


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
            //  cParams[label] = pAudoku;
            //cBodyFields[label] = pAudoku;

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
                , 'description': description
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

                if (_.isEmpty(report.report.inputs[clabel])) {
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
    },

    apidocs: function (config) {

        //console.log(config);
        var routers = config['routers'];
        var app = config['app'];

        var apilist = [];
        var calls = [];
        //console.log(routers.length);
        for (var i = 0; i < routers.length; ++i) {
            var r = routers[i].router;
            var basepath = routers[i].basepath;

            var mystack = r.stack;
            if (!mystack) {
                mystack = r._router.stack;
            }
            _.each(mystack, function (stack) {
                if (stack.route) {

                    var route = stack.route,
                        methodsDone = {};
                    _.each(route.stack, function (r) {
                        var method = r.method ? r.method.toUpperCase() : null;
                        if (!methodsDone[method] && method) {
                            //apilist.push({method:method, url : basepath+route.path, help:help});
                            debug('[' + method + '] ' + basepath + route.path);

                            methodsDone[method] = true;
                            calls.push({method: method, url: basepath + route.path, headers: {audoku: 'help'}});

                        }
                    });
                }
            });
        }




        var filesLocation = path.join(__dirname, '../apidoc/template/');


        var fs = require('fs');

        try {
            fs.accessSync(filesLocation, fs.F_OK);

        } catch (e) {
            filesLocation = path.join(__dirname, './node_modules/apidoc/template/');
        }

        async.eachSeries(calls, function (call, cb) {
            request(call, function (err, help) {
                if (err) {
                    debug(err);
                    cb(err);
                }
                else {
                    apilist.push(JSON.parse(help.body));
                    cb(null);
                }
            });

        }, function done() {


            //  console.log(apilist);
            /*
             var r = express();

             r.get('',function(req, res){
             res.send(apilist);
             });
             app.use('/audoku', r);
             */
            var api_project = config['metadata'];
            //   var fs = require('fs');


            var apiprojectFile = path.join(filesLocation, '/api_project.js');
            fs.writeFile(apiprojectFile, 'define(' + JSON.stringify(api_project) + ');', function (err) {
                if (err) {
                    return console.log(err);
                }
                debug("written " + apiprojectFile);
            });
            var api_data = {'api': []};

            _.each(apilist, function (el) {
                //console.log(el);
                var newEl = {};
                _.extend(newEl, el);
                newEl['type'] = el['method'];
                newEl['parameter'] = {};
                newEl['groupTitle'] = el['group'];

                var parArray = ['fields','bodyFields'];

                for (var i = 0; i < parArray.length; ++i) {
                    var key = parArray[i];

                    for (var p in el[key]) {
                        if (!newEl['parameter'].hasOwnProperty('fields'))
                            newEl['parameter']['fields'] = {};
                        if (!newEl['parameter']['fields'].hasOwnProperty(key.capitalizeFirstLetter()))
                            newEl['parameter']['fields'][key.capitalizeFirstLetter()] = [];
                        newEl['parameter']['fields'][key.capitalizeFirstLetter()].push(
                            {
                                group: key.capitalizeFirstLetter(),
                                type: el[key][p].type.capitalizeFirstLetter(),
                                optional: !( el[key][p].required || false ),
                                field: p,
                                description: el[key][p].description

                            }
                        )
                    }
                }
                /*
                var parArray = ['fields','bodyFields'];
                for (var i = 0; i < parArray.length; ++i) {
                    var key = parArray[i];
                    var exKey = key+"Examples";

                    for (var p in el[exKey]) {
                        if (!newEl['parameter'].hasOwnProperty('examples'))
                            newEl['parameter']['examples'] = {};
                        if (!newEl['parameter']['examples'].hasOwnProperty(key.capitalizeFirstLetter()))
                            newEl['parameter']['examples'][key.capitalizeFirstLetter()] = [];
                        newEl['parameter']['examples'][key.capitalizeFirstLetter()].push(
                            {
                                title: el[exKey].capitalizeFirstLetter(),
                                type: el[exKey][p].type.capitalizeFirstLetter(),
                                content: el[key][p].description

                            }
                        )
                    }
                } */


                var key = 'params';
                for (var p in el[key]) {
                    if (!newEl['parameter'].hasOwnProperty('fields'))
                        newEl['parameter']['fields'] = {};
                    if (!newEl['parameter']['fields'].hasOwnProperty('Parameters'))
                        newEl['parameter']['fields']['Parameters'] = [];
                    newEl['parameter']['fields']['Parameters'].push(
                        {
                            group: 'Parameters',
                            type: el[key][p].type.capitalizeFirstLetter(),
                            optional: !( el[key][p].required || false ),
                            field: p,
                            description: el[key][p].description

                        }
                    )
                }
                delete newEl[key];
                delete newEl[key];


                for (var p in el['headers']) {
                    if (!newEl.hasOwnProperty('header'))
                        newEl['header'] = {};
                    if (!newEl['header'].hasOwnProperty('fields'))
                        newEl['header']['fields'] = {};
                    if (!newEl['header']['fields'].hasOwnProperty('Headers'))
                        newEl['header']['fields']['Headers'] = [];
                    newEl['header']['fields']['Headers'].push(
                        {
                            group: 'Headers',
                            type: el['headers'][p].type.capitalizeFirstLetter(),
                            optional: !( el['headers'][p].required || false ),
                            field: p,
                            description: el['headers'][p].description

                        }
                    )

                }

                api_data.api.push(newEl);
            });


            var apidataFile = path.join(filesLocation, '/api_data.js');
            fs.writeFile(apidataFile, 'define(' + JSON.stringify(api_data) + ');', function (err) {
                if (err) {
                    return console.log(err);
                }
                debug("written " + apidataFile);
            });


        });
        app.use(config['docspath'], express.static(filesLocation));
    } // end apidocs

}; // end au

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}


module.exports = au;
