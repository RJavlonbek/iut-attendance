var keystone=require('keystone');
var Types=keystone.Field.Types;

var Student=new keystone.List('Student',{
	map: { name: 'studentId' },
	label: 'Student id (u*******)',
	autokey: { path: 'slug', from: 'firstname lastname', unique: true }
});

var myStorage = new keystone.Storage({
	adapter:keystone.Storage.Adapters.FS,
	fs:{
		path:keystone.expandPath('./public/uploads/students'),
		publicPath:'/public/uploads/students'
	}
});


Student.add({
	studentId:{
		type:String,
		required:true,
		default:'not_set'
	},
	group:{
		type:Types.Relationship,
		ref:'Group'
	},
	photo:{
		type:Types.File,
		storage:myStorage
	},
	firstname:{
		type:String,
	},
	lastname:{
		type:String,
	}
});

Student.defaultColumns='id, group, firstname';
Student.register();