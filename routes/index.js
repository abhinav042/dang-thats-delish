const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const { catchErrors } = require("../handlers/errorHandlers");

router.get("/", catchErrors(storeController.getStores));
router.get("/stores", catchErrors(storeController.getStores));
router.get("/add", storeController.addStore);
router.post("/add", 
	storeController.upload,
	catchErrors(storeController.resize),
	catchErrors(storeController.createStore));
router.get("/stores/:id/edit", catchErrors(storeController.editStore)); // for adding and editing stores
router.post("/add/:id", 
	storeController.upload,
	catchErrors(storeController.resize),
	catchErrors(storeController.updateStore)); // for updating the stores 
router.get("/store/:slug", catchErrors(storeController.getStoreBySlug));

// router for tags
router.get("/tags", catchErrors(storeController.getStoresByTag));
router.get("/tags/:tag", catchErrors(storeController.getStoresByTag));

module.exports = router;
