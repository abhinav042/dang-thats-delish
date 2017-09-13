const mongoose = require("mongoose");
const User = mongoose.model("User");
const promisify = require("es6-promisify");
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

// saving users to the database
exports.registerUser = async (req, res, next) => {
	const user = new User({email: req.body.email, name: req.body.name });
	const registerPromise = promisify(User.register, User);
	await registerPromise(user, req.body.password);
	next();
}

// pulling up the users account page
exports.account = (req, res) => {
	res.render("account", {title: "Edit your Account"});
}

exports.updateAccount = async (req, res) => {
	const updates = {
		name: req.body.name,
		email: req.body.email
	}
	const user = await User.findOneAndUpdate(
		{ _id: req.user._id },
		{ $set: updates },
		{ new: true, runValidators: true, context: "query" }
	).exec();
	req.flash("success", `Details updated successfully! 👍🏽`);
	res.redirect("/account");
}