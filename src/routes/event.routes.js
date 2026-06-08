const router = require("express").Router();
const controller = require("../controllers/event.controller");
const { validateEvent } = require("../middlewares/validate.middleware");

router.post("/", validateEvent, controller.createEvent);
router.get("/sort", controller.getSortedEvents);
router.get("/", controller.getEvents);

module.exports = router;