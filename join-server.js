
const joinapi = require("./js/joinapi");
const http = require("http");
const url = require("url");
const gcm = require("./js/gcm");
const IpGetter = require("./js/ipgetter");

const EventEmitter = require('events');
class CommandEmitter extends EventEmitter {}
var LocalStorage = require("node-localstorage").LocalStorage
var localStorage = new LocalStorage('./joinserver');
module.exports = function(RED) {
    function JoinServerNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.config = config;
        this.events = new CommandEmitter();
        this.port = config.port;
        node.log(`Starting server on port ${this.port}...`);
        node.reportCommand = command => {
        	if(!command) return;
        	//node.log(`Reporting command from server: ${command}`);
        	node.events.emit('command',command);
        }
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
		  	node.reportCommand(query.message);
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
		this.on('close', ()=>{
			app.close();
		});
        sendRegistration(node);
       
    }
    async function sendRegistration(node){
        var globalContext = node.context().global;
    	var config = node.config;
        var joinConfig = RED.nodes.getNode(config.joinConfig);        
        if(!joinConfig){
			return node.log (`Can't register device. User has not configured Join yet`);
        }
		var ips = await new IpGetter(node.credentials.localIp,node.credentials.publicIp).getIps();
		var lastIps = globalContext.get("lastIps");
		var lastLocalIp = null;
		var lastPublicIp = null;
		if(lastIps){
			//node.log("Found lastIps: " + lastIps);
			//node.log("Found Ips: " + JSON.stringify(ips));
			lastIps = JSON.parse(lastIps);
			lastLocalIp = lastIps.localIp;
			lastPublicIp = lastIps.publicIp;
		}
 		var existingDeviceId = globalContext.get("joindeviceid");
        node.deviceId = existingDeviceId;
        if(lastLocalIp == ips.localIp && lastPublicIp == ips.publicIp){
        	node.log("Not registering device because IPs are the same.")
        	return;
        }

		existingDeviceId = localStorage.getItem('deviceId');
        var options = {
			"apikey":joinConfig.credentials.apikey,
			"deviceName":joinConfig.credentials.deviceName,
			"port":config.port
		};
		if(existingDeviceId){
			options.deviceId = existingDeviceId;
		}
		Object.assign(options,ips);
		node.log(`Sending registration: ${JSON.stringify(options)}`)
		joinapi.registerInJoinServer(node,options)
		.then(deviceId=>{
			if(!deviceId) return;
			globalContext.set("joindeviceid",deviceId);
			globalContext.set("lastIps",JSON.stringify(ips));
			globalContext.set("joindeviceid",deviceId);
			localStorage.setItem('deviceId', deviceId);
    		node.deviceId = deviceId;
			//node.log (`Saved device id: ${globalContext.get("joindeviceid")}`);
		});
    }
    RED.nodes.registerType("join-server",JoinServerNode,{
        credentials: {
            publicIp: {type:"text",value:"",required:false},
            localIp: {type:"text",value:"",required:false}
        }
    });
}