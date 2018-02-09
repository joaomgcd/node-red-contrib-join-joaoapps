
const ip = require("ip");
const web = require("./js/web");
const http = require("http");
const url = require("url");
const gcm = require("./js/gcm");
const EventEmitter = require('events');
class CommandEmitter extends EventEmitter {}
module.exports = function(RED) {
	function registerInJoinServer(node,config){
        var joinConfig = RED.nodes.getNode(config.joinConfig);
        if(!joinConfig){
			return node.log (`Can't register device. User has not configured Join yet`);
        }
        //node.log (`Join config: ${JSON.stringify(joinConfig)}`);
        if(!joinConfig.apikey){
			return node.log (`Can't register device. User has not configured API KEY yet`);
        }
		var ipAddress = ip.address();
		node.log (`IP Address: ${ipAddress}`);
		web.post(`http://localhost:8080/_ah/api/registration/v1/registerDevice/`,{
			"apikey":joinConfig.apikey,
			"regId": `${ipAddress}:${config.port}`,
			"regId2": `${ipAddress}:${config.port}`,
			"deviceName":joinConfig.deviceName,
			"deviceType":13
		},node)
		.then(result=>{
    		if(!result.success){
    			return node.error(result.errorMessage);
    		}
			node.log (`Registered device: ${result.deviceId}`);
    	})
    	.catch(error=>{
            node.status({fill:"red",shape:"dot",text:error});
            node.error(error, msg);
        })
	}
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
			  var gcmRaw = JSON.parse(body);
    		  node.log(`GCM Raw: ${gcmRaw.type} => ${gcmRaw.json}`);
			  gcm.executeGcm(node, gcmRaw.type,gcmRaw.json);
			});
		  }
		  response.writeHead(200, {"Content-Type": "text/html"});
		  response.write(`OK`);
		  response.end();
		});
		app.listen(Number.parseInt(this.port));
		this.on('close', ()=>app.close());
		registerInJoinServer(node,config);
    }
    RED.nodes.registerType("join-server",JoinServerNode);
}