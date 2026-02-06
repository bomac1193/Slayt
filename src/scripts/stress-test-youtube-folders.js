#!/usr/bin/env node

/**
 * YouTube Folder Creation Stress Test
 * Tests folder creation, persistence, and data integrity
 */

const mongoose = require('mongoose');
const YoutubeCollection = require('../models/YoutubeCollection');
require('dotenv').config();

const TEST_USER_ID = '691bc0221ad6014fd7ad9f28';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testNumber, description) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`TEST ${testNumber}: ${description}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logPass(message) {
  log(`✓ ${message}`, 'green');
}

function logFail(message) {
  log(`✗ ${message}`, 'red');
}

async function cleanupTestData() {
  log('\nCleaning up test data...', 'yellow');
  await YoutubeCollection.deleteMany({
    userId: TEST_USER_ID,
    name: { $regex: /^(Test Folder|New Collection|Stress Test)/ }
  });
  logPass('Test data cleaned up');
}

async function runTests() {
  try {
    // Connect to MongoDB
    log('\nConnecting to MongoDB...', 'blue');
    await mongoose.connect(process.env.MONGODB_URI);
    logPass('Connected to MongoDB');

    // Cleanup before tests
    await cleanupTestData();

    let testsPassed = 0;
    let testsFailed = 0;

    // TEST 1: Create folder with collection
    logTest(1, 'Create folder with collection');
    try {
      const collection1 = new YoutubeCollection({
        userId: TEST_USER_ID,
        name: 'Test Collection 1',
        folder: 'Test Folder 1'
      });
      await collection1.save();

      const found = await YoutubeCollection.findById(collection1._id);
      if (found && found.folder === 'Test Folder 1') {
        logPass('Folder created and persisted correctly');
        testsPassed++;
      } else {
        logFail(`Folder not persisted correctly: ${found?.folder}`);
        testsFailed++;
      }
    } catch (error) {
      logFail(`Error: ${error.message}`);
      testsFailed++;
    }

    // TEST 2: Create multiple collections in same folder
    logTest(2, 'Create multiple collections in same folder');
    try {
      const collections = await Promise.all([
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Test Collection 2A',
          folder: 'Test Folder 2'
        }).save(),
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Test Collection 2B',
          folder: 'Test Folder 2'
        }).save(),
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Test Collection 2C',
          folder: 'Test Folder 2'
        }).save()
      ]);

      const foundCollections = await YoutubeCollection.find({
        userId: TEST_USER_ID,
        folder: 'Test Folder 2'
      });

      if (foundCollections.length === 3) {
        logPass(`All 3 collections in folder found: ${foundCollections.length}`);
        testsPassed++;
      } else {
        logFail(`Expected 3 collections, found ${foundCollections.length}`);
        testsFailed++;
      }
    } catch (error) {
      logFail(`Error: ${error.message}`);
      testsFailed++;
    }

    // TEST 3: Folder with null value (root)
    logTest(3, 'Create collection in root folder (null)');
    try {
      const collection3 = new YoutubeCollection({
        userId: TEST_USER_ID,
        name: 'Test Collection 3',
        folder: null
      });
      await collection3.save();

      const found = await YoutubeCollection.findById(collection3._id);
      if (found && found.folder === null) {
        logPass('Root folder (null) persisted correctly');
        testsPassed++;
      } else {
        logFail(`Root folder not null: ${found?.folder}`);
        testsFailed++;
      }
    } catch (error) {
      logFail(`Error: ${error.message}`);
      testsFailed++;
    }

    // TEST 4: Rename folder (update all collections)
    logTest(4, 'Rename folder by updating all collections');
    try {
      // Create collections in folder
      await Promise.all([
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Test Collection 4A',
          folder: 'Old Folder Name'
        }).save(),
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Test Collection 4B',
          folder: 'Old Folder Name'
        }).save()
      ]);

      // Rename folder
      await YoutubeCollection.updateMany(
        { userId: TEST_USER_ID, folder: 'Old Folder Name' },
        { folder: 'New Folder Name' }
      );

      const oldCount = await YoutubeCollection.countDocuments({
        userId: TEST_USER_ID,
        folder: 'Old Folder Name'
      });

      const newCount = await YoutubeCollection.countDocuments({
        userId: TEST_USER_ID,
        folder: 'New Folder Name'
      });

      if (oldCount === 0 && newCount === 2) {
        logPass(`Folder renamed: 0 in old, 2 in new`);
        testsPassed++;
      } else {
        logFail(`Rename failed: ${oldCount} in old, ${newCount} in new`);
        testsFailed++;
      }
    } catch (error) {
      logFail(`Error: ${error.message}`);
      testsFailed++;
    }

    // TEST 5: Drag and drop (move collection to different folder)
    logTest(5, 'Move collection to different folder (drag-drop)');
    try {
      const collection5 = new YoutubeCollection({
        userId: TEST_USER_ID,
        name: 'Test Collection 5',
        folder: 'Source Folder'
      });
      await collection5.save();

      // Move to target folder
      collection5.folder = 'Target Folder';
      await collection5.save();

      const found = await YoutubeCollection.findById(collection5._id);
      if (found && found.folder === 'Target Folder') {
        logPass('Collection moved to new folder successfully');
        testsPassed++;
      } else {
        logFail(`Move failed: ${found?.folder}`);
        testsFailed++;
      }
    } catch (error) {
      logFail(`Error: ${error.message}`);
      testsFailed++;
    }

    // TEST 6: Group collections by folder
    logTest(6, 'Group collections by folder (UI simulation)');
    try {
      // Create collections across multiple folders
      await Promise.all([
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Stress Test A1',
          folder: 'Folder A'
        }).save(),
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Stress Test A2',
          folder: 'Folder A'
        }).save(),
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Stress Test B1',
          folder: 'Folder B'
        }).save(),
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Stress Test C1',
          folder: null
        }).save()
      ]);

      const allCollections = await YoutubeCollection.find({
        userId: TEST_USER_ID,
        name: { $regex: /^Stress Test/ }
      });

      // Group by folder (like frontend does)
      const grouped = allCollections.reduce((acc, col) => {
        const folder = col.folder || 'root';
        if (!acc[folder]) acc[folder] = [];
        acc[folder].push(col);
        return acc;
      }, {});

      const folderACount = grouped['Folder A']?.length || 0;
      const folderBCount = grouped['Folder B']?.length || 0;
      const rootCount = grouped['root']?.length || 0;

      if (folderACount === 2 && folderBCount === 1 && rootCount === 1) {
        logPass(`Grouping correct: Folder A=${folderACount}, Folder B=${folderBCount}, Root=${rootCount}`);
        testsPassed++;
      } else {
        logFail(`Grouping failed: Folder A=${folderACount}, Folder B=${folderBCount}, Root=${rootCount}`);
        testsFailed++;
      }
    } catch (error) {
      logFail(`Error: ${error.message}`);
      testsFailed++;
    }

    // TEST 7: Rapid folder creation (stress test)
    logTest(7, 'Rapid folder creation (10 folders simultaneously)');
    try {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          new YoutubeCollection({
            userId: TEST_USER_ID,
            name: `Rapid Test Collection ${i}`,
            folder: `Rapid Folder ${i}`
          }).save()
        );
      }

      const results = await Promise.all(promises);
      const uniqueFolders = new Set(results.map(c => c.folder));

      if (results.length === 10 && uniqueFolders.size === 10) {
        logPass(`All 10 folders created correctly`);
        testsPassed++;
      } else {
        logFail(`Expected 10 unique folders, got ${uniqueFolders.size}`);
        testsFailed++;
      }
    } catch (error) {
      logFail(`Error: ${error.message}`);
      testsFailed++;
    }

    // TEST 8: Empty folder name handling
    logTest(8, 'Empty/whitespace folder names');
    try {
      const emptyTest = new YoutubeCollection({
        userId: TEST_USER_ID,
        name: 'Test Collection 8',
        folder: '   '  // Whitespace only
      });
      await emptyTest.save();

      const found = await YoutubeCollection.findById(emptyTest._id);
      // Mongoose trim should handle this
      if (found && (found.folder === '' || found.folder === null || found.folder === undefined)) {
        logPass('Whitespace folder name handled correctly (trimmed to empty)');
        testsPassed++;
      } else {
        logFail(`Whitespace not handled: "${found?.folder}"`);
        testsFailed++;
      }
    } catch (error) {
      logFail(`Error: ${error.message}`);
      testsFailed++;
    }

    // TEST 9: Special characters in folder names
    logTest(9, 'Special characters in folder names');
    try {
      const specialChars = [
        'Folder with spaces',
        'Folder-with-dashes',
        'Folder_with_underscores',
        'Folder.with.dots',
        'Folder (with parens)',
        'Folder & Symbols!'
      ];

      const promises = specialChars.map((folderName, i) =>
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: `Special Char Test ${i}`,
          folder: folderName
        }).save()
      );

      const results = await Promise.all(promises);
      const allSaved = results.every(r => r._id);

      if (allSaved) {
        logPass(`All special character folder names saved correctly`);
        testsPassed++;
      } else {
        logFail('Some special character folder names failed');
        testsFailed++;
      }
    } catch (error) {
      logFail(`Error: ${error.message}`);
      testsFailed++;
    }

    // TEST 10: Position ordering within folders
    logTest(10, 'Position ordering within folders');
    try {
      await Promise.all([
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Position Test C',
          folder: 'Position Test Folder',
          position: 2
        }).save(),
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Position Test A',
          folder: 'Position Test Folder',
          position: 0
        }).save(),
        new YoutubeCollection({
          userId: TEST_USER_ID,
          name: 'Position Test B',
          folder: 'Position Test Folder',
          position: 1
        }).save()
      ]);

      const collections = await YoutubeCollection.find({
        userId: TEST_USER_ID,
        folder: 'Position Test Folder'
      }).sort({ position: 1 });

      const names = collections.map(c => c.name);
      const expectedOrder = ['Position Test A', 'Position Test B', 'Position Test C'];
      const isOrdered = JSON.stringify(names) === JSON.stringify(expectedOrder);

      if (isOrdered) {
        logPass(`Position ordering works: ${names.join(', ')}`);
        testsPassed++;
      } else {
        logFail(`Wrong order: ${names.join(', ')}`);
        testsFailed++;
      }
    } catch (error) {
      logFail(`Error: ${error.message}`);
      testsFailed++;
    }

    // Cleanup after tests
    await cleanupTestData();

    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    log('TEST SUMMARY', 'cyan');
    log('='.repeat(60), 'cyan');
    log(`Total Tests: ${testsPassed + testsFailed}`);
    logPass(`Passed: ${testsPassed}`);
    if (testsFailed > 0) {
      logFail(`Failed: ${testsFailed}`);
    }
    log(`Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%\n`);

    if (testsFailed === 0) {
      log('🎉 ALL TESTS PASSED! Folder functionality is 100% working!', 'green');
    } else {
      log('⚠️  Some tests failed. Review the errors above.', 'red');
    }

    process.exit(testsFailed === 0 ? 0 : 1);
  } catch (error) {
    logFail(`\nFatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runTests();
