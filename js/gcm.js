module.exports = {
	executeGcm : function(node, type, json){
		try{
			var gcm = new classes[type]();
		    node.log(`Found class type ${gcm}...`);
			gcm.fromJsonString(json);
			gcm.execute(node);
		}catch(e){			
	        node.log(`Didn't find type ${type}...`);
		}
	}
}

class GCM {
	constructor(){
	}
	execute(node) {
		node.log(this);
	}
	fromJson(json) {
		for (var prop in json) {
			this[prop] = json[prop];
		}
	}
	fromJsonString(str) {		
		var json = JSON.parse(str);
		this.fromJson(json);

	}
}
class GCMPush extends GCM {
	constructor(){
		super();
	}
	execute(node) {
		node.log(this);
  	  	node.reportCommand(this.push.text);
	}
}
const classes = {
    GCMPush
};