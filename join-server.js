
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
        node.reportCommand = command => {
        	if(!command) return;
        	node.log(`Reporting command: ${command}`);
        	node.events.emit('command',command);
        }
        const app = http.createServer((request, response) => {
        node.log(`Got request: ${request.method} => ${request.method}`);
		  var query = url.parse(request.url, true).query;
		  if(query){
		  	node.reportCommand(query.message)
		  }
		  if(request.method == "POST"){
		  	let body = [];
			request.on('data', (chunk) => {
			  body.push(chunk);
			}).on('end', () => {
			  body = Buffer.concat(body).toString();
			  var push = JSON.parse(body);
		  	  node.reportCommand(push.text);			  
			});
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