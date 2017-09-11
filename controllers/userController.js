const mongoose = require("mongoose");

exports.loginForm = (req, res) => {
	res.render("login", {title: "Login" });
}

exports.registerForm = (req, res) => {
	res.render("register", {title: "Register"});
}

// server-side check for validation
exports.validateRegister = (req, res, next) => {
	req.sanitizeBody("name");
	req.checkBody("name", "You must supply a name!").notEmpty();
	req.checkBody("email", "You must supply an email").isEmail();
	req.sanitizeBody("email").normalizeEmail({
		remove_dots: false,
		remove_extension: false,
		gmail_remove_subaddress: false
	});
	req.checkBody("password", "Please enter a password").notEmpty();
	req.checkBody("password-confirm", "Please re-enter the password").notEmpty();
	req.checkBody("password-confirm", "Woops! Your passwords don't match!").equals(req.body.password);

	const errors = req.validationErrors();
	if (errors) {
		req.flash("error", errors.map(err => err.msg));
		res.render("register", {title: "Register", body: req.body, flashes: req.flash() });
		return;
	}
	next();
};