/**
 * @fileoverview Mock webshot module for testing
 * 
 * @author Jorge Epuñan <juanbrujo@gmail.com>
 * @version 1.1.1
 */

var fs = require('fs');
var path = require('path');

/**
 * Mock webshot function that simulates screenshot capture
 * @param {string} url - URL to screenshot
 * @param {string} filename - Output filename
 * @param {Object} options - Webshot options
 * @param {Function} callback - Callback function
 */
function mockWebshot(url, filename, options, callback) {
    // Simulate processing delay
    setTimeout(function() {
        if (url.indexOf('error') !== -1) {
            return callback(new Error('Screenshot failed'));
        }
        
        // Create a mock PNG file (just empty content for testing)
        var dir = path.dirname(filename);
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch (err) {
                // For Node.js 6.17.1 compatibility
                if (err.code !== 'EEXIST') {
                    return callback(err);
                }
            }
        }
        
        fs.writeFile(filename, 'mock-png-data', function(err) {
            if (err) return callback(err);
            callback(null);
        });
    }, 50);
}

/**
 * Mock getScreenshot function for testing
 * @param {string} sitename - Website URL
 * @param {Function} callback - Callback function
 */
mockWebshot.getScreenshot = function(sitename, callback) {
    // Skip screenshots for buscandriu URLs
    if (sitename && sitename.indexOf('buscandriu') !== -1) {
        return callback(null, '⏭️  · Skipped screenshot for ' + sitename);
    }
    
    var filename = './test-latest/' + Date.now() + '.png';
    
    mockWebshot(sitename, filename, {}, function(err) {
        if (err) {
            return callback(new Error('Error taking screenshot for ' + sitename + ': ' + err.message));
        }
        
        callback(null, '📸 · ' + sitename + ' screenshot saved!');
    });
};

module.exports = mockWebshot;
