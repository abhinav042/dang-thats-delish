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
	photo: String,
	author: {
		type: mongoose.Schema.ObjectId,
		ref: "User",
		required: "You must supply an author"
	}
});

// define our indexes
storeSchema.index({
	name: "text",
	description: "text",
})

storeSchema.index({
	location: "2dsphere"
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
	if(storesWithSlug.length) {
		this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
	}
	next();
});

storeSchema.statics.getTagsList = function () {
	return this.aggregate([
		{ $unwind: "$tags" },
		{ $group: {_id: "$tags", count: {$sum: 1} } }
	]);
};

storeSchema.statics.getTopStores = function() {
	return this.aggregate([
		// look up stores and populate their reviews
		{ 
			$lookup: {from: "reviews", localField: "_id",
					foreignField: "store", as: "reviews" }
		},
		// filter for only 2 or more reviews, reviews.1 === 2nd review
		{
			$match: { "reviews.1": {$exists: true}}
		},
		// add the avg reviews field
		{
			$addFields: {
				averageRating: { $avg:"$reviews.rating" }
			}
		},
		// sort it by our new field
		{
			$sort: { averageRating: -1 }
		},
		// limit to at most 10
		{
			$limit: 10
		}
	])
}

// find reviews where the stores _id property === reviews store property
storeSchema.virtual("reviews", {
	ref: "Review",	// what model to link?
	localField: "_id",	// which field to store? 
	foreignField: "store" // which field to review
});

function autopopulate(next) {
	this.populate("reviews")
	next();
}

storeSchema.pre("find", autopopulate);
storeSchema.pre("findOne", autopopulate);

module.exports = mongoose.model('Store', storeSchema);