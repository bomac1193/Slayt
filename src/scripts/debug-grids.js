require('dotenv').config();
const mongoose = require('mongoose');

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/postpanda');

  const User = require('../models/User');
  const Profile = require('../models/Profile');
  const Grid = require('../models/Grid');

  // Find main user
  const user = await User.findOne({ email: 'bomac1193@gmail.com' });
  console.log('User:', user.email, user._id.toString());

  // Get all profiles for user
  const profiles = await Profile.find({ userId: user._id });
  console.log('\nProfiles:');
  profiles.forEach(p => {
    console.log('  - ' + p.name + ' (' + p._id + ') isDefault: ' + p.isDefault);
  });

  // Get all grids for user
  const grids = await Grid.find({ userId: user._id });
  console.log('\nAll Grids for user:');
  grids.forEach(g => {
    console.log('  - ' + g.name + ' (' + g._id + ') profileId: ' + (g.profileId || 'NONE'));
  });

  // Check if any grids have no profileId
  const gridsWithoutProfile = grids.filter(g => !g.profileId);
  console.log('\nGrids without profileId: ' + gridsWithoutProfile.length);

  // Check grids per profile
  console.log('\nGrids per profile:');
  for (const profile of profiles) {
    const profileGrids = grids.filter(g => g.profileId && g.profileId.toString() === profile._id.toString());
    console.log('  ' + profile.name + ': ' + profileGrids.length + ' grids');
  }

  await mongoose.disconnect();
}

debug().catch(console.error);
