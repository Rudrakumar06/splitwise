const placeholder = require('./placeholder');

exports.createGroup = placeholder('POST /api/groups');
exports.getGroups = placeholder('GET /api/groups');
exports.getGroupById = placeholder('GET /api/groups/:groupId');
exports.updateGroup = placeholder('PUT /api/groups/:groupId');
exports.deleteGroup = placeholder('DELETE /api/groups/:groupId');
