
const ip = require("ip");
const web = require("./web");
module.exports = class IpGetter {
    constructor(overrideLocal,overridePublic){
    	this.overrideLocal = overrideLocal;
    	this.overridePublic = overridePublic;
    }
    getIps(){
    	return (this.overridePublic ? Promise.resolve(this.overridePublic) : web.get("http://httpbin.org/ip")
		.then(result=>result.origin)
		.catch(error=>null))
		.then(publicIp=>{
			var localIp = this.overrideLocal || ip.address();
			return {"localIp":localIp,"publicIp":publicIp};
		});
    }
}