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
var mongoDBUrl = 'mongodb://javlonbek:12345rj98@fintech-shard-00-00-ahsxv.mongodb.net:27017,fintech-shard-00-01-ahsxv.mongodb.net:27017,fintech-shard-00-02-ahsxv.mongodb.net:27017/spring2019?ssl=true&replicaSet=fintech-shard-0&authSource=admin&retryWrites=true&w=majority';

//mongoDBUrl='mongodb+srv://javlonbek:12345rj98@spring2019-kebch.mongodb.net/test?retryWrites=true';

//var mongoDBUrl='mongodb+srv://javlonbek:12345rj98@fintech-ahsxv.mongodb.net/spring2019?retryWrites=true&w=majority';

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
	'mongo': mongoDBUrl,
	'cookie secret': 'JavlonbekIUT',
	'session': true,
	'session store': 'mongo',
	// 	'session store':function(session){
	// 		var MongoStore=require('connect-mongodb-session')(session);
	// 		var store = new MongoStore({
	// 	 		uri:mongoDBUrl,
	//   			collection:'mySessions'
	// 		});
	//                 store.on('error', function(error) {
	//                     console.log("Error on connecting to mongostore:",error);
	//                 });
	// 		return store;
	// 	},
	'auth': true,
	'user model': 'User',
	'auto update': true
});

// Load your project's Models
keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// 

keystone.set('locals', {
	_: require('lodash'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable,
});

// Load your project's Routes
keystone.set('routes', require('./routes'));


// Configure the navigation bar in Keystone's Admin UI
keystone.set('nav', {
	users: 'users',
	sections: 'sections',
	groups: 'groups',
	courses: 'courses',
	students: 'students',
	teachers: 'teachers'
});

// Start Keystone to connect to your database and initialise the web server

//require('./store-faces');


console.log('keystone starting');
keystone.start();
