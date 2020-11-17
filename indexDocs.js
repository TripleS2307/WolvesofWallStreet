fs = require('fs');

module.exports = {
	index: function () {
		
		var files = [];
		var fileCount = 0;
		
		var postings = {};
		var documents = [];
		
		var avgLen_title = 0;
		var avgLen_body = 0;
		
		var B_title = 0.75;
		var B_body = 0.75;
		
		var W_title = 5;
		var W_body = 1;
		
		var K1 = 3.0;
		
		var stock_multiplier = 5.0; // stock symbol term weight is multiplied by this value
		
		
		filenames = fs.readdirSync("./data");
		var i = 0;
		while(i < filenames.length){

			// if is directory then get all files in subdirectory too
			if(fs.lstatSync("./data/" + filenames[i]).isDirectory()){
				// get the new filenames from the subdirectory
				let newFiles = fs.readdirSync("./data/" + filenames[i]);
				
				// prepend the subdirectory path to each filename
				newFiles.forEach(function(part, index, arr){
					arr[index] = filenames[i] + "/" + arr[index];
				});
				
				// append the new files to the filenames array
				filenames = filenames.concat(newFiles);
				
				delete filenames[i]; // sets this element (the subdirectory) to undefined
			}
			
			// remove any files that don't have the .json extension
			if(filenames[i] && fs.lstatSync("./data/" + filenames[i]).isFile()){
				if(filenames[i].split('.').pop() != "json"){
					delete filenames[i]; // set the non-json element to undefined
				}else{
					fileCount++;
				}
			}
			i++;
		}
		
		console.log("Please wait, indexing " + fileCount + " files...");
		
		// loop through all the files in the list and store the data from them in an array of objects
		for(file of filenames){
			if(file){ // skip the "undefined" entries

				try{
					// read the file, and parse it into a JSON object
					var data = JSON.parse(fs.readFileSync('./data/' + file, { encoding: 'utf8' }));
				} catch(err) {
					// something went wrong
					console.log(err);
					return {};
				}
				
				files.push(data['article'][0]);
			}
		}
		
		// get a set of all stock symbols
		var stock_symbols = new Set();
		fs.readFileSync('./data/stock_symbols.txt', 'utf-8').split(/\r?\n/).forEach(function(line) {
			if(line != ""){
				stock_symbols.add(line);
			}
		});
		
		
		// loop through all the documents the first time to create postings list and get average body and title length
		for(i in files){

			// split the body into words (splitting on anything other than a letter)
			let titleWords = files[i]['headline'].toLowerCase().split(/[^a-zA-Z]+/);
			
			// loop through each word and add the document to the postings list for that word
			for(j in titleWords){
				if(postings.hasOwnProperty(titleWords[j])){
					postings[titleWords[j]].add(i);
				}else{
					postings[titleWords[j]] = new Set([i]);
				}
			}
			
			avgLen_title += titleWords.length;
			
			
			// split the body into words (splitting on anything other than a letter)
			let bodyWords = files[i]['body'].split(/[^a-zA-Z]+/);
			
			// lowercase the words that aren't stock symbols
			for(j in bodyWords){
				if(!stock_symbols.has(bodyWords[j]))
					bodyWords[j] = bodyWords[j].toLowerCase();
			}
			
			// loop through each word and add the document to the postings list for that word
			for(j in bodyWords){
				if(postings.hasOwnProperty(bodyWords[j])){
					postings[bodyWords[j]].add(i);
				}else{
					postings[bodyWords[j]] = new Set([i]);
				}
			}
			
			avgLen_body += bodyWords.length;
		}
		
		avgLen_title /= files.length;
		avgLen_body /= files.length;
		

		// loop through all the documents a second time to generate the weighted term frequency vector for each document
		for(i in files){
			
			let doc = {};
			
			let terms = {};
			
			// split the title into words (splitting on anything other than a letter)
			let titleWords = files[i]['headline'].toLowerCase().split(/[^a-zA-Z]+/);
			
			let termFreq_title = {};
			let titleSize = titleWords.length;
			
			// loop through each word and add it to the vocab or increase the count
			for(j in titleWords){
				if(termFreq_title.hasOwnProperty(titleWords[j])){
					termFreq_title[titleWords[j]] += 1;
				}else{
					termFreq_title[titleWords[j]] = 1;
					if(titleWords[j] != ""){
						terms[titleWords[j]] = 0;
					}
				}
			}
			
			// split the body into words (splitting on anything other than a letter)
			let bodyWords = files[i]['body'].split(/[^a-zA-Z]+/);
			
			// lowercase the words that aren't stock symbols
			for(j in bodyWords){
				if(!stock_symbols.has(bodyWords[j]))
					bodyWords[j] = bodyWords[j].toLowerCase();
			}
			
			let termFreq_body = {};
			let bodySize = bodyWords.length;
			
			// loop through each word and add it to the vocab or increase the count
			for(j in bodyWords){
				if(termFreq_body.hasOwnProperty(bodyWords[j])){
					termFreq_body[bodyWords[j]] += 1;
				}else{
					termFreq_body[bodyWords[j]] = 1;
					if(bodyWords[j] != "" && !terms.hasOwnProperty(bodyWords[j])){
						terms[bodyWords[j]] = 0;
					}
				}
			}
			
			// loop through each word and apply BM25 weighting
			for(term in terms){
				let tf_title = 0;
				if(termFreq_title.hasOwnProperty(term)){
					tf_title = termFreq_title[term] / ( (1-B_title) + (B_title * (titleSize/avgLen_title)) );
				}
				let tf_body = 0;
				if(termFreq_body.hasOwnProperty(term)){
					tf_body = termFreq_body[term] / ( (1-B_body) + (B_body * (bodySize/avgLen_body)) );
				}
				
				let W_dt = (W_title * tf_title + W_body * tf_body);
				
				let idf = Math.log(fileCount / postings[term].size);
				if(idf == 0){
					//console.log("everyone has: " + term);
				}
				
				// if the term is a stock symbol then multiply by the stock multiplier
				if(stock_symbols.has(term)){
					terms[term] = (W_dt / (K1 + W_dt)) * idf * stock_multiplier;
				}else{
					terms[term] = (W_dt / (K1 + W_dt)) * idf;
				}
				
			}
			
			try{
				doc["url"] = files[i]["url"];
				doc["published"] = files[i]["published"];
				doc["headline"] = files[i]["headline"];
				doc["body"] = files[i]["body"];
			} catch(err){
				console.log("Problem with " + i + ": " + files[i]);
			}
			doc["terms"] = terms;
			
			documents.push(doc);
			
		}
		
		console.log("Done, thank you.");
		

		return documents;

	}
};