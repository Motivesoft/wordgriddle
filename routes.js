const express = require('express');
const router = express.Router();
const dictionaryWordEndpoints = require('./dictionaryWordEnpoints');
const bonusWordEndpoints = require('./bonusWordEndpoints');
const excludedWordEndpoints = require('./excludedWordEndpoints');
const adminEndpoints = require('./adminEndpoints');

// Define API routes

// Word list management
router.get('/dictionary', dictionaryWordEndpoints.getWords);
router.post('/dictionary', dictionaryWordEndpoints.installWords);

router.get('/bonus', bonusWordEndpoints.getWords);
router.post('/bonus', bonusWordEndpoints.installWords);

router.get('/excluded', excludedWordEndpoints.getWords);
router.post('/excluded', excludedWordEndpoints.installWords);

router.get('/shutdown', adminEndpoints.shutdown);

module.exports = router;
