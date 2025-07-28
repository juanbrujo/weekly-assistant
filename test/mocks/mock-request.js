/**
 * @fileoverview Mock request module for testing
 * 
 * @author Jorge Epuñan <juanbrujo@gmail.com>
 * @version 1.1.1
 */

/**
 * Mock request function that simulates HTTP requests
 * @param {Object|string} options - Request options or URL
 * @param {Function} callback - Callback function
 */
function mockRequest(options, callback) {
    var url = typeof options === 'string' ? options : options.url;
    
    // Simulate network delay
    setTimeout(function() {
        if (url.indexOf('network-error.com') !== -1) {
            return callback(new Error('Network error'));
        }
        
        if (url.indexOf('error.com') !== -1) {
            return callback(null, { statusCode: 404 }, '');
        }
        
        var mockHtml = '<html><head><title>Test Page Title</title>' +
                      '<meta name="description" content="Test page description">' +
                      '</head><body><h1>Test Content</h1></body></html>';
        
        if (url.indexOf('buscandriu') !== -1) {
            mockHtml = '<html><head><title>Buscandriu Test | Extra</title>' +
                      '<meta name="description" content="Buscandriu test description">' +
                      '</head><body><h1>Buscandriu Content</h1></body></html>';
        }
        
        callback(null, { statusCode: 200 }, mockHtml);
    }, 10);
}

/**
 * Mock getContent function for testing
 * @param {string} sitename - Website URL
 * @param {Function} callback - Callback function
 */
mockRequest.getContent = function(sitename, callback) {
    mockRequest(sitename, function(error, response, html) {
        if (error) {
            return callback(error);
        }
        
        if (response.statusCode !== 200) {
            return callback(new Error('HTTP ' + response.statusCode + ' - ' + sitename));
        }
        
        var cheerio = require('cheerio');
        var $ = cheerio.load(html);
        
        var title = $('title').text();
        var description = $('meta[name="description"]').attr('content');
        var basicFormat = 'Title: ' + title + '\n\nDescription: ' + description + '\n\nURL: ' + sitename + '\n\n';
        var fullFormat;
        
        if (sitename.indexOf('buscandriu') !== -1) {
            var cleanTitle = title.split('|')[0].trim();
            fullFormat = 'Buscandriu: <li style="text-align: left;">' + cleanTitle + ' <a href="' + sitename + '" target="_blank"><strong>[link]</strong></a></li>';
        } else {
            fullFormat = 'Full format: <a href="' + sitename + '" target="_blank"><strong>' + title + '</strong></a>: ' + description + ' <a href="' + sitename + '" target="_blank"><strong>[link]</strong></a><br /><br />';
        }
        
        callback(null, basicFormat + fullFormat, sitename);
    });
};

module.exports = mockRequest;
