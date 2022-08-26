
const fetch = (...args) =>
import('node-fetch').then(({ default: fetch }) => fetch(...args));
const AutoAppsCommand = require("./autoappscommand");
var extensions = require("./extensions");
var joinapi = require("./joinapi");
class Sender {
	static get newMessageId(){
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		    return v.toString(16);
		});
	}
	static get newSuccessResult(){
		return new SendResult(Sender.newMessageId,true);
	}

	static get GCM_PARAM_TIME_TO_LIVE() {return "time_to_live"}
	static get GCM_PARAM_PRIORITY() {return "priority"}
	static get GCM_MESSAGE_PRIORITY_HIGH() {return "high"}
	static get GCM_PARAM_DELAY_WHILE_IDLE() {return "delay_while_idle"}
}
class SendResult {
	constructor(messageId,success,message){
		this.messageId = messageId;
		this.success = success;
		this.message = message;
	}
}
class SendResults extends Array {
	static fromMany(many){
		var finalResult = new SendResults();
		if(!many || many.length == 0) return finalResult;
		for(var results of many){
			finalResult.merge(results);
		}
		return finalResult;
	}
	get firstFailure(){
		if(this.length == 0) return null;
		return this.find(result=>!result.success);
	}
	constructor(results){
		super();
		if(!results || results.length == 0) return;

		this.merge(results)
	}
	merge(other){
		for(var result of other){
			this.push(new SendResult(result.messageId,result.success,result.message));
		}
		this.success = this.count(result=>result.success);
		this.failure = this.count(result=>!result.success);
		this.id = Sender.newMessageId;
	}
}
class SenderGCM extends Sender{
	//gcmRaw, devices, gcmParams
	send(options){		
		var content = {
	        "data": options.gcmRaw,
	        "registration_ids": options.devices.map(device=>device.regId2)
	    }
	    content = Object.assign(content, options.gcmParams)

	    content[Sender.GCM_PARAM_PRIORITY] = Sender.GCM_MESSAGE_PRIORITY_HIGH;
	    content[Sender.GCM_PARAM_DELAY_WHILE_IDLE] = false;
		var postOptions = {
			method: 'POST',
			body: JSON.stringify(content), 
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'key=AIzaSyDvDS_KGPYTBrCG7tppCyq9P3_iVju9UkA',
				'Content-Type': 'application/json; charset=UTF-8'
			}
		}
		var url = "https://fcm.googleapis.com/fcm/send";
		return util.fetch()
		.then(fetch =>fetch(url, postOptions))
		.then(result=>{
			if(result.status == 200) return result.json();
			return result.text().then(text => Promise.reject(text));
		}).then(results=>{
			console.log("GCM results:",results);
			var finalResults = [];
			for(var result of results.results){
				var sendResult = null;
				if(result.message_id){
					sendResult = new SendResult(result.message_id,true);
				}else{
					sendResult = new SendResult(null,false)
				}
				finalResults.push(sendResult);
			}
			return new SendResults(finalResults);
		});

	}
}
class SenderIP extends Sender {
	send(options){
		return Promise.all(options.devices.map(device => {

			var doForOneDevice = function(options){
				var regId = options.secondTry ? device.regId : device.regId2;
				var postOptions = {
					method: 'POST',
					body: JSON.stringify(options.gcmRaw), 
					headers: {
						'Content-Type': 'application/json'
					}
				}
				var url = `http://${regId}/push`;
				var getSucess = text => Sender.newSuccessResult
				var getError = error => {
					if(options.secondTry) return {"success":false,"error": typeof error == "string" ? error : error.message};
					options.secondTry = true;
					return doForOneDevice(options);
				}
		    	return util.fetch()
				.then(fetch =>fetch(url,postOptions))
				.then(result=>result.text()).then(getSucess).catch(getError)
			}
			return doForOneDevice(options);
		}))
		.then(allResults => (new SendResults(allResults)))
	}
}
class SenderIFTTT extends Sender {
	send(options){
		var text = options.gcmPush.push.text;
		if(!text) return Promise.reject("Push to IFTTT needs text");

		return Promise.all(options.devices.map(device=>{			
			var autoAppsCommand = new AutoAppsCommand(text,"value1,value2,value3");
			var valuesForIfttt = {};
			var url = `https://maker.ifttt.com/trigger/${autoAppsCommand.command}/with/key/${device.regId}`;
			if(autoAppsCommand.values.length > 0){
				url += "?"
			}
			for (var i = 0; i < autoAppsCommand.values.length; i++) {
				var value = autoAppsCommand.values[i]
				var varName = `value${i+1}`;
				valuesForIfttt[varName] = value;
				if(i>0){
					url += "&";
				}
				url += `${varName}=${encodeURIComponent(value)}`;
			}
			//console.log(valuesForIfttt);
			var postOptions = {
				method: 'GET',
				//body: JSON.stringify(valuesForIfttt), 
				headers: {
					'Content-Type': 'application/json; charset=UTF-8'
				}
			}
			//console.log(url);
			return util.fetch()
			.then(fetch =>fetch(url,postOptions))
			.then(result=>Sender.newSuccessResult).catch(error=>Sender.newSuccessResult).then(result => (new SendResults([result])));
		}));
	}
}
class SenderServer extends Sender {
	async send(options){
		var result = null;
		var deviceIds = options.devices.map(device=>device.deviceId).join(",");
		if(options.gcmPush){
			if(options.apiKey) options.gcmPush.push.apikey = options.apiKey;
			options.gcmPush.push.deviceIds = deviceIds;
			result = joinapi.sendPush(options.gcmPush.push);
		}else{
			var rawGcmWithOptions = options.gcmRaw;
			rawGcmWithOptions.deviceIds = deviceIds;
			result = joinapi.sendRawGcm(rawGcmWithOptions);
		}
		result = await result;
		var sendResults = new SendResults();
		for(var device of options.devices){
			if(!result.success){
				sendResults.push(new SendResult(null,false,result.errorMessage));
			}else{
				sendResults.push(new SendResult(SendResult.newMessageId,true));
			}
		}
		return sendResults;
	}
}
module.exports = {
  SendResult : SendResult,
  SendResults : SendResults,
  Sender : Sender,
  SenderGCM : SenderGCM,
  SenderIP : SenderIP,
  SenderIFTTT : SenderIFTTT,
  SenderServer : SenderServer
}