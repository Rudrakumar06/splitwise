const router = require('express').Router();
const groupController = require('../controllers/groupController');
const memberController = require('../controllers/groupMemberController');
const expenseController = require('../controllers/expenseController');
const balanceController = require('../controllers/balanceController');
const settlementController = require('../controllers/settlementController');

router.post('/', groupController.createGroup);
router.get('/', groupController.getGroups);
router.get('/:groupId', groupController.getGroupById);
router.put('/:groupId', groupController.updateGroup);
router.delete('/:groupId', groupController.deleteGroup);

router.post('/:groupId/members', memberController.addMember);
router.delete('/:groupId/members/:userId', memberController.removeMember);
router.get('/:groupId/members', memberController.getMembers);

router.post('/:groupId/expenses', expenseController.createExpense);
router.get('/:groupId/expenses', expenseController.getExpenses);
router.get('/:groupId/expenses/:expenseId', expenseController.getExpenseById);
router.put('/:groupId/expenses/:expenseId', expenseController.updateExpense);
router.delete('/:groupId/expenses/:expenseId', expenseController.deleteExpense);

router.get('/:groupId/balances', balanceController.getGroupBalances);

router.post('/:groupId/settlements', settlementController.createSettlement);
router.get('/:groupId/settlements', settlementController.getSettlements);

module.exports = router;
