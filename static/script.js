// // getting-started.js
// const mongoose = require('mongoose');


// mongoose.connect('mongodb://127.0.0.1:27017/test', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });
// const db = mongoose.connection;

// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('connected', () => {
//   console.log('Connected to MongoDB');
// });
// db.on('disconnected', () => {
//   console.log('Disconnected from MongoDB');
// });
// const Schema = mongoose.Schema;

// const userSchema = new Schema({
//   name: String,
//   email: String,
//   age: Number
// });

// const User = mongoose.model('User', userSchema);
// // Create a new user
// const newUser = new User({ name: 'John', email: 'john@example.com', age: 30 });
// newUser.save()
//   .then(user => {
//     console.log('User saved:', user);
//   })
//   .catch(err => {
//     console.error('Error saving user:', err);
//   });

// // Find all users
// User.find()
//   .then(users => {
//     console.log('All users:', users);
//   })
//   .catch(err => {
//     console.error('Error finding users:', err);
//   });


