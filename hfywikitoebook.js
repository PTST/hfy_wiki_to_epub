var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var resolver = require("resolver");
var readline = require('readline');
var exec = require('child_process').exec, child;


var dir = './specs';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}


srcArray = []
titleArray = []

jsonFileName = ""
masterIndex =
resolvedIndex = 0
json = {
  title : "",
  creator : "",
  filters: [
    "from-reddit-post",
    "clean-reddit",
    "no-preamble",
    "typography",
    "finalize"
  ],

  filename: "",
  output: ["epub", "html"],
  contents : []
}
filename = "test"
json.filename = filename;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("\x1b[30m\x1b[42mHFY WIKI Url\x1b\x1b[0m: ", function(answer) {
  scrapeWiki(answer);
  rl.close();
});


function buildEpub(){
console.log("\x1b[30m\x1b[42m Building EPUB \x1b\x1b[0m")
child = exec('node ebook.js /specs/'+jsonFileName,
  function (error, stdout, stderr) {
    console.log(stdout);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    convertToKindle()
})};

function convertToKindle(){
console.log("\x1b[30m\x1b[42m Converting To Kindle Format - This may take a while \x1b\x1b[0m")
child = exec('./kindlegen output/'+json.filename+'.epub',
  function (error, stdout, stderr) {
    console.log(stdout);
})};

function scrapeWiki(url){
request(url, function(error, response, body) {
  if(error) {
    console.log("Error: " + error);
  }
  console.log("Status code: " + response.statusCode);

  var $ = cheerio.load(body);

  $('div.md.wiki').children('.toc').children('ul,ol').children('li').first().filter(function( index ){
    var bookTitle = $(this).find('a').text().trim();
    console.log('Title: '+ bookTitle)
    json.title = bookTitle
    jsonFileName = bookTitle.replace(/[^\w+]/gi, "_")+'.json'
    json.filename = bookTitle.replace(/[^\w+]/gi, "_")
  });

  $('div.wiki-page-content.md-container').filter(function( index ){
    var author = $(this).find('.author').text().trim();
    console.log('author: '+ author)
    json.creator = author
  });

  $('div.md.wiki').children('ul,ol').children('li').each(
    function( index ) {
    var title = $(this).find('a[href]').text().trim();
    var src = $(this).find('a').attr('href');
    srcArray.push(src);
    titleArray.push(title);
    masterIndex = index
  });
  resolveUrl()
});

};
function createJSON(){
strinigfiedJson = JSON.stringify(json);
  JSON.parse(strinigfiedJson);
  fs.writeFile('specs/'+jsonFileName, JSON.stringify(json), function(err){

  });
buildEpub()
};


function resolveUrl(){
var src = srcArray[resolvedIndex];
if (src.indexOf("redd.it") !== -1){
resolver.resolve(src, function(err, fullUrl, filename, contentType){
      src = fullUrl;
      if(src.indexOf("/over18?") > -1){
        var src = src.replace("https://www.reddit.com/over18?dest=", "");
        var src = src.replace(/%2F/gi, "/");
        var src = src.replace(/%3A/gi, ":");
      }
        console.log(src);
        json.contents.push({"title" : titleArray[resolvedIndex], "src" : src});
        resolvedIndex += 1;
        console.log("url "+resolvedIndex+" out of "+(masterIndex+1)+" - "+src)
        if (resolvedIndex <= masterIndex)
        resolveUrl();
        else
        createJSON()
    });
}
else{
console.log(src);
json.contents.push({"title" : titleArray[resolvedIndex], "src" : src});
resolvedIndex += 1;
console.log("url "+resolvedIndex+" out of "+(masterIndex+1)+" - "+src)
if (resolvedIndex <= masterIndex)
        resolveUrl()
else
  createJSON()
}


};



