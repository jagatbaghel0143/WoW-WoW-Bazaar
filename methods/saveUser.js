const writeFile = require("../util/writeFile");

const getUsers = require("./getUsers");

// this function will save a user into db
module.exports = function (newUser, cb) {
    getUsers(function (err, users) {
        // console.log("save users ka user ", users);
        if (err) {
            cb("Oops!! Something went wrong.");
            return;
        }
        let index;
        let checkEmail = users.filter((val, i) => {
            if (val.email === newUser.email) {
                index = i;
                return true;
            }
        });
        if (checkEmail.length === 0) {
            users.push(newUser);
            writeFile("./userdata.txt", JSON.stringify(users), function (err) {
                if (err) {
                    cb("error while saving user");
                }
                else {
                    cb(null);
                }
            })
        } else {
            if (checkEmail[0].isActive) {
                cb("User already exist");
            } else {
                users.splice(index, 1);
                writeFile("./userdata.txt", JSON.stringify(users), function (err) {
                    if (err) {
                        cb("error while saving user");
                    }
                    else {
                        cb(null);
                    }
                });
                cb(null);
            }
            // console.log("User already exist");
        }
    })
}