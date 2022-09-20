const express = require('express')
const app = express()
const port = 3000

const path = require('path');
const session = require('express-session');
const multer = require('multer');
const readFile = require('./util/readFile');
const writeFile = require('./util/writeFile');
const getProducts = require("./methods/getProducts");
const sendEmail = require("./methods/sendEmail");
const getUsers = require("./methods/getUsers");
const saveUser = require("./methods/saveUser");
const checkAuth = require("./middlewares/checkAuth");
const checkAdmin = require("./middlewares/checkAdmin");
// const products = require('./products');

var Publishable_Key = 'pk_test_51L4IvkSG7lkpbx444eLfVU2lr7cjLz0kQp1hAROCVVcKHRGD1K9qfduO7rXtUm04Y9MdKuRv5G2KlUSorjatRVz400wL8tWcGl'
var Secret_Key = 'sk_test_51L4IvkSG7lkpbx44ApwUP4yVfw28zZoVL0kxq5hHqdW97mB9DAWah7SMCBmr8EgxEcm3Ccqszjun6QYJITywGkqu00eFoG0OTh'

const stripe = require('stripe')(Secret_Key)

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/products");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})

const upload = multer({ storage: storage, fileFilter: fileFilter })

function fileFilter(req, file, cb) {
    if (file.mimetype === "image/jpg")
        cb(null, true);
    else if (file.mimetype === "image/png")
        cb(null, true);
    else if (file.mimetype === "image/jpeg")
        cb(null, true);
    else
        cb("filetype not supported", false);
}

//middleware to see on which endpoint request is coming
app.use((req, res, next) => {
    console.log(req.url);
    next();
})

app.use(session({
    secret: 'keyboard cat',
    resave: 'false',
    saveUninitialized: 'true',
    cookie: { secure: false }
}))

const adminDetails = [{
    email: "admin@gmail.com",
    username: "Jagat",
    password: "j",
    isActive: true,
    // verificationKey: `WWBAdmin${Date.now()}`,
    isAdmin: true
}]

app.get('/', (req, res) => {
    if (req.session.isLoggedIn) {
        res.redirect("/home");
    }
    else {
        var page_no = 1;
        if (req.query.page_no)
            page_no = Number(req.query.page_no);
        getProducts(page_no, function (products, total_pages) {
            if (page_no <= total_pages)
                res.render("home", { name: null, email: null, products: products, cartProducts: [], page_no: 1, total_pages, isLoggedIn: req.session.isLoggedIn });
        });
        // res.redirect("/login");
    }
})

app.get("/home", checkAuth, function (req, res) {
    var page_no = 1;
    if (req.query.page_no)
        page_no = Number(req.query.page_no);
    getProducts(page_no, function (products, total_pages) {
        readFile("./cart.txt", (err, data) => {
            let cartProducts = data ? JSON.parse(data) : []
            cartProducts = cartProducts.filter(val => {
                if (req.session.user.email === val.email) {
                    if (val.cartFlag)
                        return true;
                }
            });
            if (page_no <= total_pages)
                res.render("home", { name: req.session.user.username, email: req.session.user.email, products: products, cartProducts: cartProducts, page_no: page_no + 1, total_pages, isLoggedIn: req.session.isLoggedIn });
        })
    })
})

app.route('/adminLogin').post((req, res) => {
    //console.log(req.body);
    const { email, password } = req.body;
    if (email === adminDetails[0].email && password === adminDetails[0].password) {
        //console.log("email & pass verification successful");
        if (req.session.isLoggedIn)
            res.redirect("/adminHome");
        else {
            req.session.isLoggedIn = true;
            req.session.user = adminDetails[0];
            req.session.save(() => {
                res.redirect("/adminHome");
            })
        }
    } else {
        res.render("admin/adminLogin", { name: null, email: null, isLoggedIn: null, error: "Admin Not Found" });
    }
}).get((req, res) => {
    res.render("admin/adminLogin", { name: null, email: null, isLoggedIn: null, error: null });
})

app.get("/adminHome", checkAdmin, (req, res) => {
    readFile("./products.txt", (err, data) => {
        let products = data ? JSON.parse(data) : [];
        res.render("admin/adminHome", { name: req.session.user.username, email: req.session.user.email, products: products, isLoggedIn: req.session.isLoggedIn });
    })
})

app.route("/addProduct").post(checkAdmin, upload.single('avatar'), (req, res) => {
    const { name, price, quantity, desc } = req.body;
    if (!name || !price || !quantity || !desc)
        return res.render("admin/addNewProduct", { error: "You have forget something" });
    let newProduct = {
        name,
        price,
        quantity,
        image: `products/${req.file.filename}`,
        productId: Date.now(),
        cartFlag: false,
        desc
    }
    console.log(newProduct);
    readFile("./products.txt", (err, data) => {
        let products = data ? JSON.parse(data) : [];
        products.push(newProduct);
        writeFile("./products.txt", JSON.stringify(products), (err) => {
            if (err) res.send(err);
            res.redirect("/adminHome");
        });
    })
}).get(checkAdmin, (req, res) => {
    //console.log("addProduct get request");
    res.render("admin/addNewProduct", { error: null });
})

