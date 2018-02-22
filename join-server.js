
const joinapi = require("./js/joinapi");
const http = require("http");
const url = require("url");
const gcm = require("./js/gcm");

const EventEmitter = require('events');
class CommandEmitter extends EventEmitter {}
var LocalStorage = require("node-localstorage").LocalStorage
var localStorage = new LocalStorage('./joinserver');
module.exports = function(RED) {
    function JoinServerNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.events = new CommandEmitter();
        this.port = config.port;
        node.log(`Starting server on port ${this.port}...`);
        node.reportCommand = command => {
        	if(!command) return;
        	//node.log(`Reporting command: ${command}`);
        	node.events.emit('command',command);
        }
        var globalContext = this.context().global;
        const app = http.createServer((request, response) => {
        	// Set CORS headers
			response.setHeader('Access-Control-Allow-Origin', '*');
			response.setHeader('Access-Control-Request-Method', '*');
			response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
			response.setHeader('Access-Control-Allow-Headers', '*');
			if ( request.method === 'OPTIONS' ) {
				response.writeHead(200);
				response.end();
				return;
			}
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
			  var gcmRaw = Buffer.concat(body).toString();
    		  //node.log(`GCM Raw: ${gcmRaw.type} => ${gcmRaw.json}`);
			  node.reportCommand(gcmRaw)
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
        node.deviceId = existingDeviceId;
        if(existingDeviceId) return;
		existingDeviceId = localStorage.getItem('deviceId');
        var options = {
			"apikey":joinConfig.credentials.apikey,
			"deviceName":joinConfig.credentials.deviceName,
			"port":config.port
		};
		if(existingDeviceId){
			options.deviceId = existingDeviceId;
		}
		node.log(`Sending registration: ${JSON.stringify(options)}`)
		joinapi.registerInJoinServer(node,options)
		.then(deviceId=>{
			if(!deviceId) return;
			globalContext.set("joindeviceid",deviceId);
			localStorage.setItem('deviceId', deviceId);
    		node.deviceId = deviceId;
			//node.log (`Saved device id: ${globalContext.get("joindeviceid")}`);
		});
    }
    RED.nodes.registerType("join-server",JoinServerNode);
}