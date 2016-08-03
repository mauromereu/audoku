/* jshint -W069 */

var debug = require('debug')('audoku');
var express = require('express');
var path = require('path');
var request = require('request');
var async = require('async');

var _ = require('underscore')._;

var au = {
    doku: function (config) {
        "use strict";
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

            var i;
            try {
                for (i in req.body)
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
                };
            }

            for (var e in req.params) {
                config.url = config.url.replace(req.params[e], ":" + e);
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
            var conf;
            var elputs;
            var el;
            for (el in inputs) {
                debug(el);
                conf = inputs[el].conf;
                elputs = inputs[el].inputs;

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
                'fullurl': req.protocol + '://' + req.get('host') + req.originalUrl,
                'url': req.originalUrl,
                'method': req.method,
                'description': description,
                'report': {
                    inputs: {
                        'headers': {}, 'fields': {}, 'params': {}, 'bodyFields': {}
                    }
                }
            };

            debug(report.report);

            for (el in inputs) {
                conf = inputs[el].conf;
                elputs = inputs[el].inputs;
                var clabel = el;
                var elreport = report.report.inputs[clabel];

                for (i in conf) {
                    if (elputs && elputs.hasOwnProperty(i)) {
                        elreport[i] = au.checkValidity(conf[i], elputs[i]);  // keep results for  validity report
                        if (!elreport[i].correct) {
                            if (!errors.hasOwnProperty(el))
                                errors[el] = {};
                            errors[el][i] = elreport[i];
                            errors[el][i].message = "Wrong type";
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
                        };
                        totErrors++;

                        //TODO check for alternatives

                    }
                }

                for (i in elputs) {
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
                debug("Exporting   ----------- report.report.inputs[" + clabel + "]");
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

            debug(config);
            if (config && config.hasOwnProperty('option') && config.options.hasOwnProperty('raiseOnError') && config.options['raiseOnError'] && totErrors > 0) {

                return res.status(400).send(errors);
            }

            return res.send(report);

        }.bind(null, config);

    },
    checkValidity: function (rule, item) {
        "use strict";
        var report = {};

        var r = this.checkType(rule.type, item);
        for (var attrname in r) {
            report[attrname] = r[attrname];
        }

        report['value'] = item;
        return report;

    },
    checkType: function (ruleType, item) {
        "use strict";

        debug("checkType(" + ruleType + "," + item + ")");
        var itemType = typeof item;

        if (itemType === 'string' || itemType === 'number') {
            var a = new Date(item);
            var b = new Date('Invalid Date');

            if (a.toString() !== b.toString()) {
                itemType = 'date';
                debug('date ok');
            }
            var test;
            try {
                test = parseFloat(item);

                if (test.toString() === item.toString()) {
                    itemType = 'float';
                    debug('float ok');
                }

            } catch (e) {
                debug('catch of float');
            }
            try {
                test = parseInt(item);
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
                debug('boolean ok');
            }

        }

        var type = {'type': itemType, 'expectedType': ruleType};
        if (itemType === ruleType) {

            type.correct = true;
        } else {
            // type['message'] = 'Wrong type';
            type.correct = false;
        }
        debug("type detected: " + itemType);
        return type;
    },

    /**
     * Generate the apidoc html for
     *
     * @param config
     * @param callback
     */
    apidocs: function (config, callback) {
        "use strict";

        //console.log(config);
        var routers = config['routers'];

        if (!routers) {

            debug('No routers in config');
            throw  Error('No routers in config');
        }

        var app = config.app;

        var apilist = [];
        var calls = [];

        var workWithStack = function (stack) {
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
        };
        //console.log(routers.length);
        for (var i = 0; i < routers.length; ++i) {
            var r = routers[i].router;
            var basepath = routers[i].basepath;

            var mystack = r.stack;
            if (!mystack) {
                mystack = r._router.stack;
            }
            _.each(mystack, workWithStack);
        }


        var filesLocation = path.join(__dirname, '../apidoc/template/');


        var fs = require('fs');

        try {
            fs.accessSync(filesLocation, fs.F_OK);

        } catch (e) {
            filesLocation = path.join(__dirname, './node_modules/apidoc/template/');
        }

        try {
            fs.accessSync(filesLocation, fs.F_OK);

        } catch (e) {
            debug(e);
            if (callback instanceof Function) {
                callback(e);
            }

            return;
        }

        async.eachSeries(calls, function (call, cb) {
            request(call, function (err, help) {
                if (err) {
                    debug(err);
                    cb(err);
                }
                else {
                    debug(help.body);
                    try {
                        apilist.push(JSON.parse(help.body));
                        debug('Collected documentation for call ' + call.url);
                        cb(null);
                    } catch (e) {
                        debug(e);
                    }
                }
            });

        }, function done(err) {


            if (err) {
                callback(err);
                return;
            }

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
                    if (callback instanceof Function) callback(err);
                    return;
                }
                debug("written " + apiprojectFile);
            });
            var api_data = {'api': []};
            var p;

            _.each(apilist, function (el) {
                    //console.log(el);
                    var newEl = {};
                    _.extend(newEl, el);
                    newEl['type'] = el['method'];
                    newEl['parameter'] = {};
                    newEl['groupTitle'] = el['group'];

                    var parArray = [
                        {
                            field: 'fields',
                            container: 'parameter'
                        },
                        {
                            field: 'params',
                            container: 'parameter',
                            showAs: 'Parameters'
                        },
                        {
                            field: 'bodyFields',
                            container: 'parameter'
                        }, {
                            field: 'Success 200',
                            container: 'success',
                            omitRequired: true
                        },
                        {
                            field: 'Success 201',
                            container: 'success',
                            omitRequired: true
                        },
                        {
                            field: 'Success 204',
                            container: 'success',
                            omitRequired: true
                        },
                        {
                            field: 'Error 4xx',
                            container: "error",
                            omitRequired: true
                        },
                        {
                            field: 'headers',
                            container: "header",
                            omitRequired: true
                        },
                        {
                            field: 'errorExamples',
                            container: "error",
                            omitRequired: true,
                            middleField: 'examples',
                            omitThird: true,
                            fieldName : 'title'
                        },
                        {
                            field: 'successExamples',
                            container: "success",
                            omitRequired: true,
                            middleField: 'examples',
                            omitThird: true,
                            fieldName : 'title'
                        }
                    ];

                    for (var i = 0; i < parArray.length; ++i) {
                        var key = parArray[i].field;
                        var container = parArray[i].container;
                        var omitRequired = parArray[i].omitRequired;
                        var showAs = parArray[i].showAs || key.capitalizeFirstLetter();
                        var middleField = parArray[i].middleField || 'fields';
                        var omitThird = parArray[i].omitThird || false;
                        var fieldName = parArray[i].fieldName || 'field';
                        if (!newEl[container])
                            newEl[container] = {};

                        for (var p in el[key]) {
                            if (!newEl[container].hasOwnProperty(middleField))
                                newEl[container][middleField] = {};
                            var toFill;
                            if (omitThird) {
                                if (!_.isArray(newEl[container][middleField]))
                                    newEl[container][middleField] = [];
                                toFill = newEl[container][middleField];
                            } else {
                                if (!newEl[container][middleField].hasOwnProperty(showAs))
                                    newEl[container][middleField][showAs] = [];
                                toFill = newEl[container][middleField][showAs];
                            }
                            var obj = {
                                group: showAs,
                                description:'<p>'+ el[key][p].description +'</p>'

                            };
                            if (el[key][p].content)
                                obj['content'] = el[key][p].content;
                            obj[fieldName] = p;

                            if (el[key][p].type) {
                                obj.type = el[key][p].type.capitalizeFirstLetter();
                            }
                            if (!omitRequired)
                                obj.optional = !( el[key][p].required || false );

                            toFill.push(obj);
                        }
                    }


                    var akey = [];

                    /*  for (p in el[akey]) {
                     if (!newEl['parameter'].hasOwnProperty('fields'))
                     newEl['parameter']['fields'] = {};
                     if (!newEl['parameter']['fields'].hasOwnProperty('Parameters'))
                     newEl['parameter']['fields']['Parameters'] = [];
                     newEl['parameter']['fields']['Parameters'].push({
                     group: 'Parameters',
                     type: el[akey][p].type.capitalizeFirstLetter(),
                     optional: !( el[akey][p].required || false ),
                     field: p,
                     description: el[akey][p].description

                     }
                     );
                     } */


                    debug(newEl);
                    api_data.api.push(newEl);
                }
            );


            var apidataFile = path.join(filesLocation, '/api_data.js');
            fs.writeFile(apidataFile, 'define(' + JSON.stringify(api_data) + ');', function (err) {
                if (err) {
                    debug(err);
                    callback(err);
                    return;
                }
                debug("written " + apidataFile);
            });


            if (callback instanceof Function) callback(null);
        }); //end done of async.eachSeries
        app.use(config['docspath'], express.static(filesLocation));
    } // end apidocs

}; // end au

String.prototype.capitalizeFirstLetter = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
};


module.exports = au;
