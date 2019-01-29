
/* litejs.com/MIT-LICENSE.txt */



!function(process) {
	var seq = 0
	, tickQueue = []
	, tickImage = new Image()

	tickImage.onerror = function() {
		var fn
		, i = 0
		, queue = tickQueue
		for (tickQueue = []; fn = queue[i++]; ) {
			fn()
		}
	}

	// IE11 throws when setImmediate called without window context
	// IE5-8 Image.onerror is sync when bad mime.
	// with "data:image/gif," it is async but logs errors
	nextTick: window.setImmediate ? setImmediate.bind(window) : function(fn) {
		~-tickQueue.push(fn)||(tickImage.src = "data:," + seq++)
	}

}(process)

