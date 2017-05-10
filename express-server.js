const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser")
const fs = require("fs");
var app = express();
const PORT = process.env.PORT || 8080;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

/*** DATA ***/

let urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

/*** VIEWS/PROCESSING ***/

/*** GET ENDPOINTS ***/

app.get("/", (req, res) => {
  res.redirect("/urls");
});

app.get("/icon/:file", (req,res) => {
  let path = "./assets/icons/" + req.params.file;
  if (fs.existsSync(path) ) {
    fs.readFile(path, (err, data) => {
      res.setHeader("Content-Type", "image/png");
      res.send(data);
    })
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", insertUsername(req, templateVars));
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", insertUsername(req));
});

app.get("/urls/:id", (req, res) => {
  if ( !urlDatabase[req.params.id] ){
    res.sendStatus(404);
  } else {
    let templateVars = {
      urls: urlDatabase,
      shortURL: req.params.id,
      host: req.hostname
    };
    res.render("urls_show", insertUsername(req, templateVars));
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL]
  res.redirect(longURL);
});

app.get("/hello", (req, res) => {
  res.end("<html><body> Hello <b>World</b></body></html>")
});


/*** POST ENDPOINTS ***/

app.post("/urls/:id/delete", (req, res) => {
  if ( !urlDatabase[req.params.id] ){
    res.sendStatus(404);
  } else {
    delete urlDatabase[req.params.id];
    res.redirect("/urls", insertUsername(req));
  }
});

app.post("/urls/:id", (req, res) => {
  if ( !urlDatabase[req.params.id] ){
    res.sendStatus(404);
  } else {
    urlDatabase[req.params.id] = req.body.longURL;
    res.redirect("/urls");
  }
});

app.post('/urls', (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.location('/urls/' + shortURL);
  res.status(303).send('Redirecting to short URL');
});

app.post("/login", (req, res) => {
  let username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});


/*** START SERVER ***/

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

function insertUsername( req, input ){
  let result = {}
  if (input) {
    result = input;
  }
  if ( req.cookies["username"] ) {
    result["username"] = req.cookies["username"];
  } else {
    result["username"] = "";
  }
  return result;
}