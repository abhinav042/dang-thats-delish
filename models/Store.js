const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const slug = require('slugs');

const storeSchema = new mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: 'Please enter a store name'
	},
	slug: String,
	description: {
		type: String,
		trim: true
	},
	tags: [String],
	created: {
		type: Date,
		default: Date.now
	},
	location: {
		type: {
			type: String,
			default: "Point"
		},
		coordinates: [{
			type: Number,
			required: "You must supply the coordinates"
		}],
		address: {
			type: String,
			required: "You must supply the address"
		}
	},
	photo: String
});

storeSchema.pre('save', async function(next) {
	if(!this.isModified("name")) {
		next();		//skip the function
		return;
	}
	this.slug = slug(this.name);
	// find other stores with the same slug and rename them
	const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, "i");
	const storesWithSlug = await this.constructor.find({slug: slugRegEx});
	if(storeWithSlug.length) {
		this.slug = `${this.slug}-${storeWithSlug.length + 1}`;
	}
	next();
});

module.exports = mongoose.model('Store', storeSchema);