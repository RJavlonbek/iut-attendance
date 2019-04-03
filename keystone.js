// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').config();

// Require keystone
var keystone = require('keystone');
var handlebars = require('express-handlebars');

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.
//var MongoStore=require('connect-mongodb-session')(session);

var mongoDBUrl='mongodb://javlonbek:12345rj98@spring2019-shard-00-00-kebch.mongodb.net:27017,spring2019-shard-00-01-kebch.mongodb.net:27017,spring2019-shard-00-02-kebch.mongodb.net:27017/test?ssl=true&replicaSet=Spring2019-shard-0&authSource=admin&retryWrites=true'
keystone.init({
	'name': 'IUT',
	'brand': 'IUT',

	'less': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': '.hbs',

	'custom engine': handlebars.create({
		layoutsDir: 'templates/views/layouts',
		partialsDir: 'templates/views/partials',
		defaultLayout: 'default',
		helpers: new require('./templates/views/helpers')(),
		extname: '.hbs',
	}).engine,
	'mongo':mongoDBUrl,
	'cookie secret':'JavlonbekIUT',
	'session':true,
	'session store':function(session){
		return new require('connect-mongodb-session')(session)({
			uri:mongoDBUrl,
  			collection:'mySessions'
		});
	},
	'auth': true,
	'user model': 'User',
});

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js
keystone.set('locals', {
	_: require('lodash'),
	env: 'development',
	utils: keystone.utils,
	editable: keystone.content.editable,
});

// Load your project's Routes
keystone.set('routes', require('./routes'));


// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	enquiries: 'enquiries',
	users: 'users',
});

// Start Keystone to connect to your database and initialise the web server

//require('./store-faces');



keystone.start();
