var jsdom = require('jsdom');

if (process.argv.length == 2) {
	return console.log("ERROR: please provide a starting word");
}

// Grab the starting word
var start = process.argv[2].replace(" ", "_");
var count = 0;

// Keep track of links we've followed to prevent infinite loops
var foundWords = {};

function search (word) {
	jsdom.env("http://en.wikipedia.org/wiki/" + word, ["http://code.jquery.com/jquery-1.5.min.js"], function (err, window) {
		var $ = window.$;
		count++;

		var link;
		
		// Find all links in the content and loop through until
		// we have a suitable candidate.
		$.each($("#bodyContent > p a"), function (i, ele) {
			var href = $(ele).attr('href');
			var article = href.split("/");
			article = article[article.length - 1];
			
			// Skip links we've already visited
			if (foundWords[article]) { return true; }
			
			// Don't follow links inside of parentheses
			var paren_regex = new RegExp("\\((.*?" + article + ".*?)\\)");
			
			// Attempt to avoid etymology links
			var from_regex = new RegExp(article + ":");
			
			// Also attempt to avoid etymology links
			var from2_regex = new RegExp("from [A-Za-z\-\_]+: " + article);
			
			var text = $(ele).parent().text();

			// Avoid language reference links
			if (href.match(/Wikipedia:/i)) { return true; }
			
			// Avoid file links
			if (href.match(/File:/i)) { return true; }
			
			// Avoid direct file links
			if (href.indexOf(".") !== -1) { return true;}
			
			// Avoid page anchor links
			if (href.match(/#/)) { return true; }
			
			if (text.match(from_regex)) { return true; }
			if (text.match(from2_regex)) { return true; }
			if (text.match(paren_regex)) { return true; }
			
			link = href;
			return false;
		});
		
		if (!link) {
			console.log("WARNING: this may be a disambiguation page. Trying anyways.");
			
			if ($("#bodyContent .redirectMsg").length > 0) {
				// This page is a redirect page, follow the redirect
				link = $("#bodyContent .redirectText > a").attr('href');
			} else {
				// Hopefully a disambuation page, grab the first entry
				link = $("#bodyContent > ul li a:first").attr('href');
				
				if (!link) {
					// sadface
					return console.log("ERROR: could not find a suitable word, exiting.");
				}
			}
		}
		
		var article = link.split("/");
		article = article[article.length - 1];
		console.log("[" + count + "] " + article);
		
		if (article.match(/philosophy/i)) {
			console.log("=======================================");
			console.log("It takes " + count + " steps to get from " + start + " to " + article);
		} else {
			foundWords[article] = true;
			search(article);
		}
	});
}

search(start);