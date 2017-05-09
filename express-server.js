const express = require("express");
var app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    urls: urlDatabase,
    host: req.hostname
  };
  res.render("urls_show", templateVars);
});

app.get("/hello", (req, res) => {
  res.end("<html><body> Hello <b>World</b></body></html>")
});

app.listen(PORT, () => {
  console.log(`example app listening on port: ${PORT}!`);
});