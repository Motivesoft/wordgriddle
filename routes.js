// External requires
const express = require('express');

const adminEndpoints = require('./adminEndpoints');
const { dictionaryWordOperations, bonusWordOperations, excludedWordOperations } = require('./WordListOperations');

const router = express.Router();

// Define API routes

// Word list management
// Route to instances. Use the 'arrow function' for readability, but could also use 'instance.method.bind(instance)'
router.get('/dictionary/info', (req, res) => dictionaryWordOperations.getInformation(req, res));
router.get('/dictionary/validate/:word', (req, res) => dictionaryWordOperations.validateWord(req, res));
router.get('/dictionary/validate-prefix/:letters', (req, res) => dictionaryWordOperations.validateWordPrefix(req, res));
router.post('/dictionary/upload', (req, res) => dictionaryWordOperations.upload(req, res));

router.get('/bonus/info', (req, res) => bonusWordOperations.getInformation(req, res));
router.get('/bonus/validate/:word', (req, res) => bonusWordOperations.validateWord(req, res));
router.get('/bonus/validate-prefix/:letters', (req, res) => bonusWordOperations.validateWordPrefix(req, res));
router.post('/bonus/upload', (req, res) => bonusWordOperations.upload(req, res));

router.get('/excluded/info', (req, res) => excludedWordOperations.getInformation(req, res));
router.get('/excluded/validate/:word', (req, res) => excludedWordOperations.validateWord(req, res));
router.get('/excluded/validate-prefix/:letters', (req, res) => excludedWordOperations.validateWordPrefix(req, res));
router.post('/excluded/upload', (req, res) => excludedWordOperations.upload(req, res));

router.get('/vacuum', adminEndpoints.vacuum);

module.exports = router;
