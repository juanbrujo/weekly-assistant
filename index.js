/**
 * @fileoverview Weekly Assistant - Automated web scraper and screenshot tool
 * 
 * This application processes a list of websites to:
 * - Take screenshots of each site
 * - Scrape title and description metadata
 * - Generate markdown files with formatted content
 * 
 * @author Jorge Epuñan <juanbrujo@gmail.com>
 * @version 1.0.0
 * @since 2016
 */

var async = require("async");
var url = require("url");
var path = require("path");
var fs = require("fs");
var inquirer = require("inquirer");
var program = require("commander");
var request = require("request");
var cheerio = require("cheerio");
var webshot = require("webshot");
var sluggin = require("sluggin").Sluggin;

var pkg = require(path.join(__dirname, "./package.json"));
var sites = require("./sites.js");
var directory = "./latest/";
program
	.version( pkg.version )
	.parse( process.argv );

/**
 * @function cleanName
 * @param {string} uri - The URI to clean (e.g., 'https://www.example.com/path')
 * @returns {string} A cleaned, slugified name suitable for filenames (e.g., 'examplecompath')
 * @throws {Error} Returns 'unknown-site' if URI is invalid or processing fails
 */
function cleanName(uri) {
	try {
		if (!uri || typeof uri !== "string") {
			return "unknown-site";
		}
		var parsedUrl = url.parse(uri);
		var hostname = parsedUrl.href.replace("www.", "").split("//")[1];
		return sluggin(hostname);
	} catch (error) {
		console.error("Error cleaning name for URI: " + uri, error.message);
		return "unknown-site";
	}
}

/**
 * @function getScreenshot
 * @param {string} sitename - The complete URL of the website to screenshot
 * @param {function} callback - Node.js style callback function
 * @param {Error|null} callback.error - Error object if screenshot fails, null on success
 * @param {string} callback.result - Success message with site name
 */
function getScreenshot(sitename, callback) {
	var webshotOptions = {
		encoding: "binary",
		renderDelay: 1000,
		screenSize: {
			width: 1024,
			height: 768
		},
		shotSize: {
			width: 1024,
			height: "all"
		}
	};

	var filename = path.join(directory, cleanName(sitename) + ".jpg");
	console.log("📸 Taking screenshot: " + sitename);

	webshot(sitename, filename, webshotOptions, function(err) {
		if (err) {
			console.error("Error taking screenshot for " + sitename + ":", err.message);
			return callback(err);
		}
		callback(null, "📸 · " + sitename + " screenshot saved!");
	});
}

/**
 * @function getContent
 * @param {string} sitename - The complete URL to scrape
 * @param {function} callback - Node.js style callback function
 * @param {Error|null} callback.error - Error object if request/parsing fails
 * @param {string} callback.content - Formatted content string with title, description, and HTML
 * @param {string} callback.sitename - The original sitename (passed through)
 */
function getContent(sitename, callback) {
	var requestOptions = {
		url: sitename,
		timeout: 10000,
		headers: {
			"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
		}
	};

	console.log("🔍 Scraping content: " + sitename);

	request(requestOptions, function(error, response, html) {
		if (error) {
			console.error("Request error for " + sitename + ":", error.message);
			return callback(error);
		}

		if (response.statusCode !== 200) {
			var statusError = new Error("HTTP " + response.statusCode + " - " + sitename);
			console.error(statusError.message);
			return callback(statusError);
		}

		try {
			var $ = cheerio.load(html);
			var title = $("title").text().trim() || "No title found";
			var description = $("meta[name=\"description\"]").attr("content") || 
								 $("meta[property=\"og:description\"]").attr("content") ||
								 "No description found";

			var basicFormat = "Title: " + title + "\n\nDescription: " + description + "\n\nURL: " + sitename + "\n\n";
			var fullFormat;

			if (sitename.indexOf("buscandriu") !== -1) {
				var cleanTitle = title.split("|")[0].trim();
				fullFormat = "Buscandriu: <li style=\"text-align: left;\">" + cleanTitle + " <a href=\"" + sitename + "\" target=\"_blank\"><strong>[link]</strong></a></li>";
			} else {
				fullFormat = "Full format: <a href=\"" + sitename + "\" target=\"_blank\"><strong>" + title + "</strong></a>: " + description + " <a href=\"" + sitename + "\" target=\"_blank\"><strong>[link]</strong></a><br /><br />";
			}

			callback(null, basicFormat + fullFormat, sitename);
		} catch (parseError) {
			console.error("Error parsing HTML for " + sitename + ":", parseError.message);
			callback(parseError);
		}
	});
}

/**
 * @function writeToFile
 * @param {string} content - The formatted content to write (markdown/HTML)
 * @param {string} sitename - The original website URL (will be cleaned for filename)
 * @param {function} callback - Node.js style callback function
 * @param {Error|null} callback.error - Error object if file write fails
 * @param {string} callback.result - Success message with filename
 */
function writeToFile(content, sitename, callback) {
	var filename = path.join(directory, cleanName(sitename) + ".md");
	fs.writeFile(filename, content, function(err) {
		if (err) {
			console.error("Error writing file for " + sitename + ":", err.message);
			return callback(err);
		}
		console.log("Writing " + cleanName(sitename) + ".md");
		callback(null, "📂 · The file " + cleanName(sitename) + ".md was created!");
	});
}

/**
 * @function getContentAndWriteToFile
 * @param {string} uri - The website URL to process
 * @param {function} callback - Node.js style callback function
 * @param {Error|null} callback.error - Error from either scraping or writing
 * @param {string} callback.result - Success message from file write operation
 */
function getContentAndWriteToFile(uri, callback) {
	async.waterfall([
		async.apply(getContent, uri),
		writeToFile
	], callback);
}

/**
 * @function parseUrl
 * @param {string} uri - The complete website URL to process
 * @param {function} callback - Node.js style callback function
 * @param {Error|null} callback.error - Error if either operation fails
 * @param {Array<string>} callback.results - Array of success messages from both operations
 */
function parseUrl(uri, callback) {
	async.parallel([
		// Take screenshot
		async.apply(getScreenshot, uri),
		// Get content and save to file
		async.apply(getContentAndWriteToFile, uri)
	], callback);
}

/**
 * @function parseSites
 * @param {string[]} sites - Array of website URLs to process
 * @param {function} callback - Node.js style callback function
 * @param {Error|null} callback.error - Error if validation fails or any site processing fails
 * @param {Array<Array<string>>} callback.results - Nested array of results from all sites
 */
function parseSites(sites, callback) {
	if (!Array.isArray(sites) || sites.length === 0) {
		return callback(new Error("Sites array is empty or invalid"));
	}
	async.map(sites, parseUrl, callback);
}

/**
 * @function main
 * @returns {void} Does not return a value, uses process.exit() on errors
 */
function main() {
	// Ensure directory exists
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, { recursive: true });
	}

	parseSites(sites, function(err, results) {
		if (err) {
			console.error("Error processing sites:", err.message);
			process.exit(1);
		}

		if (results && Array.isArray(results)) {
			results.forEach(function(result) {
				if (Array.isArray(result)) {
					result.forEach(function(log) {
						if (log) {
							console.log(log);
						}
					});
				}
			});
		}

		console.log("✅ Processing completed successfully!");
	});
}

// Start the application
main();
