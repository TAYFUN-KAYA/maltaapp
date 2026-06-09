/** Takvim günü başlangıcı / bitişi (sunucu yerel saati) */
function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d = new Date()) {
  const x = startOfDay(d);
  x.setDate(x.getDate() + 1);
  return x;
}

/** Admin date input → gün ortası (timezone kayması olmasın) */
function parseInsightDate(input) {
  if (!input) return startOfDay();
  if (input instanceof Date) {
    const x = new Date(input);
    x.setHours(12, 0, 0, 0);
    return x;
  }
  const s = String(input).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(`${s}T12:00:00`);
  }
  const x = new Date(s);
  x.setHours(12, 0, 0, 0);
  return x;
}

function audienceFilter(userType) {
  return {
    $or: [
      { userTypes: { $in: [userType, 'all'] } },
      { userTypes: { $exists: false } },
      { userTypes: { $size: 0 } },
    ],
  };
}

async function findHomeInsights(DailyInsight, userType, limit = 6) {
  const audience = audienceFilter(userType);
  const start = startOfDay();
  const end = endOfDay();

  let insights = await DailyInsight.find({
    $and: [audience, { date: { $gte: start, $lt: end } }],
  })
    .sort({ priority: -1 })
    .limit(limit);

  if (!insights.length) {
    insights = await DailyInsight.find(audience).sort({ date: -1, priority: -1 }).limit(limit);
  }

  return insights;
}

module.exports = {
  startOfDay,
  endOfDay,
  parseInsightDate,
  findHomeInsights,
};
