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

const errors = {
  "400": "Bad request. Please verify the information provided is full and correct",
  "1400": "Bad request. E-mail is already registered",
  "401": "You are not authenticated, please <a href=\"/login\">log in</a> or <a href=\"/register\">register</a>.",
  "403": "You are not authorized to access this page.",
  "404": "Page not found."
}


/*** VIEWS/PROCESSING ***/


/*** GET ENDPOINTS ***/

app.get("/", (req, res) => {
  if( utils.isLoggedIn(req.session.user_id) ) {
    res.redirect("/urls"); // root directs to URL page if logged in
  } else {
    res.redirect("/login"); // to login page if not.
  }
});

app.get("/icon/:file", (req,res) => {
  // manage icon requests by directing to system location
  let path = "./assets/icons/" + req.params.file;
  if (fs.existsSync(path) ) {
    fs.readFile(path, (err, data) => {
      res.setHeader("Content-Type", "image/png");
      res.send(data);
      // if file found, send file data as png.
    });
  } else {
    renderError(404, req, res); // if not found, send 404 status
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase); // provide JSON for urlDatabase API
});

app.get("/urls", (req, res) => {

  // set values to pass to the view, and ensure user info is included.
  let templateVars = { urls: urlDatabase };
  res.render("urls_index", insertUser(req, templateVars));
});

app.get("/urls/new", (req, res) => {
  // direct logged in users to create new URL. Send unauthorized code if not logged in.
  if ( utils.isLoggedIn(req.session.user_id) ) {
    res.render("urls_new", insertUser(req));
  } else {
    res.status(401).redirect("/login");
  }
});

app.get("/register", (req, res) => {
  if ( utils.isLoggedIn(req.session.user_id) ) {
    res.redirect("/urls");
  } else {
    res.render("register", insertUser(req));
  }
});

app.get("/login", (req, res) => {
  if ( utils.isLoggedIn(req.session.user_id) ) {
    res.redirect("/urls");
  } else {
    res.render("login", insertUser(req));
  }
});

app.get("/urls/:id", (req, res) => {
  // check if URL entry exists, if not, send 404 code.
  if ( !urlDatabase[req.params.id] ){
    renderError(404, req, res);
  } else if ( !utils.isLoggedIn(req.session.user_id) ) {
    renderError(401, req, res);
  } else if ( !utils.ownsURL(req.session.user_id, req.params.id) ) {
    renderError(403, req, res);
  } else {
    // if it does, send to URL edit view, pass relevant variables, and ensure user info is included.
    let templateVars = {
      urls: urlDatabase,
      shortURL: req.params.id,
      host: req.hostname
    };
    res.render("urls_show", insertUser(req, templateVars));
  }
});

app.get("/u/:id", (req, res) => {
  // check if URL entry exists, if not, send 404 code.
  if ( !urlDatabase[req.params.id] ){
    renderError(404, req, res);
  } else {
    // if it does
    let longURL = utils.getLongURL(req.params.id);
    res.redirect(longURL);
  }
});



/*** POST ENDPOINTS ***/

app.post("/urls/:id/delete", (req, res) => {
  if ( !urlDatabase[req.params.id] ){
    renderError(404, req, res);
  } else if ( !utils.isLoggedIn(req.session.user_id)){
    renderError(401, req, res);
  } else if ( utils.ownsURL(req.session.user_id, req.params.id) ) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    renderError(403, req, res);
  }
});

app.post("/urls/:id", (req, res) => {
  if ( !urlDatabase[req.params.id] ){
    renderError(404, req, res);
  } else if ( !utils.isLoggedIn(req.session.user_id)){
    renderError(401, req, res);
  } else if ( utils.ownsURL(req.session.user_id, req.params.id) ) {
    setURL(req.params.id, req.body.longURL);
    res.redirect("/urls");
  } else {
    renderError(403, req, res);
  }
});

app.post('/urls', (req, res) => {
  if( utils.isLoggedIn(req.session.user_id) ) {
    res.location( '/urls/' + addURL(req, req.session.user_id) );
    res.status(303).send('Redirecting to short URL');
  } else {
    renderError(401, req, res);
  }
});

app.post("/login", (req, res) => {
  if ( loginUser( req, res ) ) {
    res.redirect('/urls');
  } else {
    renderError(400, req, res);
  };
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if ( !email || !password ) {
    renderError(400, req, res);
  } else if ( utils.emailExists(email) ) {
    renderError(1400, req, res);
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

function renderError( statusCode, req, res ) {
  let formattedCode = statusCode % 1000;
  if ( errors[statusCode]) {
    res.status(formattedCode);
    let templateVars = {
      urls: urlDatabase,
      host: req.hostname,
      error: { code: formattedCode, text: errors[statusCode] }
    };
    res.render("error", insertUser(req, templateVars));
  } else {
    res.sendStatus(formattedCode);
  }
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

// function isLoggedIn ( req ) {
//   if ( req.session.user_id ) {
//     let user_id = req.coo
//     if ( users[user_id] ) {
//       return user_id;
//     }
//   }
//   return false
// }

// function emailExists( email ) {
//   let keys = Object.keys(users);
//   for ( let i = 0; i < keys.length; i++) {
//     if ( users[keys[i]].email === email ) {
//       return keys[i];
//     }
//   }
//   return false;
// }

function loginUser( req, res ) {
  let id = utils.authUser( req.body.email, req.body.password );
  if( id ) {
    req.session.user_id = id;
  } else {
    res.status(400);
  }
  return id;
}

// function authUser( email, password ) {
//   let id = utils.emailExists(email)
//   if( id && bcrypt.compareSync(password, users[id].password) ) {
//     return id;
//   } else {
//     return false;
//   }
// }

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
