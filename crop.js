/**
 * @fileoverview Image Cropping Utility
 * 
 * This utility finds images from webpage source code and crops them
 * to a specified size (200px x 120px) in JPG format to use in
 * SInior monthly newsletter
 * 
 * @author Jorge Epuñan <juanbrujo@gmail.com>
 * @version 1.1.0
 * @requires gm - npm install gm@1.23.1
 * @requires request - npm install request
 * @requires cheerio - npm install cheerio
 * @note Requires GraphicsMagick or ImageMagick to be installed on system
 */

var request = require("request");
var cheerio = require("cheerio");
var gm = require("gm");
var fs = require("fs");
var path = require("path");
var url = require("url");

/**
 * Configuration object for image cropping
 */
var config = {
    outputWidth: 400,
    outputHeight: 200,
    outputFormat: "jpeg",
    outputQuality: 85,
    outputDirectory: "./screenshot-image/"
};

/**
 * Ensures the output directory exists
 * @function ensureDirectory
 * @param {string} directory - Directory path to create
 */
function ensureDirectory(directory) {
    if (!fs.existsSync(directory)) {
        try {
            fs.mkdirSync(directory);
            console.log("📁 Created directory: " + directory);
        } catch (err) {
            if (err.code !== "EEXIST") {
                throw err;
            }
        }
    }
}

/**
 * Empties the output directory by removing all files
 * @function emptyDirectory
 * @param {string} directory - Directory path to empty
 */
function emptyDirectory(directory) {
    if (!fs.existsSync(directory)) {
        return; // Directory doesn't exist, nothing to empty
    }
    
    try {
        var files = fs.readdirSync(directory);
        var removedCount = 0;
        
        files.forEach(function(file) {
            var filePath = path.join(directory, file);
            var stats = fs.statSync(filePath);
            
            if (stats.isFile()) {
                fs.unlinkSync(filePath);
                removedCount++;
            }
        });
        
        if (removedCount > 0) {
            console.log("🗑️ Removed " + removedCount + " existing files from " + directory);
        }
    } catch (err) {
        console.warn("⚠️ Warning: Could not empty directory " + directory + ": " + err.message);
    }
}

/**
 * Sanitizes a string to be safe for use as filename
 * @function sanitizeFilename
 * @param {string} filename - Original filename string
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
    if (!filename || typeof filename !== "string") {
        return "untitled";
    }
    
    return filename
        .trim()
        .replace(/[^a-zA-Z0-9\s\-_]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .replace(/^-|-$/g, "") // Remove leading/trailing hyphens
        .toLowerCase()
        .substring(0, 50); // Limit length to 50 characters
}

/**
 * Generates a safe filename from URL hostname and page title
 * @function generateFilename
 * @param {string} pageTitle - Title of the webpage
 * @param {string} pageUrl - Source page URL
 * @returns {string} Safe filename for the cropped image
 */
function generateFilename(pageTitle, pageUrl) {
    try {
        var parsedPage = url.parse(pageUrl);
        var hostname = parsedPage.hostname || "unknown";
        
        // Clean hostname (remove www. and make it filename-safe)
        var cleanHostname = sanitizeFilename(hostname.replace(/^www\./, ""));
        
        var titlePart;
        if (pageTitle && pageTitle.trim()) {
            titlePart = sanitizeFilename(pageTitle);
        } else {
            titlePart = "untitled";
        }
        
        // Ensure we have valid parts
        if (!cleanHostname || cleanHostname.length === 0) {
            cleanHostname = "unknown";
        }
        if (!titlePart || titlePart.length === 0) {
            titlePart = "untitled";
        }
        
        // Combine hostname + title + timestamp
        var timestamp = Date.now();
        return cleanHostname + "_" + titlePart + "_" + timestamp + ".jpg";
        
    } catch (error) {
        return "cropped_image_" + Date.now() + ".jpg";
    }
}

/**
 * Downloads and crops an image from URL
 * @function cropImageFromUrl
 * @param {string} imageUrl - URL of the image to download and crop
 * @param {string} outputPath - Path where to save the cropped image
 * @param {function} callback - Callback function
 */