app.route("/updateProduct").post(checkAdmin, (req, res) => {
    //console.log(req.query.productId);
    const productId = Number(req.query.productId);

    readFile("./products.txt", (err, data) => {
        let products = data ? JSON.parse(data) : []
        //console.log("parsed data", products);
        products = products.filter(val => val.productId === productId);
        writeFile("./products.txt", JSON.stringify(products), (err) => {
            if (err) res.send(err);
            res.send("");
        });
    })
}).get(checkAdmin, (req, res) => {
    const productId = Number(req.query.productId);
    console.log("update product ka get",);
    readFile("./products.txt", (err, data) => {
        let products = data ? JSON.parse(data) : [];
        let product = products.filter(val => val.productId === productId);
        res.render("admin/updateProduct");
    })
})

app.route("/deleteProduct").get(checkAdmin, (req, res) => {
    console.log(req.query.productId);
    const productId = Number(req.query.productId);

    readFile("./products.txt", (err, data) => {
        let products = data ? JSON.parse(data) : []
        //console.log("parsed data", products);
        products = products.filter(val => val.productId !== productId);
        console.log(products);
        writeFile("./products.txt", JSON.stringify(products), (err) => {
            if (err) res.send(err);
            res.send("");
        });
    })
})

app.route('/login').post((req, res) => {
    const { email, password } = req.body;

    getUsers(function (err, users) {
        if (err) {
            res.render("login", { name: null, email: null, isLoggedIn: null, error: "User not found!!" })
        }
        let emailFlag = false;
        let checkEmail = users.filter((val) => {
            if (val.email === email) {
                emailFlag = true;
                if (val.password === password)
                    return true;
            }
        });
        if (checkEmail.length === 0) {
            if (emailFlag) {
                res.render("login", { name: null, email: null, isLoggedIn: null, error: "Invalid password please try again!!!" });
                return;
            }
            else {
                res.render("login", { name: null, email: null, isLoggedIn: null, error: 'This email is not registered with us. Please go for signup!!!' });
                return;
            }
        }
        else {
            if (req.session.isLoggedIn)
                res.redirect("/home");
            else {
                req.session.isLoggedIn = true;
                // req.session.name = checkEmail[0].username;
                // req.session.email = checkEmail[0].email;
                req.session.user = checkEmail[0];
                req.session.save(() => {
                    res.redirect("/home");
                })
            }
        }
    })
}).get((req, res) => {
    res.render("login", { name: null, email: null, isLoggedIn: null, error: "" });
})

app.route('/signup').post((req, res) => {
    // console.log(req.body);
    const { username, email, password, } = req.body;
    if (!username || !email || !password) {
        res.render("signup", { name: null, email: null, isLoggedIn: null, error: "Opps!! You have forgot something", message: "" });
        return;
    }
    let token = Date.now();
    let user = {
        username,
        email,
        password,
        token,
        isActive: false
    }
    saveUser(user, function (err) {
        if (err) {
            res.render("signup", { name: null, email: null, isLoggedIn: null, error: err, message: "" });
        } else {
            //req.session.isLoggedIn = true;
            req.session.user = user;

            sendEmail(user.email, user.username, token, false, function (err, data) {
                // console.log(err, data);
                res.render("login", { name: null, email: null, isLoggedIn: null, error: "Please check your inbox and verify your account." });
            })
        }
    })
}).get((req, res) => {
    res.render("signup", { name: null, email: null, isLoggedIn: null, error: "", message: "" });
})

app.get("/verifyuser/:token", (req, res) => {
    const { token } = req.params;
    //console.log(token);
    getUsers(function (err, users) {
        if (err) {
            res.render("signup", { name: null, email: null, isLoggedIn: null, error: "You have not signed up!!", message: "" });
            return;
        }
        let checkEmail = users.filter((val) => {
            if (val.token === parseInt(token)) {
                //req.session.isLoggedIn = true;
                val.isActive = true;
                return true;
            }
        });
        //console.log("checkemail ", checkEmail);
        if (checkEmail.length) {
            writeFile("./userdata.txt", JSON.stringify(users), (err) => {
                if (err) {
                    res.render("signup", { name: null, email: null, isLoggedIn: null, error: "Unable to Signup right now", message: "" });
                    return;
                }
                res.render("login", { name: null, email: null, isLoggedIn: null, error: "Your account is verified." });
            });
        }
        else {
            res.render("login", { name: null, email: null, isLoggedIn: null, error: "You have not Verified Yet " });
        }
    })
})

