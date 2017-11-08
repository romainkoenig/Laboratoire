const jwt = require('jwt-simple');

const { rsaKey } = require('./rsa_key');

// This is for local

const result = jwt.encode({
    "sub":"569685109e6d42018bc01d16",
    "user_id": "569685109e6d42018bc01d16",
    "iss":"569685109e6d42018bc01d16",
    "roles": [
    {
      "name": "gt:client:rider:"
    },
    { "name": "gt:employee:tech"}
    ],
    "display_name":"Script token (as Joe Mocha)",
    "iat":1461744309,
    "exp":34461917109
  },
`${rsaKey}`,'RS256');


console.log(result);
