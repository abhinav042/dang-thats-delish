const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const User = mongoose.model("User"); 
const Review = mongoose.model("Review"); 
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
	req.body.author = req.user._id;
	const store = await(new Store(req.body).save());
	req.flash("success", `Store created ${store.name}`);
	res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
	const page = req.params.page || 1;
	const limit = 6;
	const skip = (page * limit) - limit;
	// query the db for a list of all stores
	const storesPromise = Store
		.find()
		.skip(skip)
		.limit(limit)
		.sort({created: "desc"});
	const countPromise = Store.count();
	const [stores, count] = await Promise.all([storesPromise, countPromise]);
	const pages = Math.ceil(count / limit);
	if (!stores.length && skip) {
		req.flash("info", `You got redirected to Page ${pages} of Stores, because the page you requested doesn't exist! `);
		res.redirect(`/stores/page/${pages}`);
		return;
	}
	res.render("stores", {title: "Stores", pages, page, count, stores}); 
};

const confirmOwner = (store, user, req, res) => {
	if(!store.author.equals(user._id)) {
		req.flash("error", "You need to own the store to edit it!");
		res.redirect("back");
		return;
	}
};

exports.editStore = async (req, res) => {
	// 1. find the store given the id
	const store = await Store.findOne({ _id: req.params.id });
	// 2. confirm owner (prevent them from editing the store if they arent the owner)
	confirmOwner(store, req.user, req, res);
	// 3. render out the editStore form
	res.render("editStore", {title: `edit ${store.name}`, store});
};

exports.upload = multer(multerOptions).single("photo");

exports.resize = async (req, res, next) => {
	// check if there is a file
	if (!req.file) {
		next();
		return;
	}
	// getting the extension and renaming to a unique id
	const extension = req.file.mimetype.split("/")[1];
	req.body.photo = `${uuid.v4()}.${extension}`;
	// resizing
	const photo = await jimp.read(req.file.buffer);
	await photo.resize(800, jimp.AUTO);
	await photo.write(`./public/uploads/${req.body.photo}`);
	next();
};

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
};

exports.getStoreBySlug = async (req, res, next) => {
	const store = await Store.findOne({ slug: req.params.slug }).populate("author reviews");
	if (!store)
		return next(); 
	res.render("store", {store, title: store.name});
};

exports.getStoresByTag = async (req, res) => {
	const tagId = req.params.tag;
	const tagQuery = tagId || {$exists: true};
	const tagsPromise = Store.getTagsList();
	const storesPromise = Store.find({tags: tagQuery});
	const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
	res.render("tags", {tagId, tags, title: "Tags", stores} );
};

exports.mapPage = (req, res) => {
	res.render("map", { title: "Map"});
};

exports.heartedStores = async (req, res) => {
	const userDetails = await User.findOne({hearts: req.user.hearts}).populate("hearts");
	const stores = userDetails.hearts;
	res.render("stores", {title: "Hearted Stores", stores});
};

exports.getTopStores = async (req, res) => {
	const stores = await Store.getTopStores();
	res.render("topStores", {stores, title:"⭐ TOP STORES~"});
}

/*

	APIs

*/

exports.searchStores = async (req, res) => {
	const stores = await Store
	// find the stores which meet the search reqs
	.find({
		$text: { $search: req.query.q }
	}, {
		score: { $meta: "textScore" }
	})
	// sort them according to the score (the number of times the word appeared)
	.sort({
		score: { $meta: "textScore" }
	})
	// limit the search result to 5 stores
	.limit(5);
	res.json(stores);
};

exports.mapStores = async (req, res) => {
	const coordinates = [req.query.lng, req.query.lat].map(parseFloat);
	const q = {
		location: {
			$near: {
				$geometry: {
					type: "Point",
					coordinates
				},
				$maxDistance: 10000 // 10km -> 6.2miles
			}
		}
	};

	const stores = await Store.find(q).select("slug location description name photo").limit(10);
	res.json(stores);
};

exports.heartStore = async (req, res) => {
	const hearts = req.user.hearts.map(obj => obj.toString());
	const operator = hearts.includes(req.params.id) ? "$pull" : "$addToSet";
	const user = await User
	.findByIdAndUpdate(req.user._id, 
		{ [operator]: { hearts: req.params.id} },
		{ new: true }
	)
	res.json(user);
};
 


