const puppeteer = require('puppeteer');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

let launchChrome = (async (port) => {
    const browser = await puppeteer.launch({
	headless: false,
	defaultViewport: null,
	executablePath: '/nix/store/6bn4m8g4x9v4mm2wmll7mk8k2g39sy5a-system-path/bin/google-chrome-stable'
    });
    const page = await browser.newPage();
    // await page.goto('http://google.fr');
    await page.goto('http://localhost:'+port);

    let resize = async () => {
	let h = await page.evaluate(() => window.innerHeight);
	let w = await page.evaluate(() => window.innerWidth);
	let {width, height} = await page.$eval('section', e => {
	    let {width, height} = e.getBoundingClientRect();
	    return {width, height};
	});

	// let r = Math.min(width/w);
	let r = h/height;

	// w * (w/width)
	// console.log({w, h, width, height, r});

	// await page.setViewport({
	//     width: 640,
	//     height: 480,
	//     deviceScaleFactor: 0.01,
	// });
    };
    // setInterval(resize, 400);
});

http.createServer(function (req, res) {
  console.log(`${req.method} ${req.url}`);

  const parsedUrl = url.parse(req.url);
  let pathname = `.${parsedUrl.pathname}`;
  let ext = path.parse(pathname).ext;
  const map = { '.ico': 'image/x-icon', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};

  fs.exists(pathname, function (exist) {
      if(!exist) {
	  res.statusCode = 404;
	  res.end(`File ${pathname} not found!`);
	  return;
      }
      
      if (fs.statSync(pathname).isDirectory())
      {
	  ext = '.html';
	  pathname += '/index.html';
      };
      
      fs.readFile(pathname, function(err, data){
	  if(err){
              res.statusCode = 500;
              res.end(`Error getting the file: ${err}.`);
	  } else {
              res.setHeader('Content-type', map[ext] || 'text/plain' );
              res.end(data);
	  }
      });
  });
}).listen(8011, () => setTimeout(() => launchChrome(8011), 800));

