var Docker = require('dockerode')

function Dockaless(docker_opts) {
  this.docker = new Docker(
    docker_opts
  )
}
module.exports = Dockaless

Dockaless.prototype.make_lambda = function(image, cmd) {
  var dockaless = this
  return function(event, context) {
    dockaless.docker.run(image, cmd, process.stdout, function(err, data, container) {
      if (err == null) {
        (context && 'succeed' in context) ? context.succeed(data) : context(data)
      } else{
        (context && 'fail' in context) ? context.fail(err) : function() { throw err }
      }
    })
  }
}
