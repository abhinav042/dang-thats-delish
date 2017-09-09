const mongoose = require('mongoose');
const Store = mongoose.model('Store');

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

exports.updateStore = async (req, res) => {
	// find and update the store 
	// findOneAndUpdate requires query, data and options
	const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
		new: true, // return the new data instead of the old one
		runValidators: true // to run validators again 
	}).exec();
	req.flash("success", `Successfully updated ${store.name}!! <a href="/stores/${store.slug}""> View Store!!</a>`);
	// redirect to the store 
	res.redirect(`/stores/${store._id}/edit`);
}
