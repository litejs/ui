


var Data = List.extend({
	syncMethods: List.prototype.syncMethods.concat("isSubsetFrom"),
	init: function (name) {
		var list = this
		, cache = Data.cached

		for (var otherList in cache) {
			otherList = cache[otherList]
			if (list.isSubsetFrom(otherList)) {
				break
			}
		}

		list.load()
	},
	load: function() {
		var list = this
		, resume = list.wait()

		xhr.get("data/" + list.name + ".json", function(err, result) {
			list.removeAll()
			if (!err) result.forEach(list.add, list)
			resume()
			list.emit("load")
		})
		return list
	},
	isSubsetFrom: function ( o/*verlaped*/ ) {
		return this.name.slice(0, o.name.length) == o.name && this.name.slice(o.name.length).indexOf("/") == -1
	}
})

El.data.Data = Data

