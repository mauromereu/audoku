# Audoku

Audoku is an Express *middleware* for **documenting** and **validating/reporting** Rest API endpoints.
It allows you to get the documentation of your APIs in **Json format** by calling single endpoints.
Audoku differs from other projects about API documentation, because *it provides just the information*, no graphical view.
It follows in some way the *unix man pages behaviour*, showing how to use (basically which parameters and headers set for) your endpoints, by calling them with a special parameter.


## Installation
To use **audoku** install it in your Express project by typing:

`npm install audoku`


### Include Audoku

Just require it like a simple package:

```javascript
var au = require('audoku');
```

### Using Audoku

Audoku is a single method package that provides a middleware for Express.

Here the function documentation:

### `function doku(config)`
Builds a function to be used as middleware for single endpoint.
Like this:

```javascript
var router = require('express').Router();
var au = require('audoku');
router.get('/endpoint', au.doku(config), function(req,res){

  ...
});


```



#### config parameters
The config argument should be a JSON dictionary containing any of the keys in this example:

```javascript
{
  'headers' : { ... },
  'fields' : { ... },
  'params' : { ... },
  'bodyFields' : { ... },
  'options' : { ... }
}
```

Each dictionary can contain several elements defined like the example:

```javascript
{
  ...
  'fields' : {
    //element definition
      'elementName' : {  // the element name is the key
        'description' : 'The elmement description',  
        'type' : 'string',  // type can be string, integer, float or date
        'required' : true   // true if the element should always be present in the request, default false
      },

      // next elements
      ...
     },
  ...
}
```

##### headers
A dictionary of elements passed as key-value headers in the request.

##### fields
The fields passed through the URL after the question mark, like
 ```http://example.com/endpoint?key1=value1&key2=value2&etc... ```

##### params
The positional parameters in URLS, like:

```http://example.com/endpoint/:firstPar/someAction/:secondPar ```

##### bodyFields

The fields passed as json dictionary in request body, by using all methods except GET.
For example a body of this form:

```javascript
{
  "field1" : "value1",
  "field2" : "value2",
  ...
}
```
##### options


### Examples

Example of writing the doc with a JSON config, on the endpoint you want to document:

```javascript
var au = require('audoku');

router.get('/books', au.doku({
        'headers': {
            'wonderful': {
                'description': 'A wonderful header',
                'type': 'string',
                'required': false
            }
        },
        'fields': {
            'author': {
                'description': "Book author",
                'type': 'string',
                'required': true
            },
            'genre': {
                'description': 'Book genre',
                'type': 'string',
                'required': true
            },
            'year': {
                'description': 'Book edition year',
                'type': 'integer',
                'required': true
            }
        }
}), function (req, res) {

...

};
```

To get the help info just call the endpoint adding the field `audoku=help`, for example
`http://example.com/books?audoku=help`

 and you'll get the following help based upon your endpoint documentation:
```javascript
{
  "method": "GET",
  "url": "/books",
  "headers": {
    "wonderful": {
      "description": "A wonderful header",
      "type": "string",
      "required": false
    },
    "audoku": {
      "description": "Set the audoku mode as help or report",
      "type": "string",
      "required": false
    }
  },
  "fields": {
    "author": {
      "description": "Book author",
      "type": "string",
      "required": true
    },
    "genre": {
      "description": "Book genre",
      "type": "string",
      "required": true
    },
    "year": {
      "description": "Book edition year",
      "type": "integer",
      "required": true
    },
    "audoku": {
      "description": "Set the audoku mode as help or report",
      "type": "string",
      "required": false
    }
  }
}
```


Audoku can also provide a way to check if your call to an endpoint is missing any fields, parameters or headers.
To do that you have to set the `audoku` field to `report` like the others fields, as in this example

 `http://example.com/books?myfield=200&price=3$&author=kafka&year=last&audoku=report`

and you'll get the following JSON:


```javascript
{
  "fullurl": "http://example.com/books?myfield=200&price=3$&author=kafka&year=last&audoku=report",
  "url": "/books?myfield=200&price=3$&author=kafka&year=last&audoku=report",
  "method": "GET",
  "report": {
    "inputs": {
      "fields": {
        "author": {
          "type": "string",
          "expectedType": "string",
          "correct": true,
          "value": "kafka"
        },
        "audoku": {
          "type": "string",
          "expectedType": "string",
          "correct": true,
          "value": "report"
        }
      }
    },
    "totErrors": 2,
    "totWarnings": 11,
    "errors": {
      "fields": {
        "genre": {
          "message": "Required field 'genre' not found",
          "expectedType": "string"
        },
        "year": {
          "type": "string",
          "expectedType": "integer",
          "correct": false,
          "value": "last",
          "message": "Wrong type"
        }
      }
    },
    "warnings": {
      "headers": {
        "host": {
          "message": "Found undocumented header 'host'",
          "value": "example.com"
        },
        "connection": {
          "message": "Found undocumented header 'connection'",
          "value": "keep-alive"
        }
      },
      "fields": {
        "myfield": {
          "message": "Found undocumented field 'myfield'",
          "value": "200"
        },
        "price": {
          "message": "Found undocumented field 'price'",
          "value": "3$"
        }
      }
    }
  }
}
```


# Author


Mauro Mereu ([mauro.mereu+npm@gmail.com](mailto:mauro.mereu+npm@gmail.com))
