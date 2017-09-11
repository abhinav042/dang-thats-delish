const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require("md5");
const validator = require("validator");
const passportLocalMongoose = require("passport-local-mongoose");
const mongodbErrorHandler = require("mongoose-mongodb-errors");

const userSchema = new mongoose.Schema ({
	email: {
		type: String,
		// checking if unique
		unique: true,
		// converting to lowercase
		lowercase: true,
		// trimming the email to remove whitespaces
		trim: true,
		// checking email validation on server-side
		validate: [
			validator.isEmail,
			"Invalid Email Address"
		],
		required: "Please supply an email"
	}
	name: {
		type: String, 
		required: "Please supply a name!",
		trim: true
	}
});

userSchema.plugin(passportLocalMongoose, {usernameField: email});
userSchema.plugin(mongodbErrorHandler);

module.exports = mongoose.model("User", userSchema);