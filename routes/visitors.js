const express = require('express');
const router = express.Router();
const { VisitorStat, sequelize } = require('../models');

const isSameDay = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  const a = new Date(dateA);
  const b = new Date(dateB);
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
};

const sanitizeIp = (ip) => {
  if (!ip) return null;
  const value = Array.isArray(ip) ? ip[0] : ip;
  return value.split(',')[0].trim().slice(0, 45) || null;
};

const mapStats = (stat) => ({
  totalVisitors: stat?.total_visitors || 0,
  todayVisitors: stat?.today_visitors || 0,
  lastVisitAt: stat?.last_visited_at || null,
  lastVisitorIp: stat?.last_visitor_ip || null,
  lastResetAt: stat?.last_reset_at || null
});

router.get('/', async (req, res) => {
  try {
    let stat = await VisitorStat.findByPk(1);

    if (!stat) {
      stat = await VisitorStat.create({
        id: 1,
        total_visitors: 0,
        today_visitors: 0,
        last_reset_at: new Date()
      });
    } else {
      const now = new Date();
      if (!isSameDay(stat.last_reset_at, now)) {
        stat.today_visitors = 0;
        stat.last_reset_at = now;
        await stat.save();
      }
    }

    res.json({
      success: true,
      data: mapStats(stat)
    });
  } catch (error) {
    console.error('Failed to fetch visitor stats', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve visitor statistics at the moment.'
    });
  }
});

router.post('/', async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    let stat = await VisitorStat.findByPk(1, { transaction, lock: transaction.LOCK.UPDATE });
    const now = new Date();

    if (!stat) {
      stat = await VisitorStat.create({
        id: 1,
        total_visitors: 0,
        today_visitors: 0,
        last_reset_at: now
      }, { transaction });
    }

    if (!isSameDay(stat.last_reset_at, now)) {
      stat.today_visitors = 0;
      stat.last_reset_at = now;
    }

    stat.total_visitors += 1;
    stat.today_visitors += 1;
    stat.last_visited_at = now;
    stat.last_visitor_ip = sanitizeIp(req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress);

    await stat.save({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      data: mapStats(stat)
    });
  } catch (error) {
    console.error('Failed to track visitor', error);
    await transaction.rollback();
    res.status(500).json({
      success: false,
      message: 'Unable to track visitor at the moment.'
    });
  }
});

module.exports = router;


