
const http = require("http");
const url = require("url");
const EventEmitter = require('events');
class CommandEmitter extends EventEmitter {}
module.exports = function(RED) {
    function JoinServerNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.events = new CommandEmitter();
        this.port = config.port;
        node.log(`Starting server on port ${this.port}...`);
        const app = http.createServer((request, response) => {
		  var query = url.parse(request.url, true).query;
		  if(query && query.message){
		  	node.events.emit('command',query.message);
		  }
		  response.writeHead(200, {"Content-Type": "text/html"});
		  response.write(`OK`);
		  response.end();
		});
		app.listen(Number.parseInt(this.port));
		this.on('close', ()=>app.close());
    }
    RED.nodes.registerType("join-server",JoinServerNode);
}