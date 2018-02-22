module.exports = {
	isString : function(value){
		return typeof value === 'string';
	},
	copyProps : function(source,destination){
        for(var prop in source){
            destination[prop] = source[prop];
        }
    }
}