function getUniqueId() {
  return new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 8)
}
function getUniqueIdByName(name) {
  return name + '_' + getUniqueId()
}
export { getUniqueId, getUniqueIdByName }
