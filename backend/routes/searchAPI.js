var express = require("express");
var Sentiment = require('sentiment');
var router = express.Router();

router.get("/:query", function(req, res, next) {
	
	let documents = req.app.get('documents');
	let timestamp = req.app.get('timestamp');
	
	var resultCount = 10; // number of results to return
	
	var lambda = 0.1; // this is a parameter of BM25 that we can tweak
	
	// split the query into terms
	let queryTerms = req.params["query"].toLowerCase().split(/[^a-zA-Z]+/);
	
	let resultsList = [];
	
	// loop through each document and calculate a score
	for(d in documents){
		let score = 0;
		
		// sum up the score for each query term
		for(queryTerm of queryTerms){
			if(documents[d]["terms"].hasOwnProperty(queryTerm)){
				score += documents[d]["terms"][queryTerm];
			}
		}
		
		// add the timestamp feature
		let daysOld = (timestamp - documents[d]["published"]) / 86400;
		score += lambda * (2 + Math.log(5 / daysOld));
		
		// store the document id and the score in an array
		resultsList.push({"id": d, "score": score});
	}
	
	//sort the list of results in descending order
	resultsList = resultsList.sort(function (a, b) {
		return b.score - a.score;
	});
	
	// start building the object that will be returned to front end
	var data = {
		"sentiment": 10.5, // TODO: change this to actual sentiment score
		"stocks": [],
		"results": []
	}

	var sentiment = new Sentiment();

	// add the top n results to the returned object
	for(let i = 0; i < resultCount; i++){
		for(term in documents[resultsList[i]["id"]]["terms"]){
			// find stock symbols by looking for upper case words (only stock symbols are uppercase)
			if(term[0] == term[0].toUpperCase()){
				if(!data["stocks"].some(el => el.symbol === term)){
					data["stocks"].push({"symbol": term, "sentiment": 0});
				}
				
				// update stock with sentiment score from this document
				let index = data["stocks"].findIndex(el => el["symbol"] == term);
				data["stocks"][index] = {...data["stocks"][index], "sentiment": data["stocks"][index]["sentiment"] + sentiment.analyze(documents[resultsList[i]["id"]]["body"])["comparative"]};
			}
		}
		data["results"].push({
			"url": documents[resultsList[i]["id"]]["url"],
			"title": documents[resultsList[i]["id"]]["headline"],
			"body": documents[resultsList[i]["id"]]["body"],
			"sentiment": resultsList[i]["score"] // TODO: change this to actual sentiment score
		});
	}
	console.log(data["stocks"]);

	res.json(data); // send JSON to React front end
});

module.exports = router;