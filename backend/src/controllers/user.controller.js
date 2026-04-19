import * as userService from '../services/user.service.js';

export async function getProfileHandler(req, res, next) {
  try {
    const user = await userService.getUserById(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfileHandler(req, res, next) {
  try {
    const { username, bio, password } = req.body;
    const updated = await userService.updateUser(
      req.user.id, { username, bio, password }, req.file,
    );
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function getPublicProfileHandler(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: 'Невірний id' });
    const user = await userService.getUserById(id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function getActivityStatsHandler(req, res, next) {
  try {
    const stats = await userService.getActivityStats(req.user.id);
    res.json(stats);
  } catch (err) {
    next(err);
  }
}