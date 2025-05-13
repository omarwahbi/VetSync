"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVisitDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateVisitDto {
    visitDate;
    visitType;
    notes;
    price;
    nextReminderDate;
    isReminderEnabled;
    temperature;
    weight;
    weightUnit;
    heartRate;
    respiratoryRate;
}
exports.CreateVisitDto = CreateVisitDto;
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVisitDto.prototype, "visitDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVisitDto.prototype, "visitType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVisitDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 2 }),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(999999.99),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateVisitDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVisitDto.prototype, "nextReminderDate", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateVisitDto.prototype, "isReminderEnabled", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Temperature must be a number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(50),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateVisitDto.prototype, "temperature", void 0);
__decorate([
    (0, class_validator_1.IsNumber)({}, { message: 'Weight must be a number' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateVisitDto.prototype, "weight", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['kg', 'lb']),
    __metadata("design:type", String)
], CreateVisitDto.prototype, "weightUnit", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Heart rate must be an integer' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateVisitDto.prototype, "heartRate", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Respiratory rate must be an integer' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateVisitDto.prototype, "respiratoryRate", void 0);
//# sourceMappingURL=create-visit.dto.js.map