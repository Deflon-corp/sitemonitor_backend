const userService = require("../services/user.service.js");

async function createUser(req, res, next) {
  try {
    const result = await userService.create_user_service({
      body: req.body,
      user: req.user,
      tenantId: req.tenantId,
    });
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

async function getUserList(req, res, next) {
  try {
    const result = await userService.get_user_list_service({
      query: req.query,
      tenantId: req.tenantId,
    });
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const result = await userService.get_user_by_id_service({
      params: req.params,
      tenantId: req.tenantId,
    });
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const result = await userService.update_user_service({
      params: req.params,
      body: req.body,
      user: req.user,
      tenantId: req.tenantId,
    });
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const result = await userService.delete_user_service({
      params: req.params,
      user: req.user,
      tenantId: req.tenantId,
    });
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

async function bulkCreateUsers(req, res, next) {
  try {
    const result = await userService.bulk_create_users_service({
      body: req.body,
      user: req.user,
      tenantId: req.tenantId,
    });
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

async function loginUser(req, res, next) {
  try {
    const result = await userService.login_user_service({
      body: req.body,
      tenantId: req.tenantId,
    });
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

async function archiveUser(req, res, next) {
  try {
    const result = await userService.archive_user_service({
      params: req.params,
      tenantId: req.tenantId,
    });
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

async function restoreUser(req, res, next) {
  try {
    const result = await userService.restore_user_service({
      params: req.params,
      tenantId: req.tenantId,
    });
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

async function hardDeleteUser(req, res, next) {
  try {
    const result = await userService.hard_delete_user_service({
      params: req.params,
      tenantId: req.tenantId,
    });
    res.status(result.statusCode).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUser,
  getUserList,
  getUserById,
  updateUser,
  deleteUser,
  bulkCreateUsers,
  loginUser,
  archiveUser,
  restoreUser,
  hardDeleteUser,
};
