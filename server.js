var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
var indexer = require("./indexDocs");
const app = express();
const path = require('path');
const port = process.env.PORT || 5000;

var indexRouter = require('./routes/index');
var searchAPIRouter = require('./routes/searchAPI');

app.use("/search", searchAPIRouter);

var documents = indexer.index();
app.set('documents', documents);
app.set('timestamp', 1602280221); // this is when the documents were scrapped from the web, so our system runs as if this is the current date/time

//Static file declaration
app.use(express.static(path.join(__dirname, 'client/build')));

//production mode
if(process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, 'client/build')));
	//  
	app.get('*', (req, res) => {
		res.sendfile(path.join(__dirname = 'client/build/index.html'));
	})
}

//build mode
app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname+'/client/public/index.html'));
});

app.use('/', indexRouter);

	
//start server
app.listen(port, (req, res) => {
	console.log( `server listening on port: ${port}`);
});