function cropImageFromUrl(imageUrl, outputPath, callback) {
    console.log("📥 Downloading image: " + imageUrl);
    
    var requestOptions = {
        url: imageUrl,
        encoding: null, // Important: get binary data
        timeout: 10000,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
    };
    
    request(requestOptions, function(error, response, body) {
        if (error) {
            return callback(new Error("Failed to download image: " + error.message));
        }
        
        if (response.statusCode !== 200) {
            return callback(new Error("HTTP " + response.statusCode + " - " + imageUrl));
        }
        
        console.log("✂️ Cropping image to " + config.outputWidth + "x" + config.outputHeight);
        
        // Process image with GraphicsMagick
        gm(body)
            .size(function(err, size) {
                if (err) {
                    return callback(new Error("Failed to get image size: " + err.message));
                }
                
                console.log("📐 Original dimensions: " + size.width + "x" + size.height);
                
                // Calculate crop dimensions to maintain aspect ratio
                var targetRatio = config.outputWidth / config.outputHeight;
                var imageRatio = size.width / size.height;
                
                var cropWidth, cropHeight, cropX, cropY;
                
                if (imageRatio > targetRatio) {
                    // Image is wider than target ratio
                    cropHeight = size.height;
                    cropWidth = Math.round(size.height * targetRatio);
                    cropX = Math.round((size.width - cropWidth) / 2);
                    cropY = 0;
                } else {
                    // Image is taller than target ratio
                    cropWidth = size.width;
                    cropHeight = Math.round(size.width / targetRatio);
                    cropX = 0;
                    cropY = Math.round((size.height - cropHeight) / 2);
                }
                
                // Crop, resize and save
                gm(body)
                    .crop(cropWidth, cropHeight, cropX, cropY)
                    .resize(config.outputWidth, config.outputHeight, "!")
                    .quality(config.outputQuality)
                    .write(outputPath, function(writeErr) {
                        if (writeErr) {
                            return callback(new Error("Failed to save image: " + writeErr.message));
                        }
                        
                        console.log("✅ Cropped image saved: " + outputPath);
                        console.log("📏 Dimensions: " + config.outputWidth + "x" + config.outputHeight);
                        
                        var info = {
                            width: config.outputWidth,
                            height: config.outputHeight,
                            format: "jpeg"
                        };
                        
                        callback(null, outputPath, info);
                    });
            });
    });
}

/**
 * Extracts background-image URL from CSS style string
 * @function extractBackgroundImageUrl
 * @param {string} styleString - CSS style string
 * @returns {string|null} Extracted image URL or null if not found
 */
function extractBackgroundImageUrl(styleString) {
    if (!styleString) return null;
    
    // Look for background-image: url(...) pattern
    var bgImageMatch = styleString.match(/background-image\s*:\s*url\s*\(\s*['"]?([^'"\)]+)['"]?\s*\)/i);
    if (bgImageMatch && bgImageMatch[1]) {
        return bgImageMatch[1].trim();
    }
    
    return null;
}

/**
 * Finds images in webpage source code from .breadcrumb-banner background-image
 * @function findImagesInPage
 * @param {string} pageUrl - URL of the webpage to scrape
 * @param {string} attribute - Not used, kept for compatibility
 * @param {string} selector - Not used, kept for compatibility  
 * @param {function} callback - Callback function
 */
