module.exports = function (req, res, next) {
    // console.log(req.session.isLoggedIn);
    if (req.session.isLoggedIn && req.session.user.isActive) {
        next();
    } else if (req.session.isLoggedIn && !req.session.user.isActive) {
        res.render("login", { name: null, email: null, isLoggedIn: null, error: "Your account is not verified yet" });
    } else {
        res.render("login", { name: null, email: null, isLoggedIn: null, error: null });
    }
}