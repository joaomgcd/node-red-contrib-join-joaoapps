Object.defineProperty(Array.prototype, "groupBy", {
    value: function groupBy(keyGetter) {
		if(!this || this.length == 0) return [];

		return this.reduce(function(rv, x) {
		  	if(!rv.groups){
		  		rv.groups = [];
		  	}
		  	var key = keyGetter(x);
		  	var group = rv.groups.find(existing=>existing.key != null && existing.key == key);
		  	if(!group){
		  		group = {};
		  		group.key = key;
		  		group.values = [];
		  		rv.groups.push(group);
		  	}
		  	group.values.push(x);
		    return rv;
	  	}, {}).groups;
	}
});
Object.defineProperty(Array.prototype, "count", {
    value: function count(filter) {
    	return this.filter(filter).length;
    }
});