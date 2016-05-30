# Audoku

Audoku is an Express middleware for documenting and testing/validating endpoints.
It allows you to get the documentation of your APIs in Json format by calling single endpoints.
Audoku differs from other projects about API documentation, because it provides just the information, no graphical view.
It follows in some way the unix man pages behaviour, showing how to use (basically which parameters and headers set for) your endpoints, by calling them with a special parameter.


### Examples

Writing the doc by instantiating a middleware with a JSON like this on the endpoint you want to document:

```javascript
var au = require('audoku');

router.get('/books', au.doku({
        headers: {
            'wonderful': {
                'description': 'A wonderful header',
                'type': 'string',
                'required': false
            }
        },
        fields: {
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

To get the help info just call the endpoint adding the field *audoku=help*, say http://example.com/books?audoku=help and you'll get the following help based upon your endpoint description:
```JSON
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
To do that you have to set the *audoku* field to "report", as in this example http://example.com/books?myfield=200&price=3$&author=kafka&year=last&audoku=report
and you'll get the following JSON


```JSON
{
  "fullurl": "http://example.com/books?myfield=200&price=3$&author=kafka&year=last&audoku=report",
  "url": "/books?myfield=200&price=3$&author=kafka&year=last&audoku=report",
  "method": "GET",
  "report": {
    "inputs": {
      "fields": {
        "author": {
          "type": {
            "type": "string",
            "expectedType": "string",
            "correct": true
          },
          "value": "kafka"
        },
        "audoku": {
          "type": {
            "type": "string",
            "expectedType": "string",
            "correct": true
          },
          "value": "report"
        }
      }
    },
    "totErrors": 2,
    "totWarnings": 11,
    "errors": {
      "fields": {
        "genre": {
          "message": "Required field 'genre' not found"
        },
        "year": {
          "type": {
            "type": "string",
            "expectedType": "integer",
            "correct": false
          },
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
        },
        "accept": {
          "message": "Found undocumented header 'accept'",
          "value": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        },
        "accept-encoding": {
          "message": "Found undocumented header 'accept-encoding'",
          "value": "gzip, deflate, sdch"
        },
        "accept-language": {
          "message": "Found undocumented header 'accept-language'",
          "value": "it-IT,it;q=0.8,en-US;q=0.6,en;q=0.4"
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