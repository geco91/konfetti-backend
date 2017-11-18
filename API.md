# API routes

The konfetti-backend exposes a JSON2-compliant HTTP api at port 3000.

* Where additinal body parameters are supported, the parameters have to be as utf8-encoded json. Expect all body parameters as optional.

* Upon successful creation or update, all routes return the new/changed instance(s)  in the { data: XXX } field.

Expect results to be have this form:
```
{
    "code": 200, // HTTP status (same as HTTP response code)
    "status": "success", // verbose response status
    "data": { // holds results, 
        "neighbourhoods": [] // results are generally retuned as an array of objects (same as models); if single objects are requested, this might also be a single object
    }
}
```

Expect errors to be retuned like this:
```
{
    "code": 500, // HTTP status (same as HTTP response code)
    "status": "error", // verbose response status
    "errors": [ // always returns an array of errors
        {
            "type": "mongodb", // type (optional)
            "message": "E11000 duplicate key error collection: konfetti.codes index: token_1 dup key: { : \"123\" }" // message (optional)
        }
    ]
}
```

## Usage and authentication

* Authentication is based on JWT for both rest and socket.io. If you receive an http 403, you have to require a new token first.
* To receive a new JWT, authenticate via basic auth against: 
```
/api/authenticate
```
* Once you hold a valid JWT, supply it in the HTTP header in the following form for subsecuent requests:
```
Key: Authorization, Value: Bearer <Token>
```
* Examples are provided in /stuff/ as a Postman-collection containing example requests for adding the first user (not documented here) and for acquireing tokens and sample requests.
* For development, there is an JWT in /stuff/ which does not expire.

### Users

update a single user by ID
```
POST /api/users/:userId
```
|Key|Value|
|---|-----|
|username|String|
|preferredLanguage|String 'en'|
|spokenLanguages|Array ['en','de']|
|description|String|
|email|String 'john@doe.com'|
|password|String|

get a single user by username
```
GET /api/users/:username
```

request password rest for user (by email address)
```
POST /api/users/:email/resetPassword
```
|Key|Value|
|---|-----|
|password|String|

reset password via magicKey (obtained via GET /:email/resetPassword and subsequent email)
```
GET /api/users/resetPassword/:magicKey
```

### Neighbourhoods

get all neighbourhoods
```
GET /api/neighbourhoods/
```

create a new neighbourhood (user must be admin on system)
```
POST /api/neighbourhoods/
```
|Key|Value|
|---|-----|
|name|String|
|geoData| Object ```{ "longitude":52.521633, "latitude":13.411088, "radius":2.5 }```|

### Threads

create a new thread
```
POST /api/threads/
```
|Key|Value|
|---|-----|
|title| String|
|parentNeighbourhood| String (Id of parent neighbourhood)|

get thread by id
```
GET /api/threads/:id
```

### Posts

create a new post (user must be admin on system)
```
POST /api/posts/
```
|Key|Value|
|---|-----|
|title| String|
|text| String|
|parentThread| String (Id of parent thread)|

get post by id
```
GET /api/posts/:id
```
### Assets

create a new avatar asset (immediatle replaces user's avatar-image)
```
POST /api/assets/avatar
```
|Key|Value|
|---|-----|
|avatar| binary-image|

create a general (image) asset
```
POST /api/assets/image
```
|Key|Value|
|---|-----|
|image| binary-image|
|parentNeighbourhood| String (Id of parent neighbourhood)|
|parentThread| String (Id of parent thread)|

* note: Asset-uploads are done as form data. Data input is limited to 4MB. All POST-requests have to carry a valid JWT.

After the upload succeeded, you will receive a 201 response containing a field data.asset.filename - you can then download the asset via an unauthenticated GET at /assets/:filename .

### Codes

create a new token
```
POST /api/codes/
```
|Key|Value|
|---|-----|
|actionType|String 'newNeighbour'|
|neighbourhood|String neighbourhoodId|
|token|String - optionally supply a Vanity-token (unique)|
|leftCount|Number - number of times this token can be redeemed|

redeem a token (as an existing user)
```
POST /api/codes/:token
```

redeem a token (unauthenticated - without supplying a valid JWT)
```
POST /api/codes/:token/anonymous
```
* note: Based on the action requested, it is possible to e.g. create a new user and immedately add this user to a neighbourhood (actionType : newNeighbour). Upon success, the result contains the user and the neighbourhood.