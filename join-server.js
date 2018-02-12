
const joinapi = require("./js/joinapi");
const http = require("http");
const url = require("url");
const gcm = require("./js/gcm");

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
        var globalContext = this.context().global;
        const app = http.createServer((request, response) => {
          //node.log(`Got request: ${request.method} => ${request.method}`);
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
			  var gcmRaw = JSON.parse(body);
    		  //node.log(`GCM Raw: ${gcmRaw.type} => ${gcmRaw.json}`);
			  gcm.executeGcm(node, gcmRaw.type,gcmRaw.json);
			});
		  }
		  response.writeHead(200, {"Content-Type": "text/html"});
		  response.write(`OK`);
		  response.end();
		});
		app.listen(Number.parseInt(this.port));
		this.on('close', ()=>app.close());
        var joinConfig = RED.nodes.getNode(config.joinConfig);        
        if(!joinConfig){
			return node.log (`Can't register device. User has not configured Join yet`);
        }
        var existingDeviceId = globalContext.get("joindeviceid");
        if(existingDeviceId) return;
        var options = {
			"apikey":joinConfig.credentials.apikey,
			"deviceName":joinConfig.credentials.deviceName,
			"port":config.port,
			"deviceId":existingDeviceId
		};
		node.log(`Sending registration: ${JSON.stringify(options)}`)
		joinapi.registerInJoinServer(node,options)
		.then(deviceId=>{
			if(!deviceId) return;
			globalContext.set("joindeviceid",deviceId);
			node.log (`Saved device id: ${globalContext.get("joindeviceid")}`);
		});
    }
    RED.nodes.registerType("join-server",JoinServerNode);
}