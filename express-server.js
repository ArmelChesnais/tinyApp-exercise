/*** REQUIREMENTS ***/

const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;
const HASHROUNDS = 10;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['SuperTotallySecretKey1', 'AnotherReallySecretKey2'], // Secret keys

  // Cookie options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));



/*** DATA ***/

let urlDatabase = {
  "b2xVn2": { shortURL: "b2xVn2", longURL: "http://www.lighthouselabs.ca", user_id: "userRandomID"},
  "9sm5xK": { shortURL: "9sm5xK", longURL: "http://www.google.com", user_id: "user2RandomID"},

};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", HASHROUNDS)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", HASHROUNDS)
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
  if ( utils.isLoggedIn(req.session.user_id) ) {
    res.render("urls_new", insertUser(req));
  } else {
    res.status(403).redirect("/urls");
  }
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
  let longURL = utils.getLongURL(req.params.shortURL);
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
    if ( !utils.isLoggedIn(req.session.user_id)){
      res.sendStatus(401);
    } else if ( utils.ownsURL(req.session.user_id, req.params.id) ) {
      delete urlDatabase[req.params.id];
      res.redirect("/urls");
    } else {
      res.sendStatus(403);
    }
  }
});

app.post("/urls/:id", (req, res) => {
  if ( !urlDatabase[req.params.id] ){
    res.sendStatus(404);
  } else {
    if ( !utils.isLoggedIn(req.session.user_id)){
      res.status(401);
    } else if ( utils.ownsURL(req.session.user_id, req.params.id) ) {
      setURL(req.params.id, req.body.longURL);
    } else {
      res.status(403);
    }
    res.redirect("/urls");
  }
});

app.post('/urls', (req, res) => {
  //let shortURL = generateRandomString();
  if( utils.isLoggedIn(req.session.user_id) ) {
    res.location('/urls/' + addURL(req, req.session.user_id));
    res.status(303).send('Redirecting to short URL');
  } else {
    res.sendStatus(401);
  }
});

app.post("/login", (req, res) => {
  loginUser( req, res /*req.body.email, req.body.password*/ );
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if ( !email || !password) {
    res.sendStatus(400);
  } else if ( utils.emailExists(email) ) {
    res.sendStatus(400);
  } else {
    let id = addUser( email, password );
    req.session.user_id = id;
    res.redirect('/urls');
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});



/*** MISC FUNCTIONS ***/

function addURL ( req, owner_id ) {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { id: shortURL, longURL: req.body.longURL, user_id: owner_id };
  return shortURL;
}

function setURL ( shortURL, longURL ) {
  urlDatabase[shortURL].longURL = longURL;
}

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
  result["user"] = users[req.session.user_id];
  result["utils"] = utils;
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
    password: bcrypt.hashSync(password, HASHROUNDS)
  }
  return id;
}

function isLoggedIn ( req ) {
  if ( req.session.user_id ) {
    let user_id = req.coo
    if ( users[user_id] ) {
      return user_id;
    }
  }
  return false
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

function loginUser( req, res ) {
  let id = utils.authUser( req.body.email, req.body.password );
  if( id ) {
    req.session.user_id = id;
  } else {
    res.status(400);
  }
}

function authUser( email, password ) {
  let id = utils.emailExists(email)
  if( id && bcrypt.compareSync(password, users[id].password) ) {
    return id;
  } else {
    return false;
  }
}

/*** TRANSFERRABLE FUNCTIONS ***/
const utils = {

  isLoggedIn: function ( user_id ) {
    if ( user_id ) {
      if ( users[user_id] ) {
        return user_id;
      }
    }
    return false;
  },

  emailExists: function( email ) {
    let keys = Object.keys(users);
    // console.log("users during email exists:", users);
    for ( let i = 0; i < keys.length; i++) {
      if ( users[keys[i]].email === email ) {
        return keys[i];
      }
    }
    return false;
  },

  getUserId: function( email ) {
    return emailExists( email );
  },

  getEmail: function( user_id ) {
    return users[user_id].email;
  },

  authUser: function( email, password ) {
    let id = utils.emailExists(email)
    if( id && bcrypt.compareSync(password, users[id].password) ) {
      return id;
    } else {
      return false;
    }
  },

  getLongURL: function( shortURL ) {
    return urlDatabase[shortURL].longURL;
  },

  getOwner: function( shortURL ) {
    return urlDatabase[shortURL].user_id;
  },

  ownsURL: function ( user_id, shortURL ) {
    if ( this.getOwner( shortURL ) === user_id) {
      return user_id;
    }
    return false;
  }
}


/*** START SERVER ***/

app.listen(PORT, () => {
  console.log(`example app listening on port: ${PORT}!`);
});
