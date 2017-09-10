const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require("multer");
const jimp = require("jimp");
const uuid = require("uuid"); // unique id for every image uploaded

// for image upload format validation 
const multerOptions = {
	storage: multer.memoryStorage(),
	fileFilter(req, file, next) {
		const isPhoto = file.mimetype.startsWith("image/");
		if (isPhoto) {
			next(null, true);
		} else {
			next({message: "That filetype ain't allowed"}, false);
		}
	}
};

exports.homePage = (req, res) => {
	res.render("index");
};

exports.addStore = (req, res) => {
	res.render("editStore", {title: 'Add Store'});
};

exports.createStore = async (req, res) => {
	const store = await(new Store(req.body).save());
	req.flash("success", `Store created ${store.name}`);
	res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
	// query the db for a list of all stores
	const stores = await Store.find();
	res.render("stores", {title: "Stores", stores}); 
};

exports.editStore = async (req, res) => {
	// 1. find the store given the id
	const store = await Store.findOne({ _id: req.params.id });
	// 2. confirm owner

	// 3. render out the editStore form
	res.render("editStore", {title: `edit ${store.name}`, store});
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
	// check if there is a file
	if (!req.file)
		next();
	// getting the extension and renaming to a unique id
	const extension = req.file.mimetype.split("/")[1];
	req.body.photo = `${uuid.v4()}.${extension}`;
	// resizing
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	next();
}

exports.updateStore = async (req, res) => {
	// set the type of data to be a Point
	req.body.location.type = "Point";
	// find and update the store 
	// findOneAndUpdate requires query, data and options
	const store = await Store.findOneAndUpdate({ _id: req.params.id }, 
		req.body, {
		new: true, // return the new data instead of the old one
		runValidators: true // to run validators again 
	}).exec();
	req.flash("success", `Successfully updated ${store.name}!! <a href="/stores/${store.slug}""> View Store!!</a>`);
	// redirect to the store 
	res.redirect(`/stores/${store._id}/edit`);
}

exports.getStoreBySlug = async (req, res, next) => {
	const store = await Store.findOne({ slug: req.params.slug });
	if (!store)
		return next(); 
	res.render("store", {store, title: store.name});
};