app.route('/forgetPwd').post((req, res) => {
    // console.log(req.body);
    getUsers((err, users) => {
        if (err) {
            res.send(err);
            return;
        }
        let flag = true;
        users.filter((val) => {
            if (val.email === req.body.email) {
                flag = false;
                sendEmail(val.email, val.username, val.token, true, function (err, data) {
                    //console.log(err, data);
                    res.render("resetPassword", { name: null, email: null, isLoggedIn: null, message: "We have sent you the otp on your email" });
                })
            }
        });
        if (flag) {
            res.render("forgetPassword", { name: null, email: null, isLoggedIn: null, message: "This email is not registered with us" });
        }

    })
}).get((req, res) => {
    res.render("forgetPassword", { name: null, email: null, isLoggedIn: null, message: "" });
})

app.route('/changePwd').post((req, res) => {
    //console.log(req.body);
    const { otp, newPassword, confirmPassword } = req.body;
    getUsers((err, users) => {
        if (err) {
            res.send(err);
            return;
        }
        //console.log(users);
        let flag = false;
        users.filter((val) => {
            if (val.token === parseInt(otp)) {
                flag = true;
                if (newPassword === confirmPassword) {
                    //console.log("req me aaye passwords,",typeof req.body.newPassword, req.body.newPassword);
                    //console.log(val.password);
                    val.password = newPassword;
                    //console.log("val password update k baad", users);
                    writeFile("./userdata.txt", JSON.stringify(users), (err) => {
                        if (err) {
                            res.send(err);
                        }
                    });
                    res.render("login", { name: null, email: null, isLoggedIn: null, error: "Password Changed successfully" });
                    return true;
                } else {
                    res.render("resetPassword", { name: null, email: null, isLoggedIn: null, message: "Password not matched" });
                }
                return true;
            }
        });
        if (!flag) {
            res.render("resetPassword", { name: null, email: null, isLoggedIn: null, message: "Wrong otp" });
        }
    })
})

app.get("/goToCart", (req, res) => {
    if (req.session.isLoggedIn && req.session.user.isActive) {
        readFile("./cart.txt", (err, data) => {
            if (err) {
                console.log(err);
            } else {
                data = data ? JSON.parse(data) : [];
                let products = data.filter(val => req.session.user.email === val.email);
                res.render("cart", { name: req.session.user.username, email: req.session.user.email, products: products, isLoggedIn: req.session.isLoggedIn, key: Publishable_Key });
            }
        })
    }
    else {
        res.render("login", { name: null, email: null, isLoggedIn: null, error: "Please Login First..!!" });
    }
})

app.get("/addToCart", (req, res) => {
    //console.log(req.query.productId);
    if (req.session.isLoggedIn && req.session.user.isActive) {
        const productId = Number(req.query.productId);

        readFile("./products.txt", (err, data) => {
            if (err) {
                console.log(err);
            } else {
                data = data.length ? JSON.parse(data) : [];
                const products = data;
                let cartProduct = products.filter((product, index) => {
                    if (product.productId === productId) {
                        //product.cartFlag = true;
                        return true;
                    }
                })
                // console.log(cartProduct);
                cartProduct[0].cartFlag = true;
                cartProduct[0].email = req.session.user.email;
                // console.log(cartProduct);
                readFile("./cart.txt", (err, data) => {
                    data = data.length ? JSON.parse(data) : [];
                    data.push(cartProduct[0]);
                    writeFile("./cart.txt", JSON.stringify(data), (err) => {
                        if (err) {
                            res.send(err);
                        }
                    });
                    res.send("");
                })
            }
        })
    }
    else {
        res.render("login", { name: null, email: null, isLoggedIn: null, error: null });
    }
})

app.get("/deleteFromCart", (req, res) => {
    //console.log(req.query.productId);
    if (req.session.isLoggedIn && req.session.user.isActive) {
        var productId = Number(req.query.productId);
        readFile("./cart.txt", (err, data) => {
            if (err) {
                console.log(err);
            } else {
                data = JSON.parse(data);
                data = data.filter(val => {
                    if (req.session.user.email === val.email) {
                        if (val.productId === productId) {
                            return false;
                        }
                    }
                    return true;
                })
                writeFile("./cart.txt", JSON.stringify(data), (err) => {
                    if (err) {
                        res.send(err);
                    } else {
                        res.redirect("/goToCart");
                    }
                });
            }
        })
    }
    else {
        res.render("login", { name: null, email: null, isLoggedIn: null, error: null });
    }
})

app.route("/payment").post(function (req, res) {

    // Moreover you can take more details from user
    // like Address, Name, etc from form
    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken,
        name: 'Gourav Hammad',
        address: {
            line1: 'TC 9/4 Old MES colony',
            postal_code: '452331',
            city: 'Indore',
            state: 'Madhya Pradesh',
            country: 'India',
        }
    })
        .then((customer) => {

            return stripe.charges.create({
                amount: 2500,     // Charing Rs 25
                description: 'Web Development Product',
                currency: 'INR',
                customer: customer.id
            });
        })
        .then((charge) => {
            res.send("Success")  // If no error occurs
        })
        .catch((err) => {
            res.send(err)       // If some error occurs
        });
}).get(function (req, res) {
    res.render("payment", {
        key: Publishable_Key
    })
})

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    })
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})