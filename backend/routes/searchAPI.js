var express = require("express");
var router = express.Router();

router.get("/:query", function(req, res, next) {
	
	console.log(req.params["query"]); // the user's query
	
	var documents = req.app.get('documents'); // index will be the object that
	console.log(documents);
	
	var data = {
		"sentiment": 10.5,
		"results": [
		  {
			"url": "http://marketwatch.com",
			"title": "Market Watch",
			"body": "Some stuff about Market Watch",
			"sentiment": -2
		  },
		  {
			"url": "http://finance.yahoo.com",
			"title": "Yahoo! Finanace",
			"body": "Some stuff about yahoo finance",
			"sentiment": 20
		  },
		  {
			"url": "http://stocknews.com",
			"title": "StockNews.com",
			"body": "Some stuff about stock news",
			"sentiment": 1.5
		  }
		]
	}
	res.json(data); // send JSON to React front end
});

module.exports = router;