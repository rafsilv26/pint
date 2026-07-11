const scopeError = () => {
  const error = new Error('O perfil Service Line Leader não tem uma Service Line válida associada.');
  error.statusCode = 403;
  error.code = 'SERVICE_LINE_SCOPE_MISSING';
  return error;
};

const resolveServiceLineScopeForUser = async (user, findLeader) => {
  const roles = user?.roles || [];
  if (!roles.length) return null;
  if (roles.includes('Admin') || roles.includes('TalentManager')) return null;
  if (!roles.includes('ServiceLineLeader')) return null;

  const ssl = await findLeader(user.id);
  if (!ssl?.serviceLineId) throw scopeError();
  return Number(ssl.serviceLineId);
};

module.exports = { resolveServiceLineScopeForUser };
