/********************************************************************************
*  WEB322 – Assignment 05
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Jamil Yanez Vasquez Student ID: 139479232 Date: 03-23-2024
*
*  Published URL:  
*
********************************************************************************/

const unCountryData = require("./modules/unCountries");
const path = require("path");

const authData = require("./modules/auth-service");

const express = require('express');
const app = express();

app.use(express.urlencoded({extended:true}));

const HTTP_PORT = process.env.PORT || 8080;

const clientSessions = require('client-sessions');

app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
    duration: 5 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use(express.static('public')); 
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
  res.render("home")
});

app.get('/about', (req, res) => {
  res.render("about")
});

app.get('/login', (req, res) => {
  res.render("login")
});

app.get('/register', (req, res) => {
  res.render("register")
});

app.post('/register', async (req, res) => {
  try{
    await authData.registerUser(req.body);
    res.render('register', {message: "User created"});
  }catch(err){
    res.render('register', {errorMessage: err, userName: req.body.userName })
  }
});

app.post('/login', async (req, res) => {
  try{
    req.body.userAgent = req.get('User-Agent');
    await authData.checkUser(req.body).then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email, 
        loginHistory: user.loginHistory, 
    }
    res.redirect('/un/countries');
  })
  }catch(err){
    res.render('login', {errorMessage: err, userName: req.body.userName})
  }
});

app.get('/logout', async (req, res) => {
  req.session.reset();
  res.redirect("/");
});

app.get('/userHistory', authData.ensureLogin, (req, res) => {
  res.render("userHistory");
});

app.get("/un/countries", async (req,res)=>{
  
  let countries = [];

  try{
    if(req.query.region){
      countries = await unCountryData.getCountriesByRegion(req.query.region);
    }else{
      countries = await unCountryData.getAllCountries();
    }
    // res.json(countries)
    res.render("countries", {countries})
  }catch(err){
    res.status(404).render("404", {message: err});
  }

});

app.get("/un/countries/:code", async (req,res)=>{
  try{
    let country = await unCountryData.getCountryByCode(req.params.code);
    res.render("country", {country})
  }catch(err){
    res.status(404).render("404", {message: err});
  }
});

app.get("/un/addCountry", authData.ensureLogin,  async (req,res)=>{
  try{
    let regions = await unCountryData.getAllRegions();
    res.render("addCountry", {regions:regions});
  }catch(err){
    res.status(404).render("404", {message: err});
  }
});

app.post('/un/addCountry', authData.ensureLogin, async (req,res)=>{
  try{
    req.body = await unCountryData.addCountry(req.body);
    res.redirect("/un/countries");
    res.send(req.body);
  }catch(err){
    res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/un/editCountry/:code", authData.ensureLogin, async (req, res) => {
  try{
    let countryData = await unCountryData.getCountryByCode(req.params.code);
    let regionsData = await unCountryData.getAllRegions();
    res.render("editCountry",{regions: regionsData, country: countryData });
  }catch(err){
    res.status(404).render("404",{message:err});
  }
});

app.post('/un/editCountry', authData.ensureLogin, async (req,res)=>{
  try{
    req.body = await unCountryData.editCountry(req.body.a2code ,req.body);
    res.redirect("/un/countries");
    res.send(req.body);
  }catch(err){
    res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/un/deleteCountry/:code", authData.ensureLogin, async (req,res) => {
  try{
    await unCountryData.deleteCountry(req.params.code)
    res.redirect("/un/countries");
  }catch(err){
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
})
// app.get("/un/countries/region-demo", async (req,res)=>{
//   try{
//     let countries = await unCountryData.getCountriesByRegion("Oceania");
//     res.send(countries);
//   }catch(err){
//     res.send(err);
//   }
// });

app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

unCountryData.initialize()
.then(authData.initialize)
.then(function(){
  app.listen(HTTP_PORT, function(){
    console.log(`app listening on: ${HTTP_PORT}`);
  });
}).catch(function(err){
  console.log(`unable to start server: ${err}`);
});

