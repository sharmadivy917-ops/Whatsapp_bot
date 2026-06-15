const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://kinggaming7890123_db_user:mYA7wTyGgup9sC8G@cluster0.ssqeo8e.mongodb.net/vegbot?appName=Cluster0').then(async () => {
  const db = mongoose.connection.db;
  await db.collection('settings').updateOne(
    {},
    { $set: { 
        metaAccessToken: 'EAAVU6YQnqL4BRuOffRZAnTfefuhsURGjZBBOM5BdJmMnFbXyl5n6CkQiNkL3iEqg6fSh2tgvjst7GxXkrO2HP5rXZAcu0gA00ufEykzPCHZA4CsvyT5ZBZAHSYOA9R3X1ZAnGfHOPxC8Dc3djvYdgQjWU7fLZBkEtgocdU7gtHeVZCsgOJulazMDFbjysiYnRySVudmoAAfoIAJMceKbR0EZAeawqzNoHQbGJFew7TBzcAWW8r4Lgj6ZCOZBQHKfdmhSs4nT1EPms4JqZBGtGGltNQybg',
        metaPhoneNumberId: '1178261698704607' 
      } 
    },
    { upsert: true }
  );
  console.log('Successfully updated Meta keys in remote MongoDB!');
  process.exit();
});
