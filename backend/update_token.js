require('dotenv').config();
const mongoose = require('mongoose');
const Settings = require('./src/models/Settings');

async function updateToken() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const settings = await Settings.findOne();
    if(settings) {
        settings.metaAccessToken = 'EAAVU6YQnqL4BRmPHsXqP7ZBHqpLHYj6iSu9EhT0rWUMRgCuZBbOc9BClvZCX3KhG3xpoQT930uJO8XrEysezrp85j27VbWhGHycIPd2SIY5YSPC6p7f5IqSxwF1hGMn7hY4IHZA35RtQheh8mKpN1NYfWfPYFKtPBU4ZCUvQOKbXT4mt7MKdXTMZCeWUsxlNDkYiBDaez89Cxh0pKn0ng5HhIMALJ5pkapAin58TNkxSokHz6g5IJlU6rVnQMvvdFL6cjtxQrkQGExHzrf1ZA9q';
        await settings.save();
        console.log('✅ New token successfully saved!');
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
updateToken();
