"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
function notFound(req, res) {
    res.status(404).json({
        error: `Route ${req.method} ${req.path} not found`,
    });
}
//# sourceMappingURL=notFound.js.map