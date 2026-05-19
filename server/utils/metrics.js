function emptyMethod() {
  return {
    history: [],
    totalTimeMs: 0,
    avgTimeMs: 0,
    totalCpu: 0,
    avgCpu: 0,
    totalMemoryMb: 0,
    avgMemoryMb: 0,
  };
}

function sum(items, key) {
  return items.reduce((acc, item) => acc + Number(item[key] || 0), 0);
}

function recomputeMethodTotals(methodObj) {
  const history = methodObj.history || [];
  methodObj.totalTimeMs = sum(history, "timeMs");
  methodObj.totalCpu = sum(history, "cpu");
  methodObj.totalMemoryMb = sum(history, "memoryMb");
  methodObj.avgTimeMs = history.length
    ? methodObj.totalTimeMs / history.length
    : 0;
  methodObj.avgCpu = history.length ? methodObj.totalCpu / history.length : 0;
  methodObj.avgMemoryMb = history.length
    ? methodObj.totalMemoryMb / history.length
    : 0;
}

function appendHistory(methodObj, entry, retentionDays) {
  methodObj.history.push(entry);
  const cutoff = Date.now() - Number(retentionDays || 30) * 24 * 60 * 60 * 1000;
  methodObj.history = methodObj.history.filter(
    (item) => !item.time || new Date(item.time).getTime() >= cutoff,
  );
  recomputeMethodTotals(methodObj);
}

module.exports = {
  emptyMethod,
  recomputeMethodTotals,
  appendHistory,
};
