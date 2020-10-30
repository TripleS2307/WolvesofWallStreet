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
	
	return (<div>
		 {(() => {
			 if(results){
				 return (<div id="white-bg"><div id="results-header">
						<div id="header-logo">logo</div>
						<div id="header-search-bar"><form onSubmit={handleQuery}><input type="text" name="s" value={query} onChange={e => setQuery(e.target.value)} /></form></div>
						</div><br /><br /><div id="stock-box">
					 {results.stocks.map((stock) =>
						<div class={(stock.sentiment > 0) ? "stock-good" : "stock-bad"}><a href={"https://finance.yahoo.com/quote/" + stock.symbol} target="_blank">{stock.symbol}</a> {(stock.sentiment > 0) ? "good" : "bad"}</div>
					 )}
					 </div><div class="search-results"><div class="search-results-header">Search Results</div>
					 {results.results.map((result) =>
						<div class="search-result">
						 <div class="result-url">{result.url}</div>
						 <div class="result-link"><a href={result.url} target='_blank'>{result.title}</a></div>
						 <div class="result-sentiment">({result.sentiment})</div>
						 <div class="result-body">{result.body.substring(0,200)}...</div>
						</div>
					 )}
					 </div><br /><br /></div>);
				 
			 }else{
				 return <form onSubmit={handleQuery}>
						<div class="center">
						<div id="search-bar"><span><input type="text" name="s" value={query} onChange={e => setQuery(e.target.value)} /></span></div>
						</div></form>
			 }
		 })()}
		 <br /><br />
		 </div>);
}

export default App;
