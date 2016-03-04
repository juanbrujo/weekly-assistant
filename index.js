var path			= require('path');
var pkg 			= require(path.join(__dirname, './package.json'));
var fs 				= require('fs');
var inquirer 	= require('inquirer');
var program 	= require('commander');
var request 	= require('request');
var cheerio 	= require('cheerio');
var webshot 	= require('webshot');
var webshotOptions = {
	encoding: 'binary',
	renderDelay: 1000
};
var sites 	= require('./20160303/sites.js');

program
	.version( pkg.version )
	.parse( process.argv );


/**
 * cleanName( url );
 * @url: string | url
 * return string
 */
var cleanName = function( url ){

	return url.split('/')[2];

}


/**
 * getScreenshot( sitename );
 * @sitename: string | clean name of site 
 *
 * get and save a screenshot of each site
 *
 */
function getScreenshot( sitename ){

	webshot(sitename, './20160303/' + sitename + '.png', webshotOptions, function(err) {
	  console.log(sitename + ' screenshot OK!');
	});

}


/**
 * getContent( sitename );
 * @sitename: string | clean name of site 
 *
 * scrape title & descripcion of each site
 *
 */
function getContent( sitename ){

	var title = '';
	var description = '';

	request(sitename, function(error, response, html) {

		if (!error && response.statusCode == 200) {

			var $ = cheerio.load(html);

			title = $("title").text();
			description = $('meta[name="description"]').attr('content');

			writeToFile( title + ' | ' +  description, cleanName( sitename ) );

		}

	});

}


/**
 * writeToFile( @params );
 * @content: string | content scraped
 * @sitename: string | clean name of site 
 *
 * saves content to file for each site
 *
 */
function writeToFile( content, sitename ) {

	fs.writeFile('./20160303/' + sitename + '.md', content, function(err) {

		if(err) {

			return console.log(err);

		}

		console.log('The file ' + sitename + ' was created!');

	});

}


/**
 * parseSites( @params );
 *
 * @array: array | of site url's
 * @callback: function | callback
 *
 */
function parseSites( array, callback ){

	array.forEach(function(value, index){

		var sitename = cleanName( value );

		// take screenshot
		getScreenshot( sitename );

		// get content & save to file
		getContent( value )

	});

	// callback
	if (callback && typeof(callback) === "function") {

		callback.apply();

	}

}


/**
 * APPLY
 */
parseSites(sites, function(){
	console.log('Everything OK');
});

