# CSSLab Weekly Assistant

**NodeJS robot that assists in building CSSLab's Weekly newsletter** 🤖

![Demo GIF](https://media.giphy.com/media/FsCMq6RYX4ySk/giphy.gif)

This Node.js script automates tasks to generate the [CSSLab Weekly newsletter](http://www.csslab.cl/csslab-weekly/), streamlining the collection of web content by:
- Scraping site titles and descriptions
- Capturing screenshots
- Writing markdown files with the collected data

## Features

- **v1.0.0**: Better docs, comments and cleaner ES5 code.
- **v0.0.2**: Improved callbacks and resolved screenshot URL bugs.
- **v0.0.1**: Initial release for scraping titles, descriptions, and screenshots from a list of sites. Saves results in a specified directory.

## Prerequisites

- Node.js (version 6.17.1 or higher)
- npm (for dependency management)

## Getting Started

Clone the repository and install dependencies:

```bash
$ git clone https://github.com/yourusername/csslab-weekly-assistant.git
$ cd weekly-assistant
$ npm install
```

## Running

```bash
$ node .
```

### TO-DO:

- <s>Interactive prompts for specifying output directories (using Inquirer)</s>
- Additional bug fixes and performance improvements

### LICENSE:

[MIT License](LICENSE)
