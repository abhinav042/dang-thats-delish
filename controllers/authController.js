const mongoose = require("mongoose");
const User = mongoose.model("User");
const passport = require("passport");
const crypto = require("crypto");
const promisify = require("es6-promisify");

// user login
exports.login = passport.authenticate("local", {
	failureRedirect: "/login",
	failureFlash: "Failed Login 😢",
	successRedirect: "/",
	successFlash: `You're now logged in!` 
});

// user logout
exports.logout = (req, res) => {
	req.logout();
	req.flash("success", "You've logged out! 👋🏽");
	res.redirect("/");
};

// check if user is logged in
exports.isLoggedIn = (req, res, next) => {
	// first check if user is authenicated
	if(req.isAuthenticated()) {
		next(); 
		return;
	}
	req.flash("error", "Woops! You gotta log in to do that!");
	res.redirect("/login");
};

// handling forgot password 
exports.forgot = async (req, res) => {
	// check if user email exists
	const user = await User.findOne({email: req.body.email});
	if (!user) {
		req.flash("error", "That email is not registered!");
		return res.redirect("/login");
	}
	// set reset tokens and expiry on accounts
	user.resetPasswordToken = crypto.randomBytes(20).toString("hex");
	user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
	await user.save();
	// send an email with the token
	const resetUrl = `https://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
	req.flash("success", `You've been emailed a password reset link 👍🏽 ${resetUrl}`);
	// redirect to login page
	res.redirect("/login");
};

exports.reset = async (req, res) => {
	// check if it's the user
	const user = await User.findOne({
		resetPasswordToken: req.params.resetPasswordToken,
		resetPasswordExpires: { $gt: Date.now() }
	});
	// if user meets all the checks, show password reset form
	if(!user) {
		req.flash("error", "Password reset link invalid or expired");
		return res.redirect("/login");
	}
	res.render("reset", {title: "Reset your password"});
};

exports.checkPasswords = (req, res, next) => {
	if(req.body.password === req.body["password-confirm"]) {
		next();
		return;
	}
	req.flash("error", "Passwords don't match");
	res.redirect("back");
};

exports.updatePassword = async (req, res) => {
	const user = await User.findOne({
		resetPasswordToken: req.params.resetPasswordToken,
		resetPasswordExpires: { $gt: Date.now() }
	});
	if (!user) {
		req.flash("error", "Woops! your token is invalid or has expired 👋🏽");
		return res.redirect("/login");
	}
	const setPassword = promisify(user.setPassword, user);
	await setPassword(req.body.password);
	// removing token and token-expiration
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	const updatedUser = await user.save();
	// passing the updated user through passportjs middleware to log them in
	await req.login(updatedUser);
	req.flash("success", "Woohoo Password Reset Successful 💃🏽! Food Time!");
	res.redirect("/");
};

