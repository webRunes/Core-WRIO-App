const express = require("express");
const path = require("path");
const fs = require("fs");
const nconf = require("./server/wrio_nconf.js");

var app = express();
app.ready = () => {};

var DOMAIN = nconf.get("db:workdomain");
app.use("/", express.static(path.join(__dirname, "../hub")));

var server = require("http")
  .createServer(app)
  .listen(nconf.get("server:port"), (req, res) => {
    console.log("app listening on port " + nconf.get("server:port") + "...");
    app.ready();
    console.log("Application Started!");
  });

app.get("/create", (request, response) => {
  response.sendFile(__dirname + "/client/views/core.html");
});

app.get("/create_list", (request, response) => {
  response.sendFile(__dirname + "/client/views/core.html");
});

app.get("/edit", (request, response) => {
  response.sendFile(__dirname + "/client/views/core.html");
});

module.exports = app;
