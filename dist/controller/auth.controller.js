"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeTo = exports.refreshToken = exports.sendSignupVerifyEmailController = exports.sendLoginVerifyEmailController = exports.logout = exports.login = exports.signup = void 0;
const user_model_1 = __importDefault(require("../model/user.model"));
const catch_errors_1 = __importDefault(require("../utils/catch-errors"));
const catch_errors_2 = __importDefault(require("../utils/catch-errors"));
const app_error_1 = __importDefault(require("../utils/app-error"));
const auth_validator_1 = require("../validator/auth.validator");
const auth_service_1 = require("../service/auth.service");
const http_status_codes_1 = require("http-status-codes");
const cookies_1 = require("../utils/cookies");
const jwt_1 = require("../utils/jwt");
const session_model_1 = __importDefault(require("../model/session.model"));
const app_assert_1 = __importDefault(require("../utils/app-assert"));
const zod_1 = require("zod");
const deep_email_validator_1 = __importDefault(require("deep-email-validator"));
exports.signup = (0, catch_errors_2.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { otp, plan } = req.body;
    if (!req.query.token)
        return next(new app_error_1.default("Token is param required.", http_status_codes_1.StatusCodes.BAD_REQUEST));
    const request = auth_validator_1.signupSchema.parse({
        otp,
    });
    const { refreshToken, accessToken } = yield (0, auth_service_1.createAccount)(Object.assign(Object.assign({}, request), { verifyToken: String(req.query.token), location: req.location, userAgent: req.userAgent, plan }));
    return (0, cookies_1.setAuthCookies)({ res, refreshToken, accessToken })
        .status(http_status_codes_1.StatusCodes.OK)
        .json({
        status: "success",
        message: "Signup is successful.",
    });
}));
exports.login = (0, catch_errors_2.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { otp } = req.body;
    if (!req.query.token)
        return next(new app_error_1.default("Token is param required.", http_status_codes_1.StatusCodes.BAD_REQUEST));
    const request = auth_validator_1.loginSchema.parse({
        otp,
    });
    const { accessToken, refreshToken } = yield (0, auth_service_1.loginUser)(Object.assign(Object.assign({}, request), { verifyToken: String(req.query.token), userAgent: req.userAgent, location: req.location }));
    return (0, cookies_1.setAuthCookies)({ res, refreshToken, accessToken })
        .status(http_status_codes_1.StatusCodes.OK)
        .json({
        status: "success",
        message: "Login is successful.",
    });
}));
exports.logout = (0, catch_errors_2.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const accessToken = ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split("Bearer ")[1].trim()) ||
        req.cookies.accessToken;
    const { payload } = (0, jwt_1.verifyToken)(accessToken);
    if (!payload || !payload.sessionId)
        return next(new app_error_1.default("You are not logged in.", http_status_codes_1.StatusCodes.BAD_REQUEST));
    yield session_model_1.default.findByIdAndDelete(payload.sessionId);
    yield user_model_1.default.findByIdAndUpdate(payload.userId, { verified: false }, { runValidators: false });
    return (0, cookies_1.clearAuthCookies)(res).status(http_status_codes_1.StatusCodes.OK).json({
        status: "success",
        message: "Logout successful",
    });
}));
exports.sendLoginVerifyEmailController = (0, catch_errors_2.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const email = auth_validator_1.emailSchema.parse(req.body.email);
    const token = yield (0, auth_service_1.sendLoginEmailVerification)({
        email,
    });
    return (0, cookies_1.setVerifyCookies)({
        res,
        verifyToken: token,
    })
        .status(http_status_codes_1.StatusCodes.OK)
        .json({
        status: "success",
        message: "Verification email has been sent. The code will expire after 5 minutes.",
    });
}));
exports.sendSignupVerifyEmailController = (0, catch_errors_2.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const validEmail = yield (0, deep_email_validator_1.default)(req.body.email);
    let validName;
    try {
        validName = zod_1.z
            .string()
            .trim()
            .regex(/^[A-Za-z\s]+$/, {
            message: "Name must contain only letters",
        })
            .parse(req.body.name);
    }
    catch (err) {
        const message = (_b = (_a = err.errors) === null || _a === void 0 ? void 0 : _a.at(0)) === null || _b === void 0 ? void 0 : _b.message;
        return next(new app_error_1.default(message || "", http_status_codes_1.StatusCodes.BAD_REQUEST));
    }
    if (!validEmail.valid)
        return next(new app_error_1.default(((_c = validEmail.validators.regex) === null || _c === void 0 ? void 0 : _c.reason) ||
            ((_d = validEmail.validators.typo) === null || _d === void 0 ? void 0 : _d.reason) ||
            ((_e = validEmail.validators.mx) === null || _e === void 0 ? void 0 : _e.reason) ||
            ((_f = validEmail.validators.smtp) === null || _f === void 0 ? void 0 : _f.reason) ||
            ((_g = validEmail.validators.disposable) === null || _g === void 0 ? void 0 : _g.reason) ||
            "Email is not valid.", http_status_codes_1.StatusCodes.BAD_REQUEST));
    const token = yield (0, auth_service_1.sendSignupEmailVerification)({ name: validName, email: req.body.email }, req.location);
    return (0, cookies_1.setVerifyCookies)({
        res,
        verifyToken: token,
    })
        .status(http_status_codes_1.StatusCodes.OK)
        .json({
        status: "success",
        message: "Verification email has been sent. The code will expire after 5 minutes.",
    });
}));
exports.refreshToken = (0, catch_errors_2.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const refreshToken = req.cookies.refreshToken;
    (0, app_assert_1.default)(refreshToken, "Missing refresh token", http_status_codes_1.StatusCodes.UNAUTHORIZED);
    const { newRefreshToken, accessToken } = yield (0, auth_service_1.refreshUserAccessToken)(refreshToken);
    if (newRefreshToken) {
        res.cookie("refreshToken", newRefreshToken, (0, cookies_1.getRefreshTokenCookieOptions)());
    }
    return res
        .status(http_status_codes_1.StatusCodes.OK)
        .cookie("accessToken", accessToken, (0, cookies_1.getAccessTokenCookieOptions)())
        .json({
        status: "success",
        message: "Access token refreshed",
    });
}));
const authorizeTo = (roles) => (0, catch_errors_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.default.findById(req.userId).select("+role");
    if (!user || !roles.includes(user.role)) {
        return next(new app_error_1.default("You do not have permission to perform this action.", http_status_codes_1.StatusCodes.FORBIDDEN));
    }
    next();
}));
exports.authorizeTo = authorizeTo;
/*
export const verifyEmailController = catchErrors(async (req, res, next) => {
  // await verifyEmail(req.params.token);

  await verifyOTP(req.body.otp, req.body.email, OTPPurpose.EMAIL_VERIFICATION);

  return res.status(StatusCodes.OK).json({
    status: "success",
    message: "Email was successfully verified",
  });
});

export const updatePassword = catchErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.userId).select("+password");

    if (!user)
      return next(
        new AppError("You are not logged in.", StatusCodes.UNAUTHORIZED),
      );

    if (!(await user.comparePasswords(req.body.passwordCurrent, user.password)))
      return next(
        new AppError("Password is incorrect.", StatusCodes.UNAUTHORIZED),
      );

    const session = await Session.findById(req.sessionId);

    if (!session)
      return next(new AppError("No session found.", StatusCodes.NOT_FOUND));

    await Session.deleteMany({
      userId: req.userId,
      _id: { $ne: req.sessionId },
    });

    const accessToken = signToken({
      sessionId: session._id,
      userId: user._id,
    });

    const refreshToken = signToken(
      { sessionId: session._id },
      refreshTokenSignOptions,
    );

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    return setAuthCookies({ res, accessToken, refreshToken })
      .status(StatusCodes.OK)
      .json({
        status: "success",
        message: "Password changed successfully.",
      });
  },
);

export const forgotPassword = catchErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user)
      return next(
        new AppError("No user with this email.", StatusCodes.NOT_FOUND),
      );

    const resetToken = user.createResetPasswordToken();

    await user.save({
      validateBeforeSave: false,
    });

    const url = `${client_dev_origin}/auth/password/reset/${resetToken}`;

    try {
      await sendMail({
        to: [user.email],
        ...verifyEmailTemplate(url),
      });
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Check your email.",
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          "Failed to send the token to your email.",
          StatusCodes.INTERNAL_SERVER_ERROR,
        ),
      );
    }
  },
);

export const resetPassword = catchErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gte: Date.now(),
      },
    });

    if (!user)
      return next(
        new AppError("Token is invalid or has expired. Try again.", 400),
      );

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.resetPasswordExpires = undefined;
    user.resetPasswordToken = undefined;

    await user.save();
    await Session.deleteMany({
      userId: user._id,
    });

    return clearAuthCookies(res).status(StatusCodes.OK).json({
      status: "success",
      message:
        "Password reset successfully. You need to log in with your new password.",
    });
  },
);
*/
