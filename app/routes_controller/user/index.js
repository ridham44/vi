const router = require('express').Router();
const auth = require('../../middlewares/middleware');
const controller = require('./lib/controller');

const { status } = require('../../../utils');
const {
    loginRules,
    changePasswordRules,
    validationRules,
    updateValidationRules,
    forgotPasswordRules,
    resetPasswordRules,
} = require('./lib/validation');
const { expressValidate } = require('../../../utils/lib/common-function');
const multer = require('multer');
//const path = require('path');

const allowedType = ['image/png', 'image/jpeg', 'image/jpg'];

const fileStorage = multer.diskStorage({
    destination: 'uploads/userProfile',
    filename: (req, file, cb) => {
        //const ext = path.extname(file.originalname);
        const filename = file.originalname.replace(/\s+/g, '_');
        cb(null, Date.now() + filename);
    },
});

const fileFilter = (req, file, cb) => {
    if (allowedType.includes(file.mimetype)) {
        return cb(null, true);
    } else {
        req.fileValidationError = true;
        return cb(null, false, req.fileValidationError);
    }
};

const multerMiddleware = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        let errorMessage = 'File upload error!';
        if (err?.code == 'LIMIT_UNEXPECTED_FILE') {
            errorMessage = `${err?.message} ${err?.field}`;
        }
        return res.status(status.InternalServerError).json({ message: errorMessage });
    }
    if (req.fileValidationError) {
        return res.status(status.BadRequest).json({ message: 'Only .png, .jpg and .jpeg format allowed!' });
    }

    next();
};

// multer upload object
const uploads = multer({
    storage: fileStorage,
    fileFilter: fileFilter,
});

router.post('/login', loginRules(), expressValidate, controller.userLogin);

router.post('/logout', auth, controller.userLogout);

router.put('/change-password', auth, changePasswordRules(), expressValidate, controller.changePassword);

router.post('/forgot-password', forgotPasswordRules(), expressValidate, controller.forgotPassword);

router.post('/reset-password', resetPasswordRules(), expressValidate, controller.resetPassword);

router.get('/user-list', auth, controller.getAllUser);

router.post('/user', auth, uploads.single('profileImage'), multerMiddleware, validationRules(), expressValidate, controller.createUser);

router.put(
    '/user/:id',
    auth,
    uploads.single('profileImage'),
    multerMiddleware,
    updateValidationRules(),
    expressValidate,
    controller.updateUser
);

router.get('/user/:id', controller.getUser);

router.delete('/user/:id', auth, controller.deleteUser);

router.put('/user/status/:id', auth, controller.updateStatus);

module.exports = router;
