const readFile = require("../util/readFile");

// this function will return array of users
module.exports = function (cb) {
    readFile("./userdata.txt", function (err, data) {
        if (err) {
            cb("users not found");
            return;
        }
        let users = [];

        if (data.length > 0 && data[0] === "[" && data[data.length - 1] === "]") {
            users = JSON.parse(data)
        }
        // console.log("get users ka user ", users);
        cb(null, users);
    });
}