function findImagesInPage(pageUrl, attribute, selector, callback) {
    if (typeof selector === "function") {
        callback = selector;
    }
    if (typeof attribute === "function") {
        callback = attribute;
    }
    
    var requestOptions = {
        url: pageUrl,
        timeout: 10000,
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
    };
    
    console.log("🔍 Scraping page: " + pageUrl);
    
    request(requestOptions, function(error, response, html) {
        if (error) {
            return callback(new Error("Failed to fetch page: " + error.message));
        }
        
        if (response.statusCode !== 200) {
            return callback(new Error("HTTP " + response.statusCode + " - " + pageUrl));
        }
        
        try {
            var $ = cheerio.load(html);
            var images = [];
            
            // Extract page title
            var pageTitle = $("title").text().trim() || "";
            console.log("🏷️ Page title: " + (pageTitle || "[No title found]"));
            
            // Look for .breadcrumb-banner elements with style attribute
            $(".breadcrumb-banner").each(function() {
                var styleAttr = $(this).attr("style");
                if (styleAttr) {
                    var imageUrl = extractBackgroundImageUrl(styleAttr);
                    if (imageUrl) {
                        // Convert relative URLs to absolute
                        if (imageUrl.indexOf("//") === 0) {
                            imageUrl = "https:" + imageUrl;
                        } else if (imageUrl.indexOf("/") === 0) {
                            var parsedPage = url.parse(pageUrl);
                            imageUrl = parsedPage.protocol + "//" + parsedPage.host + imageUrl;
                        } else if (imageUrl.indexOf("http") !== 0) {
                            imageUrl = url.resolve(pageUrl, imageUrl);
                        }
                        
                        images.push({
                            url: imageUrl,
                            alt: "Background image from .breadcrumb-banner",
                            title: "Breadcrumb banner background",
                            selector: ".breadcrumb-banner",
                            source: "background-image",
                            pageTitle: pageTitle
                        });
                        
                        console.log("🖼️ Found background-image in .breadcrumb-banner: " + imageUrl);
                    }
                }
            });
            
            // Fallback: Look for regular img tags if no background images found
            if (images.length === 0) {
                console.log("🔍 No .breadcrumb-banner background images found, trying regular img tags...");
                
                $("img").each(function() {
                    var imageUrl = $(this).attr("src");
                    if (imageUrl) {
                        // Convert relative URLs to absolute
                        if (imageUrl.indexOf("//") === 0) {
                            imageUrl = "https:" + imageUrl;
                        } else if (imageUrl.indexOf("/") === 0) {
                            var parsedPage = url.parse(pageUrl);
                            imageUrl = parsedPage.protocol + "//" + parsedPage.host + imageUrl;
                        } else if (imageUrl.indexOf("http") !== 0) {
                            imageUrl = url.resolve(pageUrl, imageUrl);
                        }
                        
                        images.push({
                            url: imageUrl,
                            alt: $(this).attr("alt") || "",
                            title: $(this).attr("title") || "",
                            selector: "img",
                            source: "src",
                            pageTitle: pageTitle
                        });
                    }
                });
            }
            
            console.log("🖼️ Found " + images.length + " images total");
            callback(null, images);
            
        } catch (parseError) {
            callback(new Error("Failed to parse HTML: " + parseError.message));
        }
    });
}

/**
 * Main function to process a webpage and crop its image
 * @function processPage
 * @param {string} pageUrl - URL of the webpage
 * @param {string} attribute - Image attribute to search for (default: "src")
 * @param {function} callback - Callback function
 */
function processPage(pageUrl, attribute, callback) {
    if (typeof attribute === "function") {
        callback = attribute;
        attribute = "src";
    }
    
    ensureDirectory(config.outputDirectory);
    
    findImagesInPage(pageUrl, attribute, function(err, images) {
        if (err) {
            return callback(err);
        }
        
        if (images.length === 0) {
            return callback(new Error("No images found with attribute '" + attribute + "'"));
        }
        
        // Use the first image found
        var firstImage = images[0];
        var filename = generateFilename(firstImage.pageTitle, pageUrl);
        var outputPath = path.join(config.outputDirectory, filename);
        
        cropImageFromUrl(firstImage.url, outputPath, function(cropErr, savedPath, info) {
            if (cropErr) {
                return callback(cropErr);
            }
            
            callback(null, {
                originalUrl: firstImage.url,
                croppedPath: savedPath,
                filename: filename,
                dimensions: info,
                sourceAlt: firstImage.alt,
                sourceTitle: firstImage.title,
                selector: firstImage.selector,
                sourceType: firstImage.source
            });
        });
    });
}

// Export functions for use as module
module.exports = {
    processPage: processPage,
    findImagesInPage: findImagesInPage,
    cropImageFromUrl: cropImageFromUrl,
    config: config
};

// CLI usage when run directly
if (require.main === module) {
    var sites = require('./sites');

    if (!Array.isArray(sites) || sites.length === 0) {
        console.error("No URLs found in sites.js");
        process.exit(1);
    }

    console.log("🚀 Starting image crop process for " + sites.length + " sites...");
    
    // Empty and ensure output directory exists
    emptyDirectory(config.outputDirectory);
    ensureDirectory(config.outputDirectory);

    sites.forEach(function(pageUrl) {
        console.log("📄 Processing URL: " + pageUrl);
        processPage(pageUrl, function(err, result) {
            if (err) {
                console.error("❌ Error for " + pageUrl + ":", err.message);
            } else {
                console.log("🎉 Success for " + pageUrl);
                console.log("📁 Saved to: " + result.croppedPath);
                console.log("📐 Size: " + result.dimensions.width + "x" + result.dimensions.height);
                console.log("🔗 Original: " + result.originalUrl);
                console.log("---");
            }
        });
    });
}
