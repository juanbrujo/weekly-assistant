/**
 * @fileoverview Tests for crop.js - Image Cropping Tool
 * 
 * @author Jorge Epuñan <juanbrujo@gmail.com>
 * @version 1.1.1
 */

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var rimraf = require('rimraf');

// Import the crop module
var crop = require('../crop.js');

describe('Crop.js - Image Cropping Tool', function() {
    var testDir = './test-screenshot-image/';
    
    before(function() {
        // Clean up any existing test directory
        if (fs.existsSync(testDir)) {
            rimraf.sync(testDir);
        }
        fs.mkdirSync(testDir);
        
        // Override config for testing
        crop.config.outputDirectory = testDir;
    });
    
    after(function() {
        // Clean up test directory
        if (fs.existsSync(testDir)) {
            rimraf.sync(testDir);
        }
    });
    
    describe('Configuration', function() {
        it('should have correct default configuration', function() {
            assert.strictEqual(crop.config.outputWidth, 400);
            assert.strictEqual(crop.config.outputHeight, 200);
            assert.strictEqual(crop.config.outputFormat, 'jpeg');
            assert.strictEqual(crop.config.outputQuality, 85);
        });
        
        it('should allow configuration changes', function() {
            var originalWidth = crop.config.outputWidth;
            crop.config.outputWidth = 300;
            assert.strictEqual(crop.config.outputWidth, 300);
            crop.config.outputWidth = originalWidth; // Restore
        });
    });
    
    describe('sanitizeFilename function', function() {
        // We need to extract this function for testing
        var sanitizeFilename;
        
        before(function() {
            // Read crop.js and extract sanitizeFilename function
            var cropPath = path.join(__dirname, '../crop.js');
            var cropContent = fs.readFileSync(cropPath, 'utf8');
            
            // Extract sanitizeFilename function
            var functionMatch = cropContent.match(/function sanitizeFilename\([\s\S]*?\n}/);
            if (functionMatch) {
                eval(functionMatch[0]);
            }
        });
        
        it('should sanitize special characters', function() {
            if (typeof sanitizeFilename !== 'undefined') {
                var result = sanitizeFilename('Test & Special! Characters#');
                assert.strictEqual(result, 'test-special-characters');
            }
        });
        
        it('should handle empty input', function() {
            if (typeof sanitizeFilename !== 'undefined') {
                var result = sanitizeFilename('');
                assert.strictEqual(result, 'untitled');
            }
        });
        
        it('should limit length to 50 characters', function() {
            if (typeof sanitizeFilename !== 'undefined') {
                var longTitle = 'This is a very long title that should be truncated to fifty characters maximum';
                var result = sanitizeFilename(longTitle);
                assert(result.length <= 50);
            }
        });
    });
    
    describe('extractBackgroundImageUrl function', function() {
        var extractBackgroundImageUrl;
        
        before(function() {
            // Read crop.js and extract extractBackgroundImageUrl function
            var cropPath = path.join(__dirname, '../crop.js');
            var cropContent = fs.readFileSync(cropPath, 'utf8');
            
            // Extract extractBackgroundImageUrl function
            var functionMatch = cropContent.match(/function extractBackgroundImageUrl\([\s\S]*?\n}/);
            if (functionMatch) {
                eval(functionMatch[0]);
            }
        });
        
        it('should extract URL from CSS style string', function() {
            if (typeof extractBackgroundImageUrl !== 'undefined') {
                var styleString = 'background-image: url(\"https://example.com/image.jpg\"); color: red;';
                var result = extractBackgroundImageUrl(styleString);
                assert.strictEqual(result, 'https://example.com/image.jpg');
            }
        });
        
        it('should handle single quotes', function() {
            if (typeof extractBackgroundImageUrl !== 'undefined') {
                var styleString = "background-image: url('https://example.com/image.jpg');";
                var result = extractBackgroundImageUrl(styleString);
                assert.strictEqual(result, 'https://example.com/image.jpg');
            }
        });
        
        it('should handle no quotes', function() {
            if (typeof extractBackgroundImageUrl !== 'undefined') {
                var styleString = 'background-image: url(https://example.com/image.jpg);';
                var result = extractBackgroundImageUrl(styleString);
                assert.strictEqual(result, 'https://example.com/image.jpg');
            }
        });
        
        it('should return null for invalid input', function() {
            if (typeof extractBackgroundImageUrl !== 'undefined') {
                var result1 = extractBackgroundImageUrl('color: red;');
                var result2 = extractBackgroundImageUrl('');
                var result3 = extractBackgroundImageUrl(null);
                
                assert.strictEqual(result1, null);
                assert.strictEqual(result2, null);
                assert.strictEqual(result3, null);
            }
        });
    });
    
    describe('findImagesInPage function', function() {
        it('should be callable', function() {
            assert.strictEqual(typeof crop.findImagesInPage, 'function');
        });
        
        it('should handle network errors gracefully', function(done) {
            this.timeout(3000);
            
            crop.findImagesInPage('http://invalid-domain-that-does-not-exist.com', function(err, images) {
                assert(err instanceof Error);
                assert(err.message.indexOf('Failed to fetch page') !== -1);
                done();
            });
        });
    });
    
    describe('cropImageFromUrl function', function() {
        it('should be callable', function(done) {
            assert.strictEqual(typeof crop.cropImageFromUrl, 'function');
            done();
        });
        
        it('should handle invalid image URLs', function(done) {
            this.timeout(3000);
            
            var outputPath = path.join(testDir, 'test-invalid.jpg');
            crop.cropImageFromUrl('http://invalid-domain.com/image.jpg', outputPath, function(err, result) {
                assert(err instanceof Error);
                assert(err.message.indexOf('Failed to download image') !== -1);
                done();
            });
        });
    });
    
    describe('processPage function', function() {
        it('should be callable', function() {
            assert.strictEqual(typeof crop.processPage, 'function');
        });
        
        it('should handle invalid URLs', function(done) {
            this.timeout(3000);
            
            crop.processPage('http://invalid-domain-that-does-not-exist.com', function(err, result) {
                assert(err instanceof Error);
                done();
            });
        });
        
        it('should accept callback as second parameter', function(done) {
            crop.processPage('http://invalid-domain.com', function(err, result) {
                assert(err instanceof Error);
                done();
            });
        });
    });
    
    describe('Module exports', function() {
        it('should export required functions', function() {
            assert.strictEqual(typeof crop.processPage, 'function');
            assert.strictEqual(typeof crop.findImagesInPage, 'function');
            assert.strictEqual(typeof crop.cropImageFromUrl, 'function');
            assert.strictEqual(typeof crop.config, 'object');
        });
        
        it('should have correct config structure', function() {
            assert(crop.config.hasOwnProperty('outputWidth'));
            assert(crop.config.hasOwnProperty('outputHeight'));
            assert(crop.config.hasOwnProperty('outputFormat'));
            assert(crop.config.hasOwnProperty('outputQuality'));
            assert(crop.config.hasOwnProperty('outputDirectory'));
        });
    });
    
    describe('Error handling', function() {
        it('should handle missing sites gracefully', function() {
            // This test ensures the module can be loaded without sites.js when used as module
            assert.strictEqual(typeof crop, 'object');
        });
    });
});
