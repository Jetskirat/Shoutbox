import express from 'express';
import { signup, login, logout, getMe } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protectRoute, getMe);//protectRoute is a middleware, getMe will only be called when protectRoute calls next()

export default router;