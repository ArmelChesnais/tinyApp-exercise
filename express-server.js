const express = require("express");
const bodyParser = require("body-parser");
var app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

/*** DATA ***/

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

/*** VIEWS/PROCESSING ***/

// app.get("/", (req, res) => {
//   res.end("Hello!");
// });

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    host: req.hostname
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  res.send("OK");
});

app.get("/hello", (req, res) => {
  res.end("<html><body> Hello <b>World</b></body></html>")
});

app.listen(PORT, () => {
  console.log(`example app listening on port: ${PORT}!`);
});


/*** MISC FUNCTIONS ***/
function generateRandomString() {
   return genRandStringLength(6);
}

function genRandStringLength(size) {
  let result = "";
  choices = "1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-";
  for (var i = 0; i < size; i++) {
    result += choices.charAt(Math.random() * choices.length);
  }
  return result;
}