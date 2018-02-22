
const DevicesLib = require("./device");
const Devices = DevicesLib.Devices; 
module.exports = class Join {
	constructor(apiKey){
		this.apiKey = apiKey;
	}
	get devices(){
		return (async () => {
			if(!this.devicesInMemory){
				this.devicesInMemory = await Devices.fromServer(this.apiKey);
			}
			return this.devicesInMemory;
		})();
	}
	async sendPush(push,deviceFilter,options){
		push.apikey = this.apiKey;
		var devices = await this.devices;
		var devicesByPushProperties = null;
		if(push.deviceIds){
			if(!devicesByPushProperties) devicesByPushProperties = [];
			var split = push.deviceIds.split(",");
			devicesByPushProperties = devicesByPushProperties.concat(devices.filter(device=>split.indexOf(device.deviceId)>=0));
		}
		if(push.deviceNames){
			if(!devicesByPushProperties) devicesByPushProperties = [];
			var split = push.deviceNames.split(",").map(name=>name.toLowerCase());
			devicesByPushProperties = devicesByPushProperties.concat(devices.filter(device=>{
				var deviceName = device.deviceName.toLowerCase();
				for(var inputName of split){
					if(deviceName.indexOf(inputName)>=0){
						return true;
					}
				}
				return false;
			}));
		}
		if(devicesByPushProperties){
			devices = Devices.fromArray(devicesByPushProperties);
		}
		if(deviceFilter){
			if(typeof deviceFilter == "function"){
				devices = devices.filter(deviceFilter);	
			}else{
				var fromDevice = deviceFilter.asDevices;
				devices = fromDevice ? fromDevice : deviceFilter;
			}
		}
		if(!devices || devices.length == 0) throw "No devices to send push to";		
		if(!push.senderId){
			push.senderId = options.node.deviceId;
		}
		return devices.sendPush(push,options);
	}
	sendCommand(command,deviceFilter,options){
		return this.sendPush({"text":command},deviceFilter,options);
	}
	notify(title,text,deviceFilter,options){
		return this.sendPush({"title":text,"text":text},deviceFilter,options);
	}
}