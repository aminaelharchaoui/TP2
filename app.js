// Import necessary packages
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser'); // You can keep bodyParser for now

// Create an Express app
const app = express();
const port = 5000;

// Local variable for books
const books = [
  { title: 'Book 1', author: 'Author 1' },
  { title: 'Book 2', author: 'Author 2' },
  // Add more books as needed
];

// Connect to the MongoDB database (Make sure MongoDB is running)
mongoose.connect('mongodb://127.0.0.1:27017/NodeTPP', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema for User model
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

// User model wraps the schema
const UserModel = mongoose.model('User', UserSchema);

// Middleware setup
app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

// Passport setup
passport.use(new LocalStrategy(
  function (username, password, done) {
    // Replace this with your actual authentication logic
    UserModel.findOne({ username: username }, function (err, user) {
      if (err) return done(err);
      if (!user) return done(null, false, { message: 'Incorrect username' });

      bcrypt.compare(password, user.password, function (err, isMatch) {
        if (err) return done(err);
        if (!isMatch) return done(null, false, { message: 'Incorrect password' });

        return done(null, user);
      });
    });
  }
));

// Passport session serialization
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  UserModel.findById(id, function (err, user) {
    done(err, user);
  });
});

// Route for rendering the login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Login route using Passport's authenticate method
app.post(
  '/login',
  passport.authenticate('local', { 
    successRedirect: '/books',
    failureRedirect: '/login',
  })
);

// Registration route
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new UserModel({ username, password: hashedPassword });

    await newUser.save();

    console.log('Registration successful');
    res.redirect('/login');
  } catch (error) {
    console.error('Error during registration:', error);
    res.send('Registration failed');
  }
});

// Route for rendering the books page
app.get('/books', (req, res) => {
  if (req.isAuthenticated()) {
    res.render('books', { books });
  } else {
    res.redirect('/login');
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Export the UserModel
module.exports.UserModel = UserModel;
