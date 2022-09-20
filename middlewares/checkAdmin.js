module.exports = function (req, res, next) {
    // console.log(req.session.isLoggedIn);
    if (req.session.isLoggedIn && req.session.user.isActive && req.session.user.isAdmin) {
        next();
    } else {
        res.render("admin/adminLogin", { name: null, email: null, isLoggedIn: null, error: null });
    }
}