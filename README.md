# Dockaless - Serverless Docker functions

[![Greenkeeper badge](https://badges.greenkeeper.io/iopipe/dockaless.svg)](https://greenkeeper.io/)

Integrate Docker containers into a serverless
platform or a lambda-based flow via [turtle](https://github.com/iopipe/turtle).

## Examples:

### Create a serverless function:

This function may be deployed on AWS Lambda as-is.

```javascript
var Dockaless = require("dockaless")
var dals = new Dockaless()

exports.handler = dals.make_lambda("ubuntu", [ "bash", "-c", "ls; ps" ])
```

For local testing, one can call ```exports.handler({}, () => {})```.

### Resizing videos with FFmpeg:

This may be leveraged with the [turtle library](https://github.com/iopipe/turtle)
to chain execution with local functions, remote functions,
and APIs.

Utilizes the minimal, Alpine-linux based [ffmpeg image from
sjourdan](https://github.com/sjourdan/ffmpeg-docker).

```javascript
const turtle = require("@iopipe/turtle")()
const Dockaless = require("dockaless")
const dals = new Dockaless()

exports.handler = turtle.define(
  turtle.property("url"),
  turtle.fetch,
  dals.make_lambda("sjourdan/ffmpeg", [ "-i", "pipe:0", "-vf", "scale=320:240", "pipe:1" ])
)
```

This example accepts a JSON document containing a "url" key. A video is fetched
from this URL and scaled (resized) using ffmpeg. The video is piped back
over the network to the caller, but a script could continue by saving this
somewhere (such as S3) as in the following example.

### Parallelization

This library combined with the IOpipe library can be used to easily
build parallelized tasks requiring use of containerized applications.

The following example is similar to the previous, but converts an
array of videos, saves them to storage, and returns URLs to the uploaded
content.

```javascript
var AWS = require('aws-sdk')
var turtle = require("@iopipe/turtle")()
var Dockaless = require("dockaless")
var crypto = require("crypto")

var dals = new Dockaless()
var s3 = new AWS.S3()

function put_bucket(event, context) {
  s3.createBucket({Bucket: event.bucket}, function() {
    var params = {Bucket: event.bucket, Key: event.key, Body: event.body};
    s3.putObject(params, function(err, data) {
        if (err)
            context.fail(err)
        else
            context.succeed(event)
     });
  });
}

exports.handler = turtle.define(
  turtle.property("urls"),
  turtle.map(
    turtle.fetch,
    dals.make_lambda("sjourdan/ffmpeg", [ "-i", "pipe:0", "-vf", "scale=320:240", "pipe:1" ]),
    (event, context) => {
      var video_hash = crypto.createHash('sha256').update(event).digest('hex')
      put_bucket({
        bucket: "your_bucket",
        key: video_hash
      }, context)
    },
    (event, callback) => {
      callback(s3.getSignedUrl('getObject', event))
    }
  )
)
```

# Reference

### class Dockaless(dockerode_opts)

If dockerode options are not provided, local environment variables will be used. Typically, this will attempt to manage a local Docker daemon via its Unix socket.

Current options are:

 * host
 * port
 * ca
 * cert
 * key

See [dockerode documentation](https://github.com/apocas/dockerode) for more details.

### method Dockaless.make_lambda(image, cmd)

Image is the name of a Docker image.

Cmd are the arguments for the image, overriding CMD. Depending on if there is an entrypoint defined, this either passes arguments to the entrypoint, or executes the command inside the container. (This is standard Docker behavior)

# License

Apache 2.0
