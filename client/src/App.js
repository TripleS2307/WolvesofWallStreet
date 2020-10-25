import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
	const queryString = require('query-string');
	const getQueryStringValue = (key) => {
		const values = queryString.parse(window.location.search);
		return values[key];
	}

	const [query, setQuery] = useState(getQueryStringValue('s') || '');
	const [results, setResults] = useState( null );
	
	const search = () => {
		fetch("http://localhost:9000/search/"+query)
			.then(res => res.json())
			//.then(data => alert(data["stocks"]))
			.then(data => setResults(data))
			.catch(err => err);
	}
	
	const handleQuery = (e) => {
	//	alert(query);
	}
	
	
	
	useEffect(() => {
		if(query != ''){
			search();
		}
	}, []);
	
	return (
		<div>
		 <form onSubmit={handleQuery}>
		  <input type="text" name="s" value={query} onChange={e => setQuery(e.target.value)} />
		 </form>
		 {(() => {
			 if(results){
				 return results.stocks.map((stock) =>
					<div>{stock.symbol} sentiment: {stock.sentiment}</div>
				 );
				 
			 }
		 })()}
		 {(() => {
			 if(results){
				 return results.results.map((result) =>
					<div>
					 <a href={result.url} target='_blank'>{result.title}</a> ({result.sentiment})
					 <div>{result.body}</div>
					</div>
				 );
			 }
		 })()}
		</div>
	);
}

export default App;
