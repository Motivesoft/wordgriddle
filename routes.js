const express = require('express');
const router = express.Router();
const dictionaryWordEndpoints = require('./dictionaryWordEndpoints');
const bonusWordEndpoints = require('./bonusWordEndpoints');
const excludedWordEndpoints = require('./excludedWordEndpoints');
const adminEndpoints = require('./adminEndpoints');

// Define API routes

// Word list management
router.get('/dictionary/info', dictionaryWordEndpoints.info);
router.get('/dictionary/match/:word', dictionaryWordEndpoints.match);
router.get('/dictionary/partial/:letters', dictionaryWordEndpoints.partialMatch);
router.post('/dictionary/upload', dictionaryWordEndpoints.upload);

router.get('/bonus', bonusWordEndpoints.getWords);
router.post('/bonus', bonusWordEndpoints.installWords);

router.post('/excluded/upload', excludedWordEndpoints.upload);
router.get('/excluded/count', excludedWordEndpoints.count);
router.get('/excluded/check/:word', excludedWordEndpoints.checkWord);

router.get('/vacuum', adminEndpoints.vacuum);

module.exports = router;
