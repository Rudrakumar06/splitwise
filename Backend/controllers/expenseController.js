const placeholder = require('./placeholder');

exports.createExpense = placeholder('POST /api/groups/:groupId/expenses');
exports.getExpenses = placeholder('GET /api/groups/:groupId/expenses');
exports.getExpenseById = placeholder('GET /api/groups/:groupId/expenses/:expenseId');
exports.updateExpense = placeholder('PUT /api/groups/:groupId/expenses/:expenseId');
exports.deleteExpense = placeholder('DELETE /api/groups/:groupId/expenses/:expenseId');
