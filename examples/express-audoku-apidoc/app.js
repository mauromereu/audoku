var au = require('../../index');

var express = require("express");
var app = express();
var path = require('path');
app.use('/apidoc', express.static(path.join(__dirname, 'doc')));


var router = express();


/**
 * @api {get} /user/:id Read data of a User
 * @apiVersion 0.3.0
 * @apiName GetUser
 * @apiGroup User
 * @apiPermission admin
 *
 * @apiDescription A simple example of a get by id from a simple endpoint simulated.
 *
 * @apiParam {Number} id The Users-ID.
 *
 * @apiExample Example usage:
 * curl -i http://localhost/user/4711
 *
 * @apiSuccess {Number}   id            The Users-ID.
 * @apiSuccess {Date}     registered    Registration Date.
 * @apiSuccess {Date}     name          Fullname of the User.
 * @apiSuccess {String[]} nicknames     List of Users nicknames (Array of Strings).
 * @apiSuccess {Object}   profile       Profile data (example for an Object)
 * @apiSuccess {Number}   profile.age   Users age.
 * @apiSuccess {String}   profile.image Avatar-Image.
 * @apiSuccess {Object[]} options       List of Users options (Array of Objects).
 * @apiSuccess {String}   options.name  Option Name.
 * @apiSuccess {String}   options.value Option Value.
 *
 * @apiError NoAccessRight Only authenticated Admins can access the data.
 * @apiError UserNotFound   The <code>id</code> of the User was not found.
 *
 * @apiErrorExample Response (example):
 *     HTTP/1.1 401 Not Authenticated
 *     {
 *       "error": "NoAccessRight"
 *     }
 */
router.get('/user/:id', au.doku({
        // json documentation
        title: 'Read data of a User ',
        version: '0.3.0',
        name: 'GetUser',
        group: 'User',
        description: 'A simple example of a get by id from a simple endpoint simulated.',
        params: {
            id: {type: 'String', required: true, description: 'The Users-ID.'}
        },
        permission: [
            {
                name: 'admin'
            }
        ],
        examples: [
            {
                title: "Example usage:",
                content: "curl -i http://localhost/user/4711",
                type: "json"
            }
        ],
        "Success 200": {
            "id": {
                "type": "Number", required: true,
                "description": "The Users-ID."
            },
            "registered": {
                "type": "Date",
                "description": "Registration Date."
            },
            "name": {
                "type": "Date",
                "description": "Fullname of the User."
            },
            "nicknames": {
                "type": "String[]",
                "description": "List of Users nicknames (Array of Strings)."
            },
            "profile": {
                "type": "Object",
                "description": "Profile data (example for an Object)>"
            },
            "profile.age": {
                "type": "Number",
                "description": "Users age."
            },
            "profile.image": {
                "type": "String",
                "description": "Avatar-Image."
            },
            "options": {
                "type": "Object[]",
                "description": "List of Users options (Array of Objects)."
            },
            "options.name": {
                "type": "String",
                "description": "Option Name."
            },
            "options.value": {
                "type": "String",
                "description": "Option Value."
            }
        },
        "Error 4xx": {
            NoAccessRight: {
                "description": "Only authenticated Admins can access the data."
            },
            UserNotFound: {
                "description": "The <code>id</code> of the User was not found."
            }
        },
        "errorExamples": {
            "Response (example):": {

                "content": "HTTP/1.1 401 Not Authenticated\n{\n  \"error\": \"NoAccessRight\"\n}",
                "type": "json"
            }
        }

    }),
    function getUser(req, res) {
        res.send();
    }
)
;


/**
 * @api {post} /user Create a new User
 * @apiVersion 0.3.0
 * @apiName PostUser
 * @apiGroup User
 * @apiPermission none
 *
 * @apiDescription A simple example of a user creation from a simple endpoint simulated. You can't write multiline.
 *
 * @apiParam {String} name Name of the User.
 *
 * @apiSuccess {Number} id         The new Users-ID.
 * @apiSuccessExample Response (example):
 HTTP/1.1 201 ok
 {
     "message": "User created"
 }

 * @apiError NoAccessRight Only authenticated Admins can access the data.
 *
 * @apiErrorExample Response (example):
 *     HTTP/1.1 401 Not Authenticated
 *     {
 *       "error": "NoAccessRight"
 *     }
 */
router.post('/user', au.doku({
        // json documentation
        title: 'Create a new User ',
        version: '0.3.0',
        name: 'PostUser',
        group: 'User',
        description: `A simple example of a user creation from a simple endpoint simulated.
If you want you can write multiline.`,
        params: {
            name: {type: 'String', required: true, description: 'Name of the User.'}
        },
        permission: [
            {
                name: 'none'
            }
        ],
        "Success 201": {
            "id": {
                "type": "Number", required: true,
                "description": "The Users-ID."
            }
        },
        "successExamples": {
            "Response (example):": {

                "content": `HTTP/1.1 201 ok
{  
    "message": "User created"
}`,
                "type": "json"
            }
        },
        "Error 4xx": {
            NoAccessRight: {
                "description": "Only authenticated Admins can access the data."
            }
        },
        "errorExamples": {
            "Response (example):": {

                "content": "HTTP/1.1 401 Not Authenticated\n{\n  \"error\": \"NoAccessRight\"\n}",
                "type": "json"
            }
        }
    }), function (req, res) {
        res.send();
    }
);


app.use(router);

app.listen(3000, function () {
    console.log("Api up and running!");
});


au.apidocs({
    metadata: {
        "name": "Example API Documentation with audoku and apidoc",
        "version": "0.3.0",
        "description": "Api Node/Express documented with audoku and apidoc",
        "title": "Example API",
        //       "url": "http://api.sample.ee",
        /*    "header": {
         "title": "API Overview",
         "content": "<p>A wonderful set of APIs</p>"
         },
         "footer": {
         "title": "Maintained by ACME",
         "content": "<p>Codebase maintained by ACME</p>\n"
         }*/
    },
    app: app,
    docspath: '/docs',
    routers: [{
        basepath: "http://localhost:" + 3000,
        router: router
    }
    ]
});