"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../server"));
const setup_1 = require("./setup");
describe('Auth Routes', () => {
    it('should return 400 if email is missing', async () => {
        const res = await (0, supertest_1.default)(server_1.default)
            .post('/api/auth/register')
            .send({ name: 'Test', password: 'password123' });
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation failed');
    });
    it('should return 401 for invalid credentials', async () => {
        setup_1.prismaMock.user.findUnique.mockResolvedValue(null);
        const res = await (0, supertest_1.default)(server_1.default)
            .post('/api/auth/login')
            .send({ email: 'nonexistent@test.com', password: 'password123' });
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });
});
//# sourceMappingURL=auth.test.js.map