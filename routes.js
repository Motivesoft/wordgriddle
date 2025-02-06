// External requires
const express = require('express');

const { dictionaryWordOperations, bonusWordOperations, excludedWordOperations } = require('./WordListOperations');
const { editablePuzzleOperations, publishedPuzzleOperations } = require('./PuzzleOperations');
const { adminOperations } = require('./AdminOperations');

const router = express.Router();

// Define API routes

// Word list management
// TODO work out which of these end points we need - it won't be all for each word type
router.get('/dictionary/info', (req, res) => dictionaryWordOperations.getInformationEndpoint(req, res));
router.get('/dictionary/words', (req, res) => dictionaryWordOperations.getWordsEndpoint(req, res));
router.get('/dictionary/validate/:word', (req, res) => dictionaryWordOperations.validateWordEndpoint(req, res));
router.get('/dictionary/validate-prefix/:letters', (req, res) => dictionaryWordOperations.validateWordPrefixEndpoint(req, res));
router.get('/dictionary/download', (req, res) => dictionaryWordOperations.downloadEndpoint(req, res));
router.post('/dictionary/upload', (req, res) => dictionaryWordOperations.uploadEndpoint(req, res));
router.post('/dictionary/add', (req, res) => dictionaryWordOperations.addWordsEndpoint(req, res));
router.post('/dictionary/remove', (req, res) => dictionaryWordOperations.removeWordsEndpoint(req, res));

router.get('/bonus/info', (req, res) => bonusWordOperations.getInformationEndpoint(req, res));
router.get('/bonus/words', (req, res) => bonusWordOperations.getWordsEndpoint(req, res));
router.get('/bonus/validate/:word', (req, res) => bonusWordOperations.validateWordEndpoint(req, res));
router.get('/bonus/validate-prefix/:letters', (req, res) => bonusWordOperations.validateWordPrefixEndpoint(req, res));
router.get('/bonus/download', (req, res) => bonusWordOperations.downloadEndpoint(req, res));
router.post('/bonus/upload', (req, res) => bonusWordOperations.uploadEndpoint(req, res));
router.post('/bonus/add', (req, res) => bonusWordOperations.addWordsEndpoint(req, res));
router.post('/bonus/remove', (req, res) => bonusWordOperations.removeWordsEndpoint(req, res));

router.get('/excluded/info', (req, res) => excludedWordOperations.getInformationEndpoint(req, res));
router.get('/excluded/words', (req, res) => excludedWordOperations.getWordsEndpoint(req, res));
router.get('/excluded/validate/:word', (req, res) => excludedWordOperations.validateWordEndpoint(req, res));
router.get('/excluded/validate-prefix/:letters', (req, res) => excludedWordOperations.validateWordPrefixEndpoint(req, res));
router.get('/excluded/download', (req, res) => excludedWordOperations.downloadEndpoint(req, res));
router.post('/excluded/upload', (req, res) => excludedWordOperations.uploadEndpoint(req, res));
router.post('/excluded/add', (req, res) => excludedWordOperations.addWordsEndpoint(req, res));
router.post('/excluded/remove', (req, res) => excludedWordOperations.removeWordsEndpoint(req, res));

// System admin and management, including users
router.get('/admin/users', (req, res) => adminOperations.getUsersEndpoint(req, res));
router.get('/admin/vacuum', (req, res) => adminOperations.vacuumEndpoint(req, res));
router.get('/admin/shutdown', (req, res) => adminOperations.shutdownEndpoint(req, res));

// Puzzle design
// TODO turn 'puzzles' into getUnpublishedPuzzles for designer.
router.get('/designer/puzzles', (req, res) => editablePuzzleOperations.getPuzzlesEndpoint(req, res));
router.get('/designer/puzzle/:id', (req, res) => editablePuzzleOperations.getPuzzleEndpoint(req, res));
router.post('/designer/update-letters/:id', (req, res) => editablePuzzleOperations.updatePuzzleLettersEndpoint(req, res));
router.get('/designer/create', (req, res) => editablePuzzleOperations.createPuzzleEndpoint(req, res));

module.exports = router;
