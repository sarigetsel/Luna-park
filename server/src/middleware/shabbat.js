let hebcalModule = null;

async function loadHebcal() {
  if (!hebcalModule) {
    hebcalModule = await import('@hebcal/core');
  }
  return hebcalModule;
}

async function isShabbatOrHoliday(date = new Date()) {
  const { HebrewCalendar, Location } = await loadHebcal();
  const location = Location.lookup('Jerusalem');
  const events = HebrewCalendar.calendar({
    start: date,
    end: date,
    location,
    isHebrewYear: false,
  });

  return events.some((event) => {
    const categories = event.getCategories();
    return (
      categories.includes('candles') ||
      categories.includes('holiday') ||
      event.basename === 'Shabbat'
    );
  });
}

function shabbatMiddleware(req, res, next) {
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  isShabbatOrHoliday()
    .then((blocked) => {
      if (blocked) {
        return res.status(403).json({
          message: 'הפעולה אינה זמינה בשבת ובחגים. נסו שוב לאחר צאת השבת/ החג.',
        });
      }
      next();
    })
    .catch(next);
}

module.exports = shabbatMiddleware;
