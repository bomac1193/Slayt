#!/usr/bin/env node

/**
 * YouTube Data Integrity Stress Test
 * Tests for data loss, autosave, collection counts, and title persistence
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const YoutubeCollection = require('../models/YoutubeCollection');
const YoutubeVideo = require('../models/YoutubeVideo');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(70)}\n  ${msg}\n${'='.repeat(70)}${colors.reset}\n`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️ ${msg}${colors.reset}`),
  data: (msg) => console.log(`${colors.cyan}     ${msg}${colors.reset}`),
};

// Test results tracker
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, error = null) {
  testResults.tests.push({ name, passed, error });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postpilot');
    log.success('Connected to MongoDB');
  } catch (error) {
    log.error('MongoDB connection failed:' + error.message);
    process.exit(1);
  }
}

async function cleanupTestData(userId) {
  await YoutubeVideo.deleteMany({ userId });
  await YoutubeCollection.deleteMany({ userId });
}

async function testCreateAndUpdate() {
  log.header('📝 TEST: CREATE AND UPDATE VIDEOS');

  let testUser;
  try {
    // Create or get test user
    testUser = await User.findOne({ email: 'test@dataintegrity.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Data Integrity Test',
        email: 'test@dataintegrity.com',
        password: 'testpass123'
      });
    }
    log.success('Test user ready');

    // Cleanup any existing test data
    await cleanupTestData(testUser._id);

    // Create collection
    const collection = await YoutubeCollection.create({
      userId: testUser._id,
      name: 'Test Collection',
      description: 'Testing data integrity'
    });
    log.success(`Created collection: ${collection.name}`);

    // Test 1: Create video with title
    const video1 = await YoutubeVideo.create({
      userId: testUser._id,
      collectionId: collection._id,
      title: 'Test Video 1',
      description: 'This is a test'
    });
    log.success(`Created video with title: "${video1.title}"`);
    recordTest('Create video with title', true);

    // Test 2: Update video title
    video1.title = 'Updated Test Video 1';
    await video1.save();
    const updatedVideo1 = await YoutubeVideo.findById(video1._id);
    const titlePersisted = updatedVideo1.title === 'Updated Test Video 1';
    if (titlePersisted) {
      log.success(`Title update persisted: "${updatedVideo1.title}"`);
      recordTest('Update video title', true);
    } else {
      log.error(`Title did not persist. Expected: "Updated Test Video 1", Got: "${updatedVideo1.title}"`);
      recordTest('Update video title', false, 'Title did not persist');
    }

    // Test 3: Try to create video with empty title (should fail)
    try {
      await YoutubeVideo.create({
        userId: testUser._id,
        collectionId: collection._id,
        title: '',
        description: 'No title'
      });
      log.error('Created video with empty title (should have failed)');
      recordTest('Reject empty title', false, 'Empty title was accepted');
    } catch (error) {
      log.success('Correctly rejected empty title');
      recordTest('Reject empty title', true);
    }

    // Test 4: Try to update video with empty title (should fail)
    try {
      video1.title = '';
      await video1.save();
      log.error('Updated video with empty title (should have failed)');
      recordTest('Reject empty title update', false, 'Empty title update was accepted');
    } catch (error) {
      log.success('Correctly rejected empty title update');
      recordTest('Reject empty title update', true);
      video1.title = 'Updated Test Video 1'; // Reset
    }

    // Test 5: Create multiple videos
    const videos = [];
    for (let i = 2; i <= 10; i++) {
      const video = await YoutubeVideo.create({
        userId: testUser._id,
        collectionId: collection._id,
        title: `Test Video ${i}`,
        description: `Description for video ${i}`,
        position: i - 1
      });
      videos.push(video);
    }
    log.success(`Created ${videos.length} additional videos`);
    recordTest('Create multiple videos', true);

    // Test 6: Verify collection video count
    const collectionVideos = await YoutubeVideo.find({ collectionId: collection._id });
    const expectedCount = 10; // video1 + 9 more
    const actualCount = collectionVideos.length;
    if (actualCount === expectedCount) {
      log.success(`Collection has correct video count: ${actualCount}/${expectedCount}`);
      recordTest('Collection video count', true);
    } else {
      log.error(`Collection video count mismatch. Expected: ${expectedCount}, Got: ${actualCount}`);
      recordTest('Collection video count', false, `Count mismatch: ${actualCount}/${expectedCount}`);
    }

    // Test 7: Update all video titles rapidly (stress test)
    log.info('Rapidly updating all video titles...');
    const updatePromises = collectionVideos.map((video, index) => {
      video.title = `Rapidly Updated Video ${index + 1}`;
      return video.save();
    });
    await Promise.all(updatePromises);

    // Verify all titles persisted
    const updatedVideos = await YoutubeVideo.find({ collectionId: collection._id });
    const allTitlesPersisted = updatedVideos.every((video, index) =>
      video.title === `Rapidly Updated Video ${index + 1}`
    );

    if (allTitlesPersisted) {
      log.success('All rapid title updates persisted correctly');
      recordTest('Rapid title updates', true);
    } else {
      log.error('Some titles did not persist after rapid updates');
      recordTest('Rapid title updates', false, 'Some titles lost');
    }

    // Test 8: Update descriptions
    log.info('Updating descriptions...');
    for (const video of updatedVideos) {
      video.description = `Updated description for ${video.title}`;
      await video.save();
    }

    const videosWithDescriptions = await YoutubeVideo.find({
      collectionId: collection._id,
      description: { $exists: true, $ne: '' }
    });

    if (videosWithDescriptions.length === expectedCount) {
      log.success('All descriptions saved correctly');
      recordTest('Update descriptions', true);
    } else {
      log.error(`Description save failed. Expected: ${expectedCount}, Got: ${videosWithDescriptions.length}`);
      recordTest('Update descriptions', false, 'Some descriptions lost');
    }

    // Test 9: Test video file metadata
    log.info('Testing video file metadata...');
    const videoWithFile = updatedVideos[0];
    videoWithFile.videoFileName = 'test-video.mp4';
    videoWithFile.videoFileSize = 1024000; // 1MB
    await videoWithFile.save();

    const reloadedVideo = await YoutubeVideo.findById(videoWithFile._id);
    if (reloadedVideo.videoFileName === 'test-video.mp4' && reloadedVideo.videoFileSize === 1024000) {
      log.success('Video file metadata persisted correctly');
      recordTest('Video file metadata', true);
    } else {
      log.error('Video file metadata did not persist');
      recordTest('Video file metadata', false, 'Metadata lost');
    }

    // Cleanup
    await cleanupTestData(testUser._id);
    log.success('Cleaned up test data');

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    recordTest('Create and update test', false, error.message);
    if (testUser) {
      await cleanupTestData(testUser._id);
    }
  }
}

async function testConcurrentUpdates() {
  log.header('⚡ TEST: CONCURRENT UPDATES');

  let testUser;
  try {
    testUser = await User.findOne({ email: 'test@dataintegrity.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Data Integrity Test',
        email: 'test@dataintegrity.com',
        password: 'testpass123'
      });
    }

    await cleanupTestData(testUser._id);

    // Create collection and video
    const collection = await YoutubeCollection.create({
      userId: testUser._id,
      name: 'Concurrent Test Collection'
    });

    const video = await YoutubeVideo.create({
      userId: testUser._id,
      collectionId: collection._id,
      title: 'Concurrent Test Video'
    });

    log.success('Created test video for concurrent updates');

    // Simulate multiple concurrent updates
    const updates = [];
    for (let i = 0; i < 20; i++) {
      updates.push(
        YoutubeVideo.findByIdAndUpdate(
          video._id,
          { title: `Concurrent Update ${i}`, description: `Description ${i}` },
          { new: true, runValidators: true }
        )
      );
    }

    log.info('Running 20 concurrent updates...');
    await Promise.all(updates);

    // Verify final state
    const finalVideo = await YoutubeVideo.findById(video._id);
    if (finalVideo && finalVideo.title) {
      log.success(`Final video state exists with title: "${finalVideo.title}"`);
      recordTest('Concurrent updates', true);
    } else {
      log.error('Video lost data after concurrent updates');
      recordTest('Concurrent updates', false, 'Data lost');
    }

    await cleanupTestData(testUser._id);

  } catch (error) {
    log.error(`Concurrent test failed: ${error.message}`);
    recordTest('Concurrent updates', false, error.message);
    if (testUser) {
      await cleanupTestData(testUser._id);
    }
  }
}

async function testCollectionIntegrity() {
  log.header('📊 TEST: COLLECTION INTEGRITY');

  let testUser;
  try {
    testUser = await User.findOne({ email: 'test@dataintegrity.com' });
    if (!testUser) {
      testUser = await User.create({
        name: 'Data Integrity Test',
        email: 'test@dataintegrity.com',
        password: 'testpass123'
      });
    }

    await cleanupTestData(testUser._id);

    // Create 5 collections
    const collections = [];
    for (let i = 1; i <= 5; i++) {
      const collection = await YoutubeCollection.create({
        userId: testUser._id,
        name: `Collection ${i}`
      });
      collections.push(collection);

      // Add varying number of videos to each
      for (let j = 1; j <= i * 3; j++) {
        await YoutubeVideo.create({
          userId: testUser._id,
          collectionId: collection._id,
          title: `C${i} Video ${j}`
        });
      }
    }

    log.success('Created 5 collections with varying video counts');

    // Verify each collection's video count
    let allCountsCorrect = true;
    for (let i = 0; i < collections.length; i++) {
      const collection = collections[i];
      const expectedCount = (i + 1) * 3;
      const actualVideos = await YoutubeVideo.find({ collectionId: collection._id });
      const actualCount = actualVideos.length;

      if (actualCount === expectedCount) {
        log.success(`Collection ${i + 1}: ${actualCount}/${expectedCount} videos ✓`);
      } else {
        log.error(`Collection ${i + 1}: Count mismatch! Expected: ${expectedCount}, Got: ${actualCount}`);
        allCountsCorrect = false;
      }
    }

    if (allCountsCorrect) {
      recordTest('Collection video counts', true);
    } else {
      recordTest('Collection video counts', false, 'Some counts incorrect');
    }

    // Test deleting a video and checking count
    const firstCollection = collections[0];
    const videosInFirst = await YoutubeVideo.find({ collectionId: firstCollection._id });
    await YoutubeVideo.findByIdAndDelete(videosInFirst[0]._id);

    const remainingVideos = await YoutubeVideo.find({ collectionId: firstCollection._id });
    if (remainingVideos.length === videosInFirst.length - 1) {
      log.success('Video deletion reflected in count correctly');
      recordTest('Video deletion count', true);
    } else {
      log.error('Video deletion count mismatch');
      recordTest('Video deletion count', false, 'Count not updated');
    }

    await cleanupTestData(testUser._id);

  } catch (error) {
    log.error(`Collection integrity test failed: ${error.message}`);
    recordTest('Collection integrity', false, error.message);
    if (testUser) {
      await cleanupTestData(testUser._id);
    }
  }
}

async function runAllTests() {
  console.log(`\n${colors.bright}${colors.cyan}
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║          YOUTUBE DATA INTEGRITY - COMPREHENSIVE STRESS TEST        ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
${colors.reset}`);

  await connectDB();

  await testCreateAndUpdate();
  await testConcurrentUpdates();
  await testCollectionIntegrity();

  // Print summary
  log.header('📊 TEST RESULTS');

  testResults.tests.forEach(test => {
    if (test.passed) {
      log.success(`${test.name}`);
    } else {
      log.error(`${test.name}`);
      if (test.error) {
        log.data(`Error: ${test.error}`);
      }
    }
  });

  console.log(`\n${colors.bright}`);
  const passRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
  const status = testResults.failed === 0 ? colors.green : colors.yellow;
  console.log(`${status}📊 Overall: ${testResults.passed}/${testResults.passed + testResults.failed} tests passed (${passRate}%)${colors.reset}\n`);

  await mongoose.disconnect();
  log.success('Disconnected from MongoDB');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
