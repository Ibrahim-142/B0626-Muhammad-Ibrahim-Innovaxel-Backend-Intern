const router = require("express").Router();
const controller = require("../controllers/event.controller");

router.post("/",  controller.createEvent);
router.get("/", controller.getEvents);

module.exports = router;