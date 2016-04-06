var Docker = require('dockerode')

function Dockaless(docker_opts) {
  this.docker = new Docker(
    docker_opts
  )
}
module.exports = Dockaless

Dockaless.prototype.make_lambda = function(image, cmd) {
  return function(event, context) {
    this.docker.run(image, cmd, process.stdout, function(err, data, container) {
      if (err == null) {
        ('succeed' in context) ? context.succeed(data) : context(data)
      } else{
        ('fail' in context) ? context.fail(data) : function() { throw err }
      }
    })
  }
}
