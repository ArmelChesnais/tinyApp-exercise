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

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}


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
  res.render("urls_index", insertUser(req, templateVars));
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new", insertUser(req));
});

app.get("/register", (req, res) => {
  res.render("register", insertUser(req));
});

app.get("/login", (req, res) => {
  res.render("login", insertUser(req));
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
    res.render("urls_show", insertUser(req, templateVars));
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
    res.redirect("/urls", insertUser(req));
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
  loginUser( res, req.body.email, req.body.password );
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if ( !email || !password) {
    res.sendStatus(400);
  } else if ( emailExists(email) ) {
    res.sendStatus(400);
  } else {
    let id = addUser(email, password);
    res.cookie('user_id', id);
    res.redirect('/urls');
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
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

function insertUser( req, input ){
  let result = {}
  if (input) {
    result = input;
  }
  result["user"] = users[req.cookies.user_id];
  return result;
}

function addUser( email, password ){
  let id;
  do {
    id = generateRandomString();
  } while (users[id]);
  users[id] = {
    id: id,
    email: email,
    password: password
  }
  return id;
}

function emailExists( email ) {
  let keys = Object.keys(users);
  for ( let i = 0; i < keys.length; i++) {
    if ( users[keys[i]].email === email ) {
      return keys[i];
    }
  }
  return false;
}

function loginUser( res, email, password ) {
  let id = authUser( email, password );
  if( id ) {
    res.cookie('user_id', id);
  } else {
    res.status(400);
  }
}

function authUser( email, password ) {
  return emailExists(email);
}