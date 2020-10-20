fs = require('fs');

module.exports = {
	index: function () {
		
		var files = [];
		var fileCount = 0;
		
		var postings = {};
		var documents = [];
		
		filenames = fs.readdirSync("../data");
		var i = 0;
		while(i < filenames.length){

			// if is directory then get all files in subdirectory too
			if(fs.lstatSync("../data/" + filenames[i]).isDirectory()){
				// get the new filenames from the subdirectory
				let newFiles = fs.readdirSync("../data/" + filenames[i]);
				
				// prepend the subdirectory path to each filename
				newFiles.forEach(function(part, index, arr){
					arr[index] = filenames[i] + "/" + arr[index];
				});
				
				// append the new files to the filenames array
				filenames = filenames.concat(newFiles);
				
				delete filenames[i]; // sets this element (the subdirectory) to undefined
			}
			
			// remove any files that don't have the .json extension
			if(filenames[i] && fs.lstatSync("../data/" + filenames[i]).isFile()){
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
					var data = JSON.parse(fs.readFileSync('../data/' + file, { encoding: 'utf8' }));
				} catch(err) {
					// something went wrong
					console.log(err);
					return {};
				}
				
				files.push(data['article'][0]);
			}
		}
		
		for(i in files){
			// split the body into words (splitting on anything other than a letter)
			var bodyWords = files[i]['body'].toLowerCase().split(/[^a-zA-Z]+/);
			
			// loop through each word and add the document to the postings list for that word
			for(i in bodyWords){
				if(postings.hasOwnProperty(bodyWords[i])){
					postings[bodyWords[i]].add(i);
				}else{
					postings[bodyWords[i]] = new Set([i]);
				}
			}
		}
		
		//console.log(postings);

		for(i in files){
			
			let doc = {};
			
						
			// split the body into words (splitting on anything other than a letter)
			var bodyWords = files[i]['body'].toLowerCase().split(/[^a-zA-Z]+/);
			
			let termFreq = {};
			let docSize = bodyWords.length;
			
			// loop through each word and add it to the vocab or increase the count
			for(j in bodyWords){
				if(termFreq.hasOwnProperty(bodyWords[j])){
					termFreq[bodyWords[j]] += 1;
				}else{
					termFreq[bodyWords[j]] = 1;
				}
			}
			
			// loop through each word and apply TF-IDF
			for(term in termFreq){
				let tf = termFreq[term] / docSize;
				//console.log("TF: " + tf);
				let idf = Math.log(fileCount / postings[term].size);
				if(idf == 0){
					console.log("everyone has: " + term);
				}
				termFreq[term] = tf * idf;
			}
			
			try{
				doc["url"] = files[i]["url"];
				doc["published"] = files[i]["published"];
				doc["headline"] = files[i]["headline"];
			} catch(err){
				console.log("Problem with " + i + ": " + files[i]);
			}
			doc["bodyVector"] = termFreq;
			
			documents.push(doc);
		}
		
		console.log("Done, thank you.");
		

		return documents;

	}
};