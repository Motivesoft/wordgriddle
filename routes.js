// External requires
const express = require('express');

const adminEndpoints = require('./adminEndpoints');
const { dictionaryWordOperations, bonusWordOperations, excludedWordOperations } = require('./WordListOperations');
const { editablePuzzleOperations, publishedPuzzleOperations } = require('./PuzzleOperations');
const { userOperations } = require('./UserOperations');

const router = express.Router();

// Define API routes

// Word list management
// TODO work out which of these end points we need - it won't be all for each word type
router.get('/dictionary/info', (req, res) => dictionaryWordOperations.getInformation(req, res));
router.get('/dictionary/words', (req, res) => dictionaryWordOperations.getWordList(req, res));
router.get('/dictionary/validate/:word', (req, res) => dictionaryWordOperations.validateWord(req, res));
router.get('/dictionary/validate-prefix/:letters', (req, res) => dictionaryWordOperations.validateWordPrefix(req, res));
router.get('/dictionary/download', (req, res) => dictionaryWordOperations.download(req, res));
router.post('/dictionary/upload', (req, res) => dictionaryWordOperations.upload(req, res));
router.post('/dictionary/add', (req, res) => dictionaryWordOperations.addWords(req, res));
router.post('/dictionary/remove', (req, res) => dictionaryWordOperations.removeWords(req, res));

router.get('/bonus/info', (req, res) => bonusWordOperations.getInformation(req, res));
router.get('/bonus/words', (req, res) => bonusWordOperations.getWordList(req, res));
router.get('/bonus/validate/:word', (req, res) => bonusWordOperations.validateWord(req, res));
router.get('/bonus/validate-prefix/:letters', (req, res) => bonusWordOperations.validateWordPrefix(req, res));
router.get('/bonus/download', (req, res) => bonusWordOperations.download(req, res));
router.post('/bonus/upload', (req, res) => bonusWordOperations.upload(req, res));
router.post('/bonus/add', (req, res) => bonusWordOperations.addWords(req, res));
router.post('/bonus/remove', (req, res) => bonusWordOperations.removeWords(req, res));

router.get('/excluded/info', (req, res) => excludedWordOperations.getInformation(req, res));
router.get('/excluded/words', (req, res) => excludedWordOperations.getWordList(req, res));
router.get('/excluded/validate/:word', (req, res) => excludedWordOperations.validateWord(req, res));
router.get('/excluded/validate-prefix/:letters', (req, res) => excludedWordOperations.validateWordPrefix(req, res));
router.get('/excluded/download', (req, res) => excludedWordOperations.download(req, res));
router.post('/excluded/upload', (req, res) => excludedWordOperations.upload(req, res));
router.post('/excluded/add', (req, res) => excludedWordOperations.addWords(req, res));
router.post('/excluded/remove', (req, res) => excludedWordOperations.removeWords(req, res));

// User management
// TODO consider merging this with 'admin' stuff
router.get('/user/users', (req, res) => userOperations.getUserList(req, res));

// System admin and management
router.get('/admin/vacuum', adminEndpoints.vacuum);
router.get('/admin/shutdown', adminEndpoints.shutdown);

// Puzzle design
router.get('/designer/puzzles', (req, res) => editablePuzzleOperations.getPuzzleList(req, res));
router.get('/designer/label', (req, res) => editablePuzzleOperations.createPuzzleLabel(req, res));

module.exports = router;
