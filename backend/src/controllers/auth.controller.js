import * as authService from '../services/auth.service.js';

export async function registerHandler(req, res, next) {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email та пароль обовʼязкові' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль має бути не менше 6 символів' });
    }

    const result = await authService.register({ username, email, password, role });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email та пароль обовʼязкові' });
    }

    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getMeHandler(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}
