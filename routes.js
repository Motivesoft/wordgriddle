// External requires
const express = require('express');

const adminEndpoints = require('./adminEndpoints');
const WordListEndpoint = require('./wordListEndpoints'); 

const router = express.Router();


// Define API routes

// Route to instances. Use the 'arrow function' for readability, but could also use 'instance.method.bind(instance)'
const dictionaryWordEndpoints = new WordListEndpoint('dictionaryWordList');
const bonusWordEndpoints = new WordListEndpoint('bonusWordList');
const excludedWordEndpoints = new WordListEndpoint('excludedWordList');

// Word list management
router.get('/dictionary/info', (req, res) => dictionaryWordEndpoints.info(req, res));
router.get('/dictionary/match/:word', (req, res) => dictionaryWordEndpoints.match(req, res));
router.get('/dictionary/partial/:letters', (req, res) => dictionaryWordEndpoints.partialMatch(req, res));
router.post('/dictionary/upload', (req, res) => dictionaryWordEndpoints.upload(req, res));

router.get('/bonus/info', (req, res) => bonusWordEndpoints.info(req, res));
router.get('/bonus/match/:word', (req, res) => bonusWordEndpoints.match(req, res));
router.get('/bonus/partial/:letters', (req, res) => bonusWordEndpoints.partialMatch(req, res));
router.post('/bonus/upload', (req, res) => bonusWordEndpoints.upload(req, res));

router.get('/excluded/info', (req, res) => excludedWordEndpoints.info(req, res));
router.get('/excluded/match/:word', (req, res) => excludedWordEndpoints.match(req, res));
router.get('/excluded/partial/:letters', (req, res) => excludedWordEndpoints.partialMatch(req, res));
router.post('/excluded/upload', (req, res) => excludedWordEndpoints.upload(req, res));

router.get('/vacuum', adminEndpoints.vacuum);

module.exports = router;
