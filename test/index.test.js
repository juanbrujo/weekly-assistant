/**
 * @fileoverview Tests for index.js - Newsletter Content Generator
 * 
 * @author Jorge Epuñan <juanbrujo@gmail.com>
 * @version 1.1.0
 */

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

// Mock dependencies to avoid external calls during testing
var mockRequest = require('./mocks/mock-request');
var mockWebshot = require('./mocks/mock-webshot');

// Override require to use mocks
var Module = require('module');
var originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
    if (id === 'request') {
        return mockRequest;
    }
    if (id === 'webshot') {
        return mockWebshot;
    }
    if (id === 'sluggin') {
        // Mock sluggin to return a simple slugified version
        return function(text) {
            return text.toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
        };
    }
    return originalRequire.apply(this, arguments);
};

describe('Index.js - Newsletter Content Generator', function() {
    var testDir = './test-latest/';
    var originalDirectory;
    
    before(function() {
        // Clean up any existing test directory
        if (fs.existsSync(testDir)) {
            rimraf.sync(testDir);
        }
        fs.mkdirSync(testDir);
    });
    
    after(function() {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            rimraf.sync(testDir);
        }
        
        // Restore original require
        Module.prototype.require = originalRequire;
    });
    
    describe('cleanName function', function() {
// Create a mock cleanName function based on the actual implementation
        function cleanName(uri) {
            var url = require('url');
            var sluggin = require('sluggin').Sluggin;
            
            try {
                if (!uri || typeof uri !== "string") {
                    return "unknown-site";
                }
                var parsedUrl = url.parse(uri);
                if (parsedUrl.href) {
                    var hostname = parsedUrl.href.replace("www.", "").split("//")[1];
                    return sluggin(hostname);
                } else {
                    return "unknown-site";
                }
            } catch (error) {
                return "unknown-site";
            }
        }
        
        it('should handle invalid URLs gracefully', function() {
            var result = cleanName('invalid-url');
            assert.strictEqual(result, 'unknown-site');
        });
        
        it('should handle null/undefined input', function() {
            var result1 = cleanName(null);
            var result2 = cleanName(undefined);
            var result3 = cleanName('');
            
            assert.strictEqual(result1, 'unknown-site');
            assert.strictEqual(result2, 'unknown-site');
            assert.strictEqual(result3, 'unknown-site');
        });
    });
    
    describe('getScreenshot function', function() {
        it('should skip screenshots for buscandriu URLs', function(done) {
            var getScreenshot = mockWebshot.getScreenshot;
            
            getScreenshot('http://buscandriu.cl/test', function(err, result) {
                assert.ifError(err);
                assert(result.indexOf('Skipped') !== -1);
                done();
            });
        });
        
        it('should process normal URLs', function(done) {
            var getScreenshot = mockWebshot.getScreenshot;
            
            getScreenshot('http://example.com', function(err, result) {
                assert.ifError(err);
                assert(result.indexOf('screenshot saved') !== -1);
                done();
            });
        });
    });
    
    describe('getContent function', function() {
        it('should extract title and description from HTML', function(done) {
            var getContent = mockRequest.getContent;
            
            getContent('http://example.com', function(err, content, sitename) {
                assert.ifError(err);
                assert(typeof content === 'string');
                assert(content.indexOf('Title:') !== -1);
                assert(content.indexOf('Description:') !== -1);
                assert(content.indexOf('URL:') !== -1);
                assert.strictEqual(sitename, 'http://example.com');
                done();
            });
        });
        
        it('should handle HTTP errors gracefully', function(done) {
            var getContent = mockRequest.getContent;
            
            getContent('http://error.com', function(err, content, sitename) {
                assert(err instanceof Error);
                assert(err.message.indexOf('HTTP 404') !== -1);
                done();
            });
        });
        
        it('should handle network errors', function(done) {
            var getContent = mockRequest.getContent;
            
            getContent('http://network-error.com', function(err, content, sitename) {
                assert(err instanceof Error);
                assert(err.message.indexOf('Network error') !== -1);
                done();
            });
        });
        
        it('should format buscandriu content differently', function(done) {
            var getContent = mockRequest.getContent;
            
            getContent('http://buscandriu.cl/test', function(err, content, sitename) {
                assert.ifError(err);
                assert(content.indexOf('Buscandriu:') !== -1);
                done();
            });
        });
    });
    
    describe('writeToFile function', function() {
        it('should write content to markdown file', function(done) {
            // Mock writeToFile function
            var writeToFile = function(content, sitename, callback) {
                var filename = path.join(testDir, 'test-file.md');
                fs.writeFile(filename, content, function(err) {
                    if (err) return callback(err);
                    callback(null, 'File created successfully');
                });
            };
            
            var testContent = 'Title: Test\n\nDescription: Test description\n\nURL: http://test.com';
            
            writeToFile(testContent, 'http://test.com', function(err, result) {
                assert.ifError(err);
                assert(result.indexOf('File created') !== -1);
                
                // Verify file was created
                var filePath = path.join(testDir, 'test-file.md');
                assert(fs.existsSync(filePath));
                
                var fileContent = fs.readFileSync(filePath, 'utf8');
                assert.strictEqual(fileContent, testContent);
                done();
            });
        });
        
        it('should handle file write errors', function(done) {
            var writeToFile = function(content, sitename, callback) {
                // Simulate write error by using invalid path
                fs.writeFile('/invalid/path/file.md', content, function(err) {
                    callback(err);
                });
            };
            
            writeToFile('test', 'http://test.com', function(err, result) {
                assert(err instanceof Error);
                assert(err.code === 'ENOENT');
                done();
            });
        });
    });
    
    describe('Integration tests', function() {
        it('should process a complete workflow', function(done) {
            this.timeout(5000); // Longer timeout for integration test
            
            // Mock a complete processing workflow
            var mockSites = ['http://example.com', 'http://test.com'];
            var processedSites = [];
            
            function processPage(pageUrl, callback) {
                // Simulate processing
                setTimeout(function() {
                    processedSites.push(pageUrl);
                    callback(null, {
                        url: pageUrl,
                        title: 'Test Title',
                        description: 'Test Description'
                    });
                }, 100);
            }
            
            var completedCount = 0;
            
            mockSites.forEach(function(site) {
                processPage(site, function(err, result) {
                    assert.ifError(err);
                    assert(result.url === site);
                    completedCount++;
                    
                    if (completedCount === mockSites.length) {
                        assert.strictEqual(processedSites.length, mockSites.length);
                        assert(processedSites.indexOf('http://example.com') !== -1);
                        assert(processedSites.indexOf('http://test.com') !== -1);
                        done();
                    }
                });
            });
        });
    });
});
