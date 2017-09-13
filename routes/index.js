const express = require("express");
const router = express.Router();
const storeController = require("../controllers/storeController");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
const { catchErrors } = require("../handlers/errorHandlers");

router.get("/", catchErrors(storeController.getStores)); // get a list of all stores
router.get("/stores", catchErrors(storeController.getStores)); // ^^
router.get("/add", authController.isLoggedIn, storeController.addStore); // adding a store
router.post("/add", 
	storeController.upload,
	catchErrors(storeController.resize),
	catchErrors(storeController.createStore)); // uploading the store img, resizing the img, and creating the store
router.get("/stores/:id/edit", catchErrors(storeController.editStore)); // for adding and editing stores
router.post("/add/:id", 
	storeController.upload,
	catchErrors(storeController.resize),
	catchErrors(storeController.updateStore)); // for updating the stores 
router.get("/store/:slug", catchErrors(storeController.getStoreBySlug));

// router for tags
router.get("/tags", catchErrors(storeController.getStoresByTag));
router.get("/tags/:tag", catchErrors(storeController.getStoresByTag));

// router for login and handling users
// getting the login form
router.get("/login", userController.loginForm); 
// handling log ins
router.post("/login", authController.login);
// get the register form
router.get("/register", userController.registerForm);
// validate the data
// register the user 
// log the user in as soon as he/she registers
router.post("/register", 
	userController.validateRegister,
	catchErrors(userController.registerUser),
	authController.login,
	authController.logout
);

// logging out
router.get("/logout", authController.logout);

// view-edit user account
router.get("/account", 
	authController.isLoggedIn,
	userController.account
);
router.post("/account", catchErrors(userController.updateAccount));

// handling password reset
router.post("/account/forgot", catchErrors(authController.forgot));
router.get("/account/reset/:resetPasswordToken", catchErrors(authController.reset));
router.post("/account/reset/:resetPasswordToken",
	authController.checkPasswords,
	catchErrors(authController.updatePassword)
);

module.exports = router;
