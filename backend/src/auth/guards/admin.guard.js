"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../jwt-auth.guard");
const client_1 = require("@prisma/client");
let AdminGuard = class AdminGuard extends jwt_auth_guard_1.JwtAuthGuard {
    async canActivate(context) {
        const isValid = await super.canActivate(context);
        if (!isValid) {
            return false;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (user && user.role === client_1.UserRole.ADMIN) {
            return true;
        }
        throw new common_1.ForbiddenException('You do not have sufficient permissions to access this resource');
    }
};
exports.AdminGuard = AdminGuard;
exports.AdminGuard = AdminGuard = __decorate([
    (0, common_1.Injectable)()
], AdminGuard);
//# sourceMappingURL=admin.guard.js.map