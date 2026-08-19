const placeholder = require('./placeholder');

exports.addMember = placeholder('POST /api/groups/:groupId/members');
exports.removeMember = placeholder('DELETE /api/groups/:groupId/members/:userId');
exports.getMembers = placeholder('GET /api/groups/:groupId/members');
