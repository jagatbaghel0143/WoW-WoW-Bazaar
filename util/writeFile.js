const fs = require("fs");

function writeFile(path, data, cb) {
    // fs.writeFile(path, data, function(err,data){
    //   cb(err,data);
    // })
    // console.log("writeFile ka path ", path);
    // console.log("writeFile ka data ", data);
    fs.writeFile(path, data, cb);
}
module.exports = writeFile;