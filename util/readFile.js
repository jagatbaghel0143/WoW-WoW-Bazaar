const fs = require("fs");

function readFile(path, cb) {
    // fs.readFile(path, "utf-8", function(err,data){
    //   cb(err,data);
    // })
    fs.readFile(path, "utf-8", cb);
}
module.exports = readFile;