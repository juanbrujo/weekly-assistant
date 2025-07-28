# CSSLab Weekly Assistant

**NodeJS robot that assists in building CSSLab's Weekly newsletter** 🤖

![Demo GIF](https://media.giphy.com/media/FsCMq6RYX4ySk/giphy.gif)

This Node.js script automates tasks to generate the [CSSLab Weekly newsletter](http://www.csslab.cl/csslab-weekly/), streamlining the collection of web content by:
- Scraping site titles and descriptions
- Capturing screenshots
- Writing markdown files with the collected data
- Cropping images from webpage backgrounds for newsletter thumbnails

## Features

- **v1.1.1**: Tests added.
- **v1.1.0**: Added `crop.js` image cropping tool with smart background-image detection, comprehensive documentation, and enhanced filename generation.
- **v1.0.0**: Better docs, comments and cleaner ES5 code.
- **v0.0.2**: Improved callbacks and resolved screenshot URL bugs.
- **v0.0.1**: Initial release for scraping titles, descriptions, and screenshots from a list of sites. Saves results in a specified directory.

## Prerequisites

- Node.js (version 6.17.1 or higher)
- npm (for dependency management)
- GraphicsMagick or ImageMagick (for image processing)
  ```bash
  # macOS (using Homebrew)
  brew install graphicsmagick
  # or ImageMagick
  brew install imagemagick
  ```

## Getting Started

Clone the repository and install dependencies:

```bash
$ git clone https://github.com/yourusername/csslab-weekly-assistant.git
$ cd weekly-assistant
$ npm install
```

## Running

### Main Newsletter Script

Processes all sites from `sites.js` and generates content:

```bash
$ node .
```

### Image Cropping Tool

Extracts and crops images from websites for newsletter thumbnails:

```bash
$ node crop.js
```

## Tools

### 📝 index.js - Newsletter Content Generator

The main script that processes websites from `sites.js` and generates:
- Screenshots of each website
- Scraped content (titles, descriptions)
- Markdown files with formatted content

**Output:** `./latest/` directory

### 🖼️ crop.js - Image Cropping Tool

Specialized tool for extracting and cropping images from websites for newsletter thumbnails.

#### Features:
- **Smart Image Detection**: Prioritizes `.breadcrumb-banner` background images
- **CSS Background Extraction**: Parses `style` attributes for `background-image: url(...)`
- **Fallback Support**: Uses regular `<img>` tags if no background images found
- **Smart Cropping**: Maintains aspect ratio while cropping to exact dimensions (400x200px)
- **Clean Filenames**: Uses `hostname_page-title_timestamp.jpg` format
- **Batch Processing**: Processes all URLs from `sites.js` automatically
- **Directory Management**: Automatically cleans output directory before processing

#### Requirements:
- GraphicsMagick or ImageMagick installed on system
- All dependencies from `package.json`

#### Output Format:
- **Size**: 400px × 200px JPG images
- **Quality**: 85% JPEG compression
- **Directory**: `./screenshot-image/`
- **Naming**: `github-com_awesome-project_1643723456789.jpg`

#### How it Works:
1. Reads URLs from `sites.js`
2. Scrapes each webpage for images
3. Extracts page title for filename
4. Downloads and processes images
5. Crops to center while maintaining aspect ratio
6. Saves as optimized JPG files

#### Example Output:
```
🚀 Starting image crop process for 5 sites...
🗑️ Removed 3 existing files from ./screenshot-image/
📄 Processing URL: https://github.com/user/repo
🔍 Scraping page: https://github.com/user/repo
🏷️ Page title: GitHub - User Repository
🖼️ Found background-image in .breadcrumb-banner
📥 Downloading image: https://github.com/bg.jpg
✂️ Cropping image to 400x200
📐 Original dimensions: 1200x600
✅ Cropped image saved: ./screenshot-image/github-com_github-user-repository_1643723456789.jpg
📏 Dimensions: 400x200
🎉 Success!
---
```

### Configuration

Both tools use the `sites.js` file to define which websites to process:

```javascript
sites = [
    'https://example.com',
    'https://github.com/user/repo',
    'https://css-tricks.com/article'
];
```

### TO-DO:

- <s>Interactive prompts for specifying output directories (using Inquirer)</s>
- Additional bug fixes and performance improvements

### LICENSE:

[MIT License](LICENSE